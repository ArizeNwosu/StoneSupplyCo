export interface PatternEvent {
  date: string;                  // "YYYY-MM-DD"
  type: 'mass_drop' | 'mass_gain';
  affectedAccounts: {
    handle: string;
    change: number;
    changePct: number;
  }[];
  summary: string;
}

/**
 * Detect cross-account anomaly events across a user's tracked accounts.
 * Requires ≥3 accounts with ≥7 snapshots each.
 * Returns up to 10 most recent events.
 */
export function detectCrossAccountPatterns(
  accounts: Array<{
    handle: string;
    snapshots: { takenAt: Date; followerCount: number }[];
  }>
): PatternEvent[] {
  const eligible = accounts.filter((a) => a.snapshots.length >= 7);
  if (eligible.length < 3) return [];

  // date string → list of per-account changes on that date
  const dateMap = new Map<
    string,
    Array<{ handle: string; change: number; changePct: number }>
  >();

  for (const account of eligible) {
    const sorted = [...account.snapshots].sort(
      (a, b) => a.takenAt.getTime() - b.takenAt.getTime()
    );
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      const prev = sorted[i - 1];
      if (!cur || !prev || prev.followerCount === 0) continue;
      const date = cur.takenAt.toISOString().split('T')[0] ?? '';
      const change = cur.followerCount - prev.followerCount;
      const changePct = change / prev.followerCount;

      if (!dateMap.has(date)) dateMap.set(date, []);
      dateMap.get(date)!.push({ handle: account.handle, change, changePct });
    }
  }

  const events: PatternEvent[] = [];

  for (const [date, changes] of dateMap) {
    // Mass drop: ≥3 accounts lost >2% on the same day
    const drops = changes.filter((c) => c.changePct < -0.02);
    if (drops.length >= 3) {
      events.push({
        date,
        type: 'mass_drop',
        affectedAccounts: drops,
        summary: `${drops.length} accounts lost followers on ${date} — possible Instagram algorithm adjustment`,
      });
    }

    // Mass gain: ≥3 accounts gained >5% on the same day
    const gains = changes.filter((c) => c.changePct > 0.05);
    if (gains.length >= 3) {
      events.push({
        date,
        type: 'mass_gain',
        affectedAccounts: gains,
        summary: `${gains.length} accounts had unusual follower spikes on ${date}`,
      });
    }
  }

  return events
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
}
