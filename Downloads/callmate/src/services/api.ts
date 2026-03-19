function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getApiBaseUrl(path = '') {
  const configuredBase = import.meta.env.VITE_API_URL?.trim();
  const base = configuredBase ? trimTrailingSlash(configuredBase) : '';

  if (!path) {
    return base || '';
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getAuthHeaders(): Record<string, string> {
  return _authToken ? { Authorization: `Bearer ${_authToken}` } : {};
}

export async function apiJson<T>(path: string, init?: RequestInit, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getApiBaseUrl(path), {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(init?.headers || {}),
      },
      ...init,
    });

    if (!response.ok) {
      const message = await response.text();
      const cleaned = message.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned.includes('Cannot POST /api/live-assist/')) {
        throw new Error('Live Assist is not deployed on the current API server yet.');
      }
      throw new Error(cleaned || `API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
