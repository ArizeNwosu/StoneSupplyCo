const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pg');

const router = express.Router();
const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 1 : 10;
const TOKEN_TTL = '30d';

router.post('/signup', async (req, res) => {
  const { email, password, invite_code } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

  const requiredCode = process.env.INVITE_CODE;
  if (requiredCode && invite_code !== requiredCode) {
    return res.status(403).json({ error: 'Invalid invite code' });
  }

  try {
    const existing = await query('SELECT id FROM accounts WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO accounts (email, password_hash) VALUES ($1, $2)
       RETURNING id, email, is_admin, plan`,
      [email.toLowerCase(), password_hash],
    );
    const account = result.rows[0];
    const token = jwt.sign(
      { account_id: account.id, email: account.email, is_admin: account.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL },
    );
    res.json({ token, account: { id: account.id, email: account.email, plan: account.plan } });
  } catch (err) {
    console.error('[auth/signup]', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const result = await query('SELECT * FROM accounts WHERE email = $1', [email.toLowerCase()]);
    const account = result.rows[0];

    const INVALID = 'Invalid email or password';
    if (!account) return res.status(401).json({ error: INVALID });
    const match = await bcrypt.compare(password, account.password_hash);
    if (!match) return res.status(401).json({ error: INVALID });

    const token = jwt.sign(
      { account_id: account.id, email: account.email, is_admin: account.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL },
    );
    res.json({ token, account: { id: account.id, email: account.email, plan: account.plan } });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
