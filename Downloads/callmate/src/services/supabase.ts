import { createClient } from '@supabase/supabase-js';

const viteEnv: Record<string, string | undefined> =
  ((import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env) ?? {};

const supabaseUrl = viteEnv.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing env vars — auth and sync will be unavailable.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

type InvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
};

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    cachedAccessToken = session.access_token;
    return session.access_token;
  }

  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (!error && data.session?.access_token) {
    cachedAccessToken = data.session.access_token;
    return data.session.access_token;
  }

  return null;
}

export async function invokeFunction<T = unknown>(
  name: string,
  options: InvokeOptions = {}
) {
  const accessToken = await getAccessToken();
  const headers = {
    ...(options.headers ?? {}),
    ...(accessToken
      ? { 'X-Client-Authorization': `Bearer ${accessToken}` }
      : {}),
  };

  return supabase.functions.invoke<T>(name, {
    ...options,
    headers,
  });
}

export async function invokeFunctionDirect<T = unknown>(
  name: string,
  options: InvokeOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return {
        data: null,
        error: new Error('No active auth session available.'),
      };
    }
    const body =
      accessToken && options.body && typeof options.body === 'object' && !Array.isArray(options.body)
        ? { ...(options.body as Record<string, unknown>), authToken: accessToken }
        : options.body ?? {};
    const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      body: JSON.stringify(body),
    });

    let payload: unknown = null;
    let textPayload = '';
    try {
      payload = await response.json();
    } catch {
      try {
        textPayload = await response.text();
      } catch {
        textPayload = '';
      }
      payload = null;
    }

    if (!response.ok) {
      const message = (() => {
        if (payload && typeof payload === 'object') {
          const error =
            'error' in payload && typeof payload.error === 'string' ? payload.error : null;
          const detail =
            'message' in payload && typeof payload.message === 'string'
              ? payload.message
              : 'debug' in payload
              ? JSON.stringify(payload.debug)
              : JSON.stringify(payload);
          if (error && detail && detail !== JSON.stringify(payload)) {
            return `${response.status}: ${error} ${detail}`;
          }
          if (error) return `${response.status}: ${error}`;
          return `${response.status}: ${detail}`;
        }
        if (textPayload) return `${response.status}: ${textPayload}`;
        return `${response.status}`;
      })();
      return { data: null, error: new Error(message) };
    }

    return { data: payload as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function describeFunctionError(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'context' in error &&
    error.context instanceof Response
  ) {
    const response = error.context.clone();
    let body = '';

    try {
      const json = await response.json();
      body = typeof json?.error === 'string' ? json.error : JSON.stringify(json);
    } catch {
      try {
        body = await response.text();
      } catch {
        body = '';
      }
    }

    const status = response.status;
    return body ? `${status}: ${body}` : `${status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
