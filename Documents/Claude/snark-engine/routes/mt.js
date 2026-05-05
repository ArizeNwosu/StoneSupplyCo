const express = require('express');
const router = express.Router();
const { query } = require('../db/pg');
const { decrypt } = require('../lib/crypto');
const InstagramAPI = require('../instagram-api');

const VALID_INTENSITIES = ['safe', 'balanced', 'spicy'];

// GET /api/mt/status
router.get('/status', async (req, res) => {
  try {
    const [acctRes, credRes] = await Promise.all([
      query(
        `SELECT id, email, voice_intensity, auto_post_enabled,
                replies_used, replies_limit
         FROM accounts WHERE id = $1`,
        [req.account.account_id]
      ),
      query(
        `SELECT platform, username, platform_account_id, expires_at, connected_at
         FROM account_credentials
         WHERE account_id = $1 AND platform = 'instagram'`,
        [req.account.account_id]
      ),
    ]);
    res.json({
      account: acctRes.rows[0],
      credential: credRes.rows[0] || null,
    });
  } catch (err) {
    console.error('[mt/status]', err.message);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// PATCH /api/mt/settings
router.patch('/settings', async (req, res) => {
  const { voice_intensity, auto_post_enabled } = req.body;

  if (voice_intensity !== undefined && !VALID_INTENSITIES.includes(voice_intensity)) {
    return res.status(400).json({ error: 'voice_intensity must be safe, balanced, or spicy' });
  }
  if (auto_post_enabled !== undefined && typeof auto_post_enabled !== 'boolean') {
    return res.status(400).json({ error: 'auto_post_enabled must be a boolean' });
  }

  const fields = [];
  const values = [];
  if (voice_intensity !== undefined) {
    fields.push(`voice_intensity = $${fields.length + 1}`);
    values.push(voice_intensity);
  }
  if (auto_post_enabled !== undefined) {
    fields.push(`auto_post_enabled = $${fields.length + 1}`);
    values.push(auto_post_enabled);
  }
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    values.push(req.account.account_id);
    await query(
      `UPDATE accounts SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[mt/settings]', err.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
