import { simpleParser } from 'mailparser';

const MAX_BODY = 8_000;
const MAX_SUBJECT = 500;

function cleanReply(value: string) {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ');
  const beforeQuote = normalized.split(/\n(?:On .+wrote:|From:\s.+|_{5,}|-{5,}\s*Original Message\s*-{5,})/i)[0] ?? '';
  return beforeQuote.split('\n').filter((line) => !/^\s*>/.test(line)).join('\n').replace(/\[https?:\/\/[^\]]+\]/gi, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_BODY);
}

export async function parseReply(source: Buffer | string) {
  const parsed = await simpleParser(source, { skipHtmlToText: false, skipImageLinks: true });
  const text = parsed.text ?? (typeof parsed.html === 'string' ? parsed.html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ') : '');
  const senderEmail = parsed.from?.value[0]?.address?.trim().toLowerCase() ?? '';
  return {
    senderEmail: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(senderEmail) ? senderEmail : null,
    subject: (parsed.subject ?? '').slice(0, MAX_SUBJECT),
    bodyText: cleanReply(text),
    inReplyTo: parsed.inReplyTo ?? null,
    references: Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [],
    messageId: parsed.messageId ?? null,
    receivedAt: parsed.date ?? new Date(),
    replyToken: (parsed.subject ?? '').match(/\[IFT:([a-zA-Z0-9_-]{6,128})\]/)?.[1] ?? null,
  };
}
