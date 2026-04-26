/**
 * Returns the file names from `files` whose modification time is older than
 * `ttlDays` days relative to `nowMs`.
 * Pure function — no filesystem access, fully testable.
 */
export function getExpiredFilePaths(
  files: { name: string; mtimeMs: number }[],
  ttlDays: number,
  nowMs: number
): string[] {
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  return files
    .filter(f => nowMs - f.mtimeMs > ttlMs)
    .map(f => f.name);
}
