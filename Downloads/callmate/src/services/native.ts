/**
 * native.ts — Thin wrappers around Capacitor plugins.
 * All functions are safe to call in the browser (they no-op gracefully).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
export const isNativePlatform = isNative;
export const isVoiceSimulatorNativeAvailable = isNative && Capacitor.isPluginAvailable('VoiceSimulatorPlugin');

// ─── OAuth Session (ASWebAuthenticationSession) ───────────────────────────────

interface OAuthSessionPlugin {
  start(options: { url: string; callbackScheme: string }): Promise<{ url: string }>;
}

const OAuthSession = registerPlugin<OAuthSessionPlugin>('OAuthSessionPlugin');

export async function openOAuthSession(url: string, callbackScheme: string): Promise<string | null> {
  if (!isNative) return null;
  try {
    const result = await OAuthSession.start({ url, callbackScheme });
    return result.url;
  } catch (error: any) {
    if (error?.message === 'cancelled') return null;
    throw error;
  }
}

// ─── Apple Sign In (native via AppleSignInPlugin) ────────────────────────────

export interface AppleSignInResult {
  identityToken: string;
  email?: string;
  givenName?: string;
  familyName?: string;
}

interface AppleSignInPlugin {
  signIn(options: { nonce?: string }): Promise<AppleSignInResult>;
}

const AppleSignIn = registerPlugin<AppleSignInPlugin>('AppleSignInPlugin');

async function sha256Hex(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

export async function nativeAppleSignIn(): Promise<AppleSignInResult & { nonce: string }> {
  if (!isNative) throw new Error('Apple Sign In is only available on native platforms');

  const rawNonce = generateNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  try {
    const result = await AppleSignIn.signIn({ nonce: hashedNonce });
    return { ...result, nonce: rawNonce };
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() ?? '';
    if (msg.includes('cancelled') || msg === 'cancelled') {
      throw new Error('cancelled');
    }
    throw error;
  }
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

export async function hapticError() {
  if (!isNative) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Error });
}

export async function vibrate(options?: { duration?: number }) {
  if (!isNative) return;
  const { Haptics } = await import('@capacitor/haptics');
  await Haptics.vibrate({ duration: options?.duration ?? 300 });
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

export async function setStatusBarDark() {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setOverlaysWebView({ overlay: true });
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
}

export async function setStatusBarLight() {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setOverlaysWebView({ overlay: true });
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

// ─── Notifications ───────────────────────────────────────────────────────────

interface NotificationSettingsPlugin {
  requestPermission(options?: { openSettings?: boolean }): Promise<{ status: string; openedSettings?: boolean }>;
}

const NotificationSettings = registerPlugin<NotificationSettingsPlugin>('NotificationSettingsPlugin');

export async function requestNotificationsAccess() {
  if (!isNative) {
    if (typeof Notification === 'undefined') {
      return { status: 'unsupported', openedSettings: false };
    }
    const status = await Notification.requestPermission();
    return { status, openedSettings: false };
  }

  return NotificationSettings.requestPermission({ openSettings: true });
}

/**
 * Fire a local notification using the Web Notification API.
 * No-ops if permission is not granted or the API is unavailable.
 */
export function scheduleLocalNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png' });
  } catch {
    // Some browsers disallow Notification from service-worker-less pages — silently ignore
  }
}

// ─── Voice Simulator (native streaming STT + native TTS) ────────────────────

type VoiceSpeechState = 'listening' | 'stopped' | 'error';
type VoiceTtsState = 'started' | 'finished' | 'cancelled';

interface VoiceSimulatorPlugin {
  prepareAudioSession(): Promise<{ available: boolean }>;
  requestSpeechPermissions(): Promise<{ granted: boolean }>;
  deactivateAudioSession(): Promise<void>;
  startRecognition(): Promise<{ started: boolean }>;
  stopRecognition(): Promise<{ transcript?: string }>;
  speak(options: { text: string; rate?: number; pitch?: number }): Promise<void>;
  stopSpeaking(): Promise<void>;
  addListener(
    eventName: 'speechPartial',
    listenerFunc: (payload: { transcript: string; isFinal?: boolean }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'speechFinal',
    listenerFunc: (payload: { transcript: string }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'speechState',
    listenerFunc: (payload: { state: VoiceSpeechState; message?: string }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'ttsState',
    listenerFunc: (payload: { state: VoiceTtsState }) => void,
  ): Promise<PluginListenerHandle>;
}

const VoiceSimulator = registerPlugin<VoiceSimulatorPlugin>('VoiceSimulatorPlugin');

export async function prepareVoiceSimulatorAudioSession() {
  if (!isVoiceSimulatorNativeAvailable) return { available: false };
  return VoiceSimulator.prepareAudioSession();
}

export async function requestVoiceSimulatorPermissions() {
  if (isVoiceSimulatorNativeAvailable) {
    return VoiceSimulator.requestSpeechPermissions();
  }

  if (typeof window === 'undefined') {
    return { granted: false };
  }

  try {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    }
    return { granted: true };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Microphone permission denied');
  }
}

export async function deactivateVoiceSimulatorAudioSession() {
  if (!isVoiceSimulatorNativeAvailable) return;
  await VoiceSimulator.deactivateAudioSession();
}

export async function startNativeSpeechRecognition() {
  if (!isVoiceSimulatorNativeAvailable) return { started: false };
  return VoiceSimulator.startRecognition();
}

export async function stopNativeSpeechRecognition() {
  if (!isVoiceSimulatorNativeAvailable) return { transcript: '' };
  return VoiceSimulator.stopRecognition();
}

export async function speakNativeText(text: string, options?: { rate?: number; pitch?: number }) {
  if (!isVoiceSimulatorNativeAvailable || !text.trim()) return;
  await VoiceSimulator.speak({
    text,
    rate: options?.rate,
    pitch: options?.pitch,
  });
}

export async function stopNativeSpeech() {
  if (!isVoiceSimulatorNativeAvailable) return;
  await VoiceSimulator.stopSpeaking();
}

export async function addVoiceSimulatorListeners(listeners: {
  onSpeechPartial?: (payload: { transcript: string; isFinal?: boolean }) => void;
  onSpeechFinal?: (payload: { transcript: string }) => void;
  onSpeechState?: (payload: { state: VoiceSpeechState; message?: string }) => void;
  onTtsState?: (payload: { state: VoiceTtsState }) => void;
}) {
  if (!isVoiceSimulatorNativeAvailable) {
    return () => {};
  }

  const handles = await Promise.all([
    listeners.onSpeechPartial ? VoiceSimulator.addListener('speechPartial', listeners.onSpeechPartial) : null,
    listeners.onSpeechFinal ? VoiceSimulator.addListener('speechFinal', listeners.onSpeechFinal) : null,
    listeners.onSpeechState ? VoiceSimulator.addListener('speechState', listeners.onSpeechState) : null,
    listeners.onTtsState ? VoiceSimulator.addListener('ttsState', listeners.onTtsState) : null,
  ]);

  return () => {
    void Promise.all(handles.filter(Boolean).map(handle => handle!.remove()));
  };
}
