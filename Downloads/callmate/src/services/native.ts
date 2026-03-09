/**
 * native.ts — Thin wrappers around Capacitor plugins.
 * All functions are safe to call in the browser (they no-op gracefully).
 */

import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

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

// ─── Browser (for terms/privacy links) ───────────────────────────────────────

export async function openInAppBrowser(url: string) {
  if (!isNative) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url, presentationStyle: 'popover' });
}
