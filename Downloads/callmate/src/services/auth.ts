import { supabase } from './supabase';

async function getAuthRedirectUrl() {
  const { Capacitor } = await import('@capacitor/core');
  return Capacitor.isNativePlatform()
    ? 'com.trycallmate.app://login-callback'
    : window.location.origin;
}

export async function signUp(email: string, password: string, name?: string) {
  const emailRedirectTo = await getAuthRedirectUrl();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name ?? '' },
      emailRedirectTo,
    },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithApple() {
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    // Use native Apple Sign In sheet via WKScriptMessageHandler bridge in AppDelegate.swift
    const { nativeAppleSignIn } = await import('./native');
    const { identityToken, nonce } = await nativeAppleSignIn();
    if (!identityToken) throw new Error('Apple did not return an identity token');
    return supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
      nonce,
    });
  }
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin },
  });
}

export async function signInWithGoogle() {
  console.log('[Google] signInWithGoogle start (native implicit flow)');
  const redirectTo = await getAuthRedirectUrl();
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    console.log('[Google] native path, redirectTo:', redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
        }
      },
    });

    if (error || !data?.url) {
      console.log('[Google] signInWithOAuth error or no URL:', error);
      return { data: null, error: error ?? new Error('No OAuth URL') };
    }

    console.log('[Google] opening OAuth session');
    try {
      const { openOAuthSession } = await import('./native');
      const callbackUrl = await openOAuthSession(data.url, 'com.trycallmate.app');
      console.log('[Google] callbackUrl received:', callbackUrl ? callbackUrl.substring(0, 80) : 'null/cancelled');
      if (!callbackUrl) return { data: null, error: new Error('OAuth cancelled') };

      // Parse parameters from both hash and query
      const fragment = callbackUrl.split('#')[1] || '';
      const query = callbackUrl.split('?')[1] || '';
      const params = new URLSearchParams(fragment || query);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const code = params.get('code');

      console.log('[Google] parsed: token=%s refresh=%s code=%s', !!accessToken, !!refreshToken, !!code);

      if (accessToken) {
        console.log('[Google] implicit flow: setting session');
        return await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? ''
        });
      }

      if (code) {
        console.log('[Google] PKCE flow: exchanging code');
        return await supabase.auth.exchangeCodeForSession(code);
      }

      console.log('[Google] no code or token found in callback');
      return { data: null, error: new Error('No code or token in callback') };
    } catch (nativeError: any) {
      console.log('[Google] native error:', nativeError?.message);
      throw nativeError;
    }
  }

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function sendPasswordReset(email: string) {
  const redirectTo = await getAuthRedirectUrl();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback);
}
