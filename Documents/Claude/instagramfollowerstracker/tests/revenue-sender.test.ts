import test from 'node:test';
import assert from 'node:assert/strict';
import { getSmtpConfig } from '@/lib/outreach/smtp';
import { sendOutreachBatch } from '@/lib/outreach/sender';

test('sender disabled and dry-run modes never construct SMTP transport', async () => {
  delete process.env.OUTREACH_ENABLED; delete process.env.OUTREACH_DRY_RUN;
  let constructed = false;
  const result = await sendOutreachBatch({ db: {}, transportFactory: (() => { constructed = true; throw new Error('must not connect'); }) as never });
  assert.equal(result.skipped, true); assert.equal(constructed, false);
  process.env.OUTREACH_ENABLED = 'true'; process.env.OUTREACH_DRY_RUN = 'true';
  await sendOutreachBatch({ db: {}, transportFactory: (() => { constructed = true; throw new Error('must not connect'); }) as never });
  assert.equal(constructed, false);
});

test('IONOS SMTP defaults to certificate-verified implicit TLS', () => {
  delete process.env.IONOS_SMTP_HOST; delete process.env.IONOS_SMTP_PORT;
  const config = getSmtpConfig();
  assert.equal(config.host, 'smtp.ionos.com'); assert.equal(config.port, 465); assert.equal(config.secure, true); assert.equal(config.tls.rejectUnauthorized, true);
});
