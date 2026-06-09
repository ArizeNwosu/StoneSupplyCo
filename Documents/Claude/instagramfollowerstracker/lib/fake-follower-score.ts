export interface AuthenticityResult {
  score: number;                    // 0–100, higher = more authentic
  label: 'authentic' | 'suspicious' | 'likely_fake';
  signals: string[];
  fakePctRange: { min: number; max: number };
}

type Snapshot = {
  followerCount: number;
  followingCount?: number | null;
  postCount?: number | null;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function scoreToFakeRange(score: number): { min: number; max: number } {
  if (score >= 90) return { min: 0, max: 5 };
  if (score >= 75) return { min: 5, max: 15 };
  if (score >= 60) return { min: 15, max: 30 };
  if (score >= 40) return { min: 30, max: 50 };
  if (score >= 20) return { min: 50, max: 70 };
  return { min: 70, max: 90 };
}

/**
 * Compute a fake follower authenticity score from daily snapshot history.
 * Uses follower growth patterns plus following/post count signals when available.
 * Requires at least 5 snapshots; returns a neutral score with a data notice if fewer.
 */
export function calculateAuthenticityScore(snapshots: Snapshot[]): AuthenticityResult {
  if (snapshots.length < 5) {
    const score = 50;
    return {
      score,
      label: 'suspicious',
      signals: ['Not enough data — need 5+ snapshots for a reliable score'],
      fakePctRange: scoreToFakeRange(score),
    };
  }

  const signals: string[] = [];
  let deductions = 0;

  // ── Growth pattern signals (follower count only) ──────────────────────────

  const changes: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const cur = snapshots[i];
    const prev = snapshots[i - 1];
    if (!cur || !prev || prev.followerCount === 0) continue;
    changes.push((cur.followerCount - prev.followerCount) / prev.followerCount);
  }

  // 1. Spike detection — any single-day gain > 5%
  const spikes = changes.filter((c) => c > 0.05);
  if (spikes.length > 0) {
    const penalty = Math.min(spikes.length * 15, 45);
    deductions += penalty;
    signals.push(
      `${spikes.length} sudden spike${spikes.length > 1 ? 's' : ''} detected (>5% gain in one day)`
    );
  }

  // 2. Buy-then-drop — spike >5% followed within 4 days by loss >2%
  let buyDropFound = false;
  for (let i = 0; i < changes.length - 1 && !buyDropFound; i++) {
    const ci = changes[i];
    if (ci !== undefined && ci > 0.05) {
      for (let j = i + 1; j < Math.min(i + 5, changes.length); j++) {
        const cj = changes[j];
        if (cj !== undefined && cj < -0.02) {
          deductions += 30;
          signals.push('Spike-then-drop pattern (common after buying followers)');
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
      changes.reduce((a, b) => a + (b - mean) ** 2, 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0.03) {
      const penalty = Math.min(Math.round(stdDev * 300), 20);
      deductions += penalty;
      signals.push('High day-to-day volatility in follower count');
    }
  }

  // ── Profile structure signals (following + post count) ────────────────────

  const latest = snapshots.at(-1)!;
  const fc = latest.followerCount;
  const fwc = latest.followingCount ?? null;
  const pc = latest.postCount ?? null;

  // 4. Post density — very few posts for a large following
  if (pc !== null && fc >= 10_000) {
    if (pc < 5) {
      deductions += 25;
      signals.push(`Only ${pc} post${pc !== 1 ? 's' : ''} with ${fmt(fc)} followers`);
    } else if (pc < 15 && fc >= 50_000) {
      deductions += 15;
      signals.push(`Low post count (${pc}) relative to follower size (${fmt(fc)})`);
    } else if (pc < 30 && fc >= 100_000) {
      deductions += 8;
      signals.push(`Sparse post history for account size`);
    }
  }

  // 5. Following ratio — following more accounts than you have followers
  if (fwc !== null && fc >= 5_000) {
    const ratio = fwc / fc;
    if (ratio > 1.5) {
      deductions += 20;
      signals.push(
        `Following ${fmt(fwc)} accounts vs ${fmt(fc)} followers (aggressive mass-follow pattern)`
      );
    } else if (ratio > 0.8) {
      deductions += 12;
      signals.push(
        `High following-to-follower ratio (${fmt(fwc)} following / ${fmt(fc)} followers)`
      );
    } else if (ratio > 0.5) {
      deductions += 5;
      signals.push(`Elevated following count relative to followers`);
    }
  }

  // 6. Follow/unfollow tactic — following count peaked then dropped sharply
  if (snapshots.length >= 7) {
    const fwCounts = snapshots
      .map((s) => s.followingCount)
      .filter((n): n is number => n !== null && n !== undefined);

    if (fwCounts.length >= 5) {
      const peak = Math.max(...fwCounts);
      const current = fwCounts.at(-1)!;
      // Peak must be meaningful (>500) and the drop must be >30%
      if (peak >= 500 && current < peak * 0.7) {
        deductions += 15;
        signals.push(
          `Following count dropped ${fmt(peak - current)} after a peak — follow/unfollow tactic`
        );
      }
    }
  }

  // ── Final score ───────────────────────────────────────────────────────────

  const score = Math.max(0, Math.min(100, 100 - deductions));

  let label: AuthenticityResult['label'];
  if (score >= 70) label = 'authentic';
  else if (score >= 40) label = 'suspicious';
  else label = 'likely_fake';

  if (signals.length === 0) {
    signals.push('Growth pattern looks consistent and organic');
  }

  return { score, label, signals, fakePctRange: scoreToFakeRange(score) };
}
