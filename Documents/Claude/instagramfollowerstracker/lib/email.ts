import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? 'noreply@instagramfollowerstracker.com';

export async function sendMilestoneEmail({
  to,
  handle,
  snapshotCount,
  followerCount,
}: {
  to: string;
  handle: string;
  snapshotCount: number;
  followerCount: number | null;
}): Promise<void> {
  const countStr = followerCount !== null ? followerCount.toLocaleString() : '—';

  const subjects: Record<number, string> = {
    1: `✅ First snapshot taken for @${handle}`,
    3: `📈 3 snapshots in — @${handle} is being tracked`,
    7: `🎉 Chart unlocked for @${handle}`,
    30: `🏆 30 days of tracking @${handle}`,
  };

  const bodies: Record<number, string> = {
    1: `
      <p>Your tracker is live. We just took the first follower snapshot for <strong>@${handle}</strong>.</p>
      <p>Current followers: <strong>${countStr}</strong></p>
      <p>Check back in a few days — your chart unlocks after 7 snapshots.</p>
      <p><a href="https://instagramfollowerstracker.com/dashboard">View dashboard →</a></p>
    `,
    3: `
      <p>We've taken 3 snapshots for <strong>@${handle}</strong> so far.</p>
      <p>Current followers: <strong>${countStr}</strong></p>
      <p>4 more snapshots until your growth chart unlocks.</p>
      <p><a href="https://instagramfollowerstracker.com/dashboard">View dashboard →</a></p>
    `,
    7: `
      <p>Your growth chart for <strong>@${handle}</strong> is ready.</p>
      <p>Current followers: <strong>${countStr}</strong></p>
      <p>Head to your dashboard to see the trend.</p>
      <p><a href="https://instagramfollowerstracker.com/dashboard">View chart →</a></p>
    `,
    30: `
      <p>You've been tracking <strong>@${handle}</strong> for 30 days.</p>
      <p>Current followers: <strong>${countStr}</strong></p>
      <p>Log in to see the full month of growth data.</p>
      <p><a href="https://instagramfollowerstracker.com/dashboard">View 30-day history →</a></p>
    `,
  };

  const subject = subjects[snapshotCount];
  const html = bodies[snapshotCount];
  if (!subject || !html) return;

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[email] Failed to send milestone ${snapshotCount} email to ${to}:`, err);
  }
}
