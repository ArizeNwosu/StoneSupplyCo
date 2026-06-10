// lib/stalker-email.ts
// SERVER-SIDE ONLY.

import { Resend } from 'resend';
import { formatStalkerChange, type StalkerChange } from './stalker-diff';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? '');
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? 'noreply@instagramfollowerstracker.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instagramfollowerstracker.com';

export async function sendStalkerAlertEmail({
  to,
  handle,
  changes,
}: {
  to: string;
  handle: string;
  changes: StalkerChange[];
}): Promise<void> {
  if (changes.length === 0) return;

  const subject =
    changes.length === 1
      ? `👁 Stalker alert: ${formatStalkerChange(changes[0]!, handle)}`
      : `👁 Stalker alert: ${changes.length} changes detected for @${handle}`;

  const changesHtml = changes
    .map((c) => {
      const label = formatStalkerChange(c, handle);
      const oldNew =
        c.signal === 'BIO_CHANGED'
          ? `${c.oldValue ? `<br><span style="color:#64748b;font-size:13px;">Was: ${escapeHtml(c.oldValue)}</span>` : ''}${c.newValue ? `<br><span style="color:#0f766e;font-size:13px;">Now: ${escapeHtml(c.newValue)}</span>` : ''}`
          : '';
      return `<li style="margin-bottom:8px;">${escapeHtml(label)}${oldNew}</li>`;
    })
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <p style="font-size:16px;font-weight:700;margin-bottom:4px;">👁 Stalker Mode alert</p>
      <p style="color:#64748b;margin-top:0;">Activity detected on <strong>@${escapeHtml(handle)}</strong></p>
      <ul style="padding-left:20px;line-height:1.6">${changesHtml}</ul>
      <p style="margin-top:24px;">
        <a href="${APP_URL}/dashboard" style="background:#0f172a;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:700;font-size:14px;">
          View in dashboard →
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
        You're receiving this because you have Stalker Mode active for @${escapeHtml(handle)}.<br>
        <a href="${APP_URL}/dashboard/settings" style="color:#94a3b8;">Manage alerts</a>
      </p>
    </div>
  `;

  await getResend().emails.send({ from: FROM, to, subject, html });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
