const axios = require('axios');
const { query } = require('../db/pg');
const { encrypt, decrypt } = require('../lib/crypto');

const REFRESH_WINDOW_DAYS = 7;

async function refreshExpiringTokens() {
  const windowDate = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const result = await query(
    `SELECT id, account_id, platform, access_token
     FROM account_credentials
     WHERE expires_at <= $1
     ORDER BY expires_at ASC`,
    [windowDate]
  );

  if (result.rows.length === 0) return;
  console.log(`[token-refresh] Refreshing ${result.rows.length} expiring credentials`);

  for (const cred of result.rows) {
    try {
      const currentToken = decrypt(cred.access_token);
      const refreshRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: currentToken,
        },
      });
      const newToken = refreshRes.data.access_token;
      const expiresIn = refreshRes.data.expires_in || 5184000;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await query(
        `UPDATE account_credentials SET access_token = $1, expires_at = $2 WHERE id = $3`,
        [encrypt(newToken), expiresAt, cred.id]
      );
      console.log(`[token-refresh] Refreshed cred ${cred.id} (account ${cred.account_id})`);
    } catch (err) {
      console.error(`[token-refresh] Failed for cred ${cred.id}:`, err.message);
    }
  }
}

module.exports = { refreshExpiringTokens };
