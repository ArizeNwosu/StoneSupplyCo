import { supabase } from './supabase';

export async function signUp(email: string, password: string, name?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name ?? '' } },
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
    const { identityToken } = await nativeAppleSignIn();
    if (!identityToken) throw new Error('Apple did not return an identity token');
    return supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });
  }
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin },
  });
}

export async function signInWithGoogle() {
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    // Google OAuth via ASWebAuthenticationSession — will work once custom plugin is confirmed
    const { openOAuthSession } = await import('./native');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'com.trycallmate.app://login-callback', skipBrowserRedirect: true },
    });
    if (error || !data.url) return { data: null, error: error ?? new Error('No OAuth URL') };
    const callbackUrl = await openOAuthSession(data.url, 'com.trycallmate.app');
    if (!callbackUrl) return { data: null, error: new Error('OAuth cancelled') };
    const params = new URLSearchParams(callbackUrl.split('?')[1] ?? '');
    const code = params.get('code');
    if (code) return supabase.auth.exchangeCodeForSession(code);
    return { data: null, error: new Error('No code in callback') };
  }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
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
