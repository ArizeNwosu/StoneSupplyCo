export interface AuthenticityResult {
  score: number;                    // 0–100, higher = more authentic
  label: 'authentic' | 'suspicious' | 'likely_fake';
  signals: string[];
}

/**
 * Compute a fake follower authenticity score from daily snapshot history.
 * Requires at least 5 snapshots; returns score: 50 with a data notice if fewer.
 */
export function calculateAuthenticityScore(
  snapshots: { followerCount: number }[]
): AuthenticityResult {
  if (snapshots.length < 5) {
    return {
      score: 50,
      label: 'suspicious',
      signals: ['Not enough data — need 5+ snapshots for a reliable score'],
    };
  }

  const signals: string[] = [];
  let deductions = 0;

  // Daily percentage changes
  const changes: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const cur = snapshots[i];
    const prev = snapshots[i - 1];
    if (!cur || !prev || prev.followerCount === 0) continue;
    changes.push((cur.followerCount - prev.followerCount) / prev.followerCount);
  }

  // 1. Spike detection — any single day gain > 5%
  const spikes = changes.filter((c) => c > 0.05);
  if (spikes.length > 0) {
    const penalty = Math.min(spikes.length * 15, 45);
    deductions += penalty;
    signals.push(
      `${spikes.length} sudden spike${spikes.length > 1 ? 's' : ''} (>5% gain in one day)`
    );
  }

  // 2. Buy-then-drop pattern — gain >5% followed within 4 days by loss >2%
  let buyDropFound = false;
  for (let i = 0; i < changes.length - 1 && !buyDropFound; i++) {
    const ci = changes[i];
    if (ci !== undefined && ci > 0.05) {
      for (let j = i + 1; j < Math.min(i + 5, changes.length); j++) {
        const cj = changes[j];
        if (cj !== undefined && cj < -0.02) {
          deductions += 30;
          signals.push(
            'Spike-then-drop pattern detected (common after buying followers)'
          );
          buyDropFound = true;
          break;
        }
      }
    }
  }

  // 3. High variance — std dev of daily changes > 3%
  if (changes.length >= 5) {
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance =
      changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0.03) {
      const penalty = Math.min(Math.round(stdDev * 300), 20);
      deductions += penalty;
      signals.push('High day-to-day volatility in follower count');
    }
  }

  const score = Math.max(0, Math.min(100, 100 - deductions));

  let label: AuthenticityResult['label'];
  if (score >= 70) label = 'authentic';
  else if (score >= 40) label = 'suspicious';
  else label = 'likely_fake';

  if (signals.length === 0) {
    signals.push('Growth pattern looks consistent and organic');
  }

  return { score, label, signals };
}
