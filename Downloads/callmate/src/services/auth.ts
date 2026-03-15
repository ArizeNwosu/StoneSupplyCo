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
  const redirectTo = await getAuthRedirectUrl();
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return { data: null, error: error ?? new Error('No OAuth URL') };
    }

    try {
      const { openOAuthSession } = await import('./native');
      const callbackUrl = await openOAuthSession(data.url, 'com.trycallmate.app');
      if (!callbackUrl) return { data: null, error: new Error('OAuth cancelled') };

      const urlObj = new URL(callbackUrl.replace('#', '?'));
      const code = urlObj.searchParams.get('code');
      if (code) return supabase.auth.exchangeCodeForSession(code);

      const accessToken = urlObj.searchParams.get('access_token');
      if (accessToken) {
        const refreshToken = urlObj.searchParams.get('refresh_token');
        return supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? ''
        });
      }

      return { data: null, error: new Error('No code or token in callback') };
    } catch (nativeError: any) {
      const message = nativeError?.message?.toLowerCase?.() ?? '';
      if (!message.includes('not implemented')) {
        throw nativeError;
      }

      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, presentationStyle: 'fullscreen' });
      return { data, error: null };
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
