// ── Token storage ─────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('snark_token');
}

export function saveToken(token: string): void {
  localStorage.setItem('snark_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('snark_token');
  localStorage.removeItem('snark_email');
}

export function saveEmail(email: string): void {
  localStorage.setItem('snark_email', email);
}

export function getSavedEmail(): string | null {
  return localStorage.getItem('snark_email');
}

const BASE = '/api';

export interface Comment {
  id: string;
  post_id: string;
  post_permalink: string | null;
  username: string;
  text: string;
  timestamp: string;
  status: string;
  created_at: string;
  source: 'instagram' | 'facebook';
  reply_id: number | null;
  reply_text: string | null;
  confidence_score: number | null;
  flagged_for_review: 0 | 1 | null;
  flag_reason: string | null;
  reply_status: string | null;
  scheduled_at: string | null;
}

export interface HistoryItem extends Comment {
  posted_at: string | null;
  comment_timestamp: string;
}

export interface Metrics {
  total_comments: number;
  total_replied: number;
  total_pending: number;
  total_flagged: number;
  total_posted: number;
  total_rejected: number;
  avg_confidence: number | null;
  comments_today: number;
}

export interface AppSettings {
  gif_reply_template: string;
  tone: number;
  confidence_threshold: number;
  business_hours_enabled: boolean;
  business_hours_start: number;
  business_hours_end: number;
  daily_cap_enabled: boolean;
  daily_cap: number;
  flagged_keywords: string[];
  blacklist_usernames: string[];
  polling_interval: number;
  email_alerts_enabled: boolean;
  auto_like_enabled: boolean;
}

export interface VoiceExample {
  id: number;
  comment: string;
  reply: string;
  active: number;
  created_at: string;
}

export type Filter = 'pending' | 'flagged' | 'rejected';
export type Source = 'all' | 'instagram' | 'facebook';

export interface QueuePage {
  rows: Comment[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getMode: () => request<{ mode: string }>('/mode'),
  setMode: (mode: 'manual' | 'auto') =>
    request<{ mode: string }>('/mode', { method: 'POST', body: JSON.stringify({ mode }) }),

  getQueue: (page = 1, filter: Filter = 'pending', limit = 20, source: Source = 'all') =>
    request<QueuePage>(`/queue?page=${page}&filter=${filter}&limit=${limit}&source=${source}`),
  getAll: () => request<Comment[]>('/all'),
  getMetrics: () => request<Metrics>('/metrics'),
  getHistory: () => request<HistoryItem[]>('/history'),
  getHealth: () => request<{ ok: boolean; account?: { username?: string; name?: string }; error?: string }>('/health'),

  approveReply: (replyId: number) =>
    request<{ success: boolean }>(`/replies/${replyId}/approve`, { method: 'POST' }),
  rejectReply: (replyId: number) =>
    request<{ success: boolean }>(`/replies/${replyId}/reject`, { method: 'POST' }),
  editReply: (replyId: number, reply_text: string) =>
    request<{ success: boolean }>(`/replies/${replyId}`, {
      method: 'PATCH', body: JSON.stringify({ reply_text }),
    }),
  regenerateReply: (replyId: number) =>
    request<{ success: boolean; reply: { reply_text: string; confidence_score: number } }>(
      `/replies/${replyId}/regenerate`, { method: 'POST' },
    ),

  getSettings: () => request<AppSettings>('/settings'),
  saveSettings: (data: Partial<AppSettings>) =>
    request<{ success: boolean }>('/settings', { method: 'POST', body: JSON.stringify(data) }),
  testEmail: () =>
    request<{ success: boolean }>('/settings/test-email', { method: 'POST' }),

  getVoiceExamples: () => request<VoiceExample[]>('/voice-examples'),
  addVoiceExample: (comment: string, reply: string) =>
    request<{ id: number }>('/voice-examples', { method: 'POST', body: JSON.stringify({ comment, reply }) }),
  updateVoiceExample: (id: number, data: Partial<VoiceExample>) =>
    request<{ success: boolean }>(`/voice-examples/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteVoiceExample: (id: number) =>
    request<{ success: boolean }>(`/voice-examples/${id}`, { method: 'DELETE' }),

  getBackfillStatus: () =>
    request<{ running: boolean; done: boolean; processed: number; total: number; error: string | null }>('/backfill/status'),
  startBackfill: (days: number) =>
    request<{ started: boolean }>('/backfill/start', { method: 'POST', body: JSON.stringify({ days }) }),
  skipBackfill: () =>
    request<{ success: boolean }>('/backfill/skip', { method: 'POST' }),
};
