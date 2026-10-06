import { ImapFlow } from 'imapflow';
import { prisma } from '@/lib/prisma';
import { parseReply } from './reply-parser';
import { storeReply } from './replies';

export function getImapConfig() {
  return { host: process.env.IONOS_IMAP_HOST ?? 'imap.ionos.com', port: Number(process.env.IONOS_IMAP_PORT ?? 993), secure: true, auth: { user: process.env.IONOS_EMAIL_USER ?? '', pass: process.env.IONOS_EMAIL_PASSWORD ?? '' }, tls: { rejectUnauthorized: true }, logger: false as const };
}

export async function ingestMailboxReplies(options: { db?: any; client?: ImapFlow; mailbox?: string; limit?: number } = {}) {
  const db = options.db ?? prisma;
  const mailbox = options.mailbox ?? 'INBOX';
  const client = options.client ?? new ImapFlow(getImapConfig());
  const owned = !options.client;
  if (owned) await client.connect();
  const lock = await client.getMailboxLock(mailbox);
  let examined = 0, matched = 0, stored = 0;
  try {
    const currentMailbox = client.mailbox;
    const uidValidity = String(currentMailbox && typeof currentMailbox === 'object' ? currentMailbox.uidValidity : '0');
    const cursor = await db.outreachMailboxCursor.findUnique({ where: { mailbox } });
    const lastUid = cursor?.uidValidity === uidValidity ? cursor.lastUid : 0;
    let highUid = lastUid;
    for await (const item of client.fetch(`${lastUid + 1}:*`, { uid: true, source: true }, { uid: true })) {
      if (examined >= (options.limit ?? 50)) break;
      examined += 1; highUid = Math.max(highUid, item.uid);
      if (!item.source) continue;
      const reply = await parseReply(item.source);
      const result = await storeReply({ db, mailbox, uidValidity, uid: item.uid, reply });
      if (result.matched) matched += 1;
      if (result.stored) stored += 1;
    }
    await db.outreachMailboxCursor.upsert({ where: { mailbox }, update: { uidValidity, lastUid: highUid }, create: { mailbox, uidValidity, lastUid: highUid } });
  } finally {
    lock.release();
    if (owned) await client.logout();
  }
  return { examined, matched, stored };
}
