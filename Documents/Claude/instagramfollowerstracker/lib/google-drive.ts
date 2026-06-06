const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';

function redirectUri() {
  const base = process.env.NEXTAUTH_URL ?? 'https://instagramfollowerstracker.com';
  return `${base}/api/drive/callback`;
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_OAUTH_URL}?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('Failed to refresh Google token');
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getValidGoogleToken(user: {
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
}): Promise<{ accessToken: string; newAccessToken?: string; newExpiry?: Date }> {
  if (!user.googleRefreshToken) throw new Error('No Google refresh token stored');

  const bufferMs = 5 * 60 * 1000;
  const stillValid =
    user.googleAccessToken &&
    user.googleTokenExpiry &&
    user.googleTokenExpiry.getTime() - Date.now() > bufferMs;

  if (stillValid) return { accessToken: user.googleAccessToken! };

  const tokens = await refreshGoogleToken(user.googleRefreshToken);
  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);
  return { accessToken: tokens.access_token, newAccessToken: tokens.access_token, newExpiry };
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

export async function findInstagramExportsInDrive(
  accessToken: string,
  since?: Date | null
): Promise<DriveFile[]> {
  const conditions = [`name = 'followers_1.json'`, `trashed = false`];
  if (since) {
    conditions.push(`modifiedTime > '${since.toISOString()}'`);
  }

  const params = new URLSearchParams({
    q: conditions.join(' and '),
    fields: 'files(id,name,modifiedTime,size)',
    orderBy: 'modifiedTime desc',
    pageSize: '5',
  });

  const res = await fetch(`${GOOGLE_DRIVE_API}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) throw new Error('GOOGLE_AUTH_EXPIRED');
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);

  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

export async function downloadDriveFile(accessToken: string, fileId: string): Promise<Buffer> {
  const res = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
