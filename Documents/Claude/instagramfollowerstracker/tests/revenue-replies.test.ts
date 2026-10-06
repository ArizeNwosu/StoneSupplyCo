import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseReply } from '@/lib/outreach/reply-parser';
import { getImapConfig } from '@/lib/outreach/imap';

test('reply parser extracts bounded plain text and trims quoted history', async () => {
  const value = await parseReply(await readFile(new URL('./fixtures/outreach-replies/plain.eml', import.meta.url)));
  assert.equal(value.senderEmail, 'customer@example.com');
  assert.equal(value.replyToken, 'reply123');
  assert.equal(value.bodyText, 'The price is a little high for me.');
  assert.equal(value.inReplyTo, '<outreach-1@example.com>');
});

test('reply parser converts HTML without retaining tags or remote images', async () => {
  const value = await parseReply(await readFile(new URL('./fixtures/outreach-replies/html.eml', import.meta.url)));
  assert.match(value.bodyText, /I need help with setup/); assert.doesNotMatch(value.bodyText, /<|tracker\.invalid/);
  const long = await parseReply(`From: a@example.com\nSubject: [IFT:abcdef]\nContent-Type: text/plain\n\n${'x'.repeat(9000)}`);
  assert.equal(long.bodyText.length, 8000);
});

test('IONOS IMAP defaults to certificate-verified TLS', () => {
  delete process.env.IONOS_IMAP_HOST; delete process.env.IONOS_IMAP_PORT;
  const config = getImapConfig(); assert.equal(config.host, 'imap.ionos.com'); assert.equal(config.port, 993); assert.equal(config.secure, true); assert.equal(config.tls.rejectUnauthorized, true);
});
