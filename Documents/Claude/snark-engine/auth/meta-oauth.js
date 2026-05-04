const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pg');
const { encrypt } = require('../lib/crypto');
const { authenticate } = require('./middleware');
const { extractVoice } = require('../jobs/voice-extraction');

const router = express.Router();

router.get('/connect/instagram', authenticate, (req, res) => {
  const state = jwt.sign(
    { account_id: req.account.account_id, platform: 'instagram' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: process.env.META_REDIRECT_URI,
    scope: 'instagram_basic,instagram_manage_comments,pages_manage_engagement',
    response_type: 'code',
    state,
  });
  res.json({ url: `https://www.facebook.com/v21.0/dialog/oauth?${params}` });
});

router.get('/callback/instagram', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) return res.redirect(`/?error=${encodeURIComponent(error)}`);
  if (!code || !state) return res.redirect('/?error=missing_params');

  let statePayload;
  try {
    statePayload = jwt.verify(state, process.env.JWT_SECRET);
  } catch {
    return res.redirect('/?error=invalid_state');
  }

  const { account_id, platform } = statePayload;

  try {
    const shortRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      },
    });
    const shortToken = shortRes.data.access_token;

    const longRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });
    const longToken = longRes.data.access_token;
    const expiresIn = longRes.data.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const pagesRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
      params: {
        access_token: longToken,
        fields: 'id,name,instagram_business_account{id,username}',
      },
    });
    const page = (pagesRes.data.data || []).find(p => p.instagram_business_account);
    if (!page) return res.redirect('/?error=no_instagram_business_account');

    const { id: platformAccountId, username } = page.instagram_business_account;

    await query(
      `INSERT INTO account_credentials
         (account_id, platform, access_token, platform_account_id, username, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ON CONSTRAINT uq_creds_account_platform
       DO UPDATE SET
         access_token        = EXCLUDED.access_token,
         platform_account_id = EXCLUDED.platform_account_id,
         username            = EXCLUDED.username,
         expires_at          = EXCLUDED.expires_at,
         connected_at        = now()`,
      [account_id, platform, encrypt(longToken), platformAccountId, username, expiresAt]
    );

    extractVoice(account_id, longToken, platformAccountId, username).catch(err =>
      console.error('[voice-extraction] background error:', err.message)
    );

    res.redirect('/');
  } catch (err) {
    console.error('[meta-oauth/callback]', err.message);
    res.redirect(`/?error=${encodeURIComponent('oauth_failed')}`);
  }
});

router.get('/status', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT platform, username, platform_account_id, expires_at, connected_at
       FROM account_credentials WHERE account_id = $1`,
      [req.account.account_id]
    );
    res.json({ credentials: result.rows });
  } catch (err) {
    console.error('[meta-oauth/status]', err.message);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

router.delete('/:platform', authenticate, async (req, res) => {
  try {
    await query(
      'DELETE FROM account_credentials WHERE account_id = $1 AND platform = $2',
      [req.account.account_id, req.params.platform]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[meta-oauth/disconnect]', err.message);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

module.exports = router;
