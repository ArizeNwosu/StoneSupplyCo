const HANDLE_REGEX = /^[a-z0-9._]{1,30}$/;

export function parseHandle(raw: string): string {
  return (
    raw
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
      .replace(/\/$/, '')
      .split('?')[0]
      ?.split('/')[0] ?? ''
  );
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_REGEX.test(handle);
}
