/**
 * native.ts — Thin wrappers around Capacitor plugins.
 * All functions are safe to call in the browser (they no-op gracefully).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// ─── OAuth Session (ASWebAuthenticationSession) ───────────────────────────────

interface OAuthSessionPlugin {
  start(options: { url: string; callbackScheme: string }): Promise<{ url: string }>;
}

const OAuthSession = registerPlugin<OAuthSessionPlugin>('OAuthSession');

export async function openOAuthSession(url: string, callbackScheme: string): Promise<string | null> {
  if (!isNative) return null;
  const result = await OAuthSession.start({ url, callbackScheme });
  return result.url;
}

// ─── Haptics ──────────────────────────────────────────────────────────────────

export async function hapticLight() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticHeavy() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

export async function hapticSuccess() {
  if (!isNative) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Success });
}

export async function hapticWarning() {
  if (!isNative) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Warning });
}

export async function hapticError() {
  if (!isNative) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Error });
}

// ─── Status Bar ───────────────────────────────────────────────────────────────

export async function setStatusBarDark() {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
}

export async function setStatusBarLight() {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
}

// ─── Apple Sign In (native via WKScriptMessageHandler) ───────────────────────

export interface AppleSignInResult {
  identityToken: string;
  email?: string;
  givenName?: string;
  familyName?: string;
}

export function nativeAppleSignIn(): Promise<AppleSignInResult> {
  return new Promise((resolve, reject) => {
    const messageHandler = (window as any).webkit?.messageHandlers?.appleSignIn;
    if (!messageHandler?.postMessage) {
      reject(new Error('Apple Sign In is unavailable on this device'));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.removeEventListener('nativeAppleSignIn', handler);
      reject(new Error('Apple Sign In timed out'));
    }, 15000);

    const handler = (event: Event) => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('nativeAppleSignIn', handler);
      const { result, error } = (event as CustomEvent<{ result?: AppleSignInResult; error?: string }>).detail;
      if (error) reject(new Error(error));
      else if (result) resolve(result);
      else reject(new Error('No result from Apple Sign In'));
    };

    window.addEventListener('nativeAppleSignIn', handler);
    messageHandler.postMessage({});
  });
}

// ─── Browser (for terms/privacy links) ───────────────────────────────────────

export async function openInAppBrowser(url: string) {
  if (!isNative) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url, presentationStyle: 'popover' });
}
