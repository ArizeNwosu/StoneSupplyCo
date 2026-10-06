import { signOutreachToken } from './tokens';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const clamp = (value: string, max: number) => value.length <= max ? value : `${value.slice(0, max - 1)}…`;

const COPY: Record<string, { subject: string; intro: string; cta: string; path: string }> = {
  welcome_activation_help: { subject: 'Need help tracking your first account?', intro: 'You created an account but have not finished your first tracker setup.', cta: 'Finish setup', path: '/dashboard' },
  activated_free_value: { subject: 'Your tracker is working', intro: 'Your first follower snapshot is ready. Add another snapshot to reveal changes over time.', cta: 'View your tracker', path: '/dashboard' },
  unfollower_result_upgrade: { subject: 'Your unfollower results are ready', intro: 'You generated relationship results. Pro reveals the account names and CSV exports.', cta: 'Unlock the results', path: '/pricing?source=email' },
  abandoned_core_checkout: { subject: 'Want help choosing a plan?', intro: 'You started an upgrade but did not finish. Reply if price, trust, or setup held you back.', cta: 'Continue upgrading', path: '/pricing?source=email' },
  abandoned_stalker_checkout: { subject: 'Finish setting up Stalker Mode', intro: 'You started Stalker Mode but did not finish. Daily monitoring is $4.99/month.', cta: 'Activate Stalker Mode', path: '/dashboard?openStalker=1' },
  founding_user_offer: { subject: 'A founding-user offer for you', intro: 'You have been actively using the tracker, so we reserved our early-user offer for you.', cta: 'See the offer', path: '/pricing?source=email' },
  subscription_onboarding: { subject: 'Your paid features are active', intro: 'Your subscription is active. Here is the fastest way to get value from it today.', cta: 'Open your dashboard', path: '/dashboard' },
  cancellation_feedback: { subject: 'What should we improve?', intro: 'Your subscription ended. A one-line reply about what was missing would genuinely help.', cta: 'Review your account', path: '/dashboard' },
};

export function renderOutreachTemplate(input: { campaignKey: string; userId: string; campaignId: string; email: string; name?: string | null; replyToken: string }) {
  const copy = COPY[input.campaignKey] ?? COPY.activated_free_value!;
  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://instagramfollowerstracker.com').replace(/\/$/, '');
  const token = signOutreachToken({ userId: input.userId, campaignId: input.campaignId, email: input.email });
  const unsubscribeUrl = `${origin}/unsubscribe?token=${encodeURIComponent(token)}`;
  const ctaUrl = `${origin}${copy.path}`;
  const address = process.env.OUTREACH_COMPANY_ADDRESS ?? 'Instagram Followers Tracker, United States';
  const greeting = input.name ? `Hi ${input.name},` : 'Hi,';
  const reason = 'You are receiving this because you created an Instagram Followers Tracker account.';
  const text = clamp(`${greeting}\n\n${copy.intro}\n\n${copy.cta}: ${ctaUrl}\n\nReply to this email with questions or feedback.\n\n${reason}\n${address}\nUnsubscribe: ${unsubscribeUrl}`, 12_000);
  const html = `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(copy.intro)}</p><p><a href="${escapeHtml(ctaUrl)}">${escapeHtml(copy.cta)}</a></p><p>Reply to this email with questions or feedback.</p><hr><p>${escapeHtml(reason)}<br>${escapeHtml(address)}<br><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>`;
  return { subject: clamp(`${copy.subject} [IFT:${input.replyToken}]`, 180), text, html: clamp(html, 20_000), ctaUrl, unsubscribeUrl };
}
