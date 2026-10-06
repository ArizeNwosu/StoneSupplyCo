import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('configuration documentation covers every revenue and outreach key', async () => {
  const env = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  const runbook = await readFile(new URL('../docs/revenue-operations.md', import.meta.url), 'utf8');
  const keys = ['ADMIN_EMAIL','REVENUE_TEST_EMAILS','OUTREACH_ENABLED','OUTREACH_DRY_RUN','OUTREACH_ALLOWLIST','OUTREACH_TOKEN_SECRET','OUTREACH_FROM_NAME','OUTREACH_REPLY_TO','OUTREACH_COMPANY_ADDRESS','IONOS_EMAIL_USER','IONOS_EMAIL_PASSWORD','IONOS_SMTP_HOST','IONOS_SMTP_PORT','IONOS_IMAP_HOST','IONOS_IMAP_PORT','NEXT_PUBLIC_APP_URL','AUTH_SECRET'];
  for (const key of keys) { assert.match(env, new RegExp(`^${key}=`, 'm'), `${key} missing from .env.example`); assert.match(`${runbook}\n${env}`, new RegExp(key), `${key} missing from docs`); }
  assert.match(env, /OUTREACH_ENABLED="false"/); assert.match(env, /OUTREACH_DRY_RUN="true"/);
});
