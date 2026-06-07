export function parseFollowerCount(raw: string): number | null {
  const value = raw.trim().replace(/,/g, '');
  const match = value.match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/i);
  if (!match?.[1]) return null;

  const number = Number.parseFloat(match[1]);
  if (!Number.isFinite(number) || number <= 0) return null;

  const suffix = match[2]?.toLowerCase();
  const multiplier =
    suffix === 'k'
      ? 1_000
      : suffix === 'm'
      ? 1_000_000
      : suffix === 'b'
      ? 1_000_000_000
      : 1;

  const count = Math.round(number * multiplier);
  return count > 0 && count <= 10_000_000_000 ? count : null;
}
