// components/layout/NotificationBell.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface StalkerEvent {
  id: string;
  signal: string;
  handle: string;
  newValue: string | null;
  createdAt: string;
  read: boolean;
}

const SIGNAL_ICONS: Record<string, string> = {
  BIO_CHANGED: '✏️', LINK_CHANGED: '🔗', AVATAR_CHANGED: '🖼️',
  NEW_POST: '📸', POST_DELETED: '🗑️', NEW_FOLLOW: '👣', WENT_PRIVATE: '🔒',
  DISPLAY_NAME_CHANGED: '📝', USERNAME_CHANGED: '🔄', VERIFIED_CHANGED: '✅',
  CATEGORY_CHANGED: '🏷️', PRONOUNS_CHANGED: '💬',
};

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [events, setEvents] = useState<StalkerEvent[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const doFetch = async () => {
      const res = await fetch('/api/stalker/events?limit=10');
      if (!res.ok) return;
      const data = await res.json() as { unreadCount: number; events: StalkerEvent[] };
      setUnread(data.unreadCount ?? 0);
      setEvents(data.events ?? []);
    };
    void doFetch();
    const interval = setInterval(doFetch, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread > 0) {
      const res = await fetch('/api/stalker/events/read-all', { method: 'POST' });
      if (res.ok) {
        setUnread(0);
        setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
      }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-cyan-950/10 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-label="Stalker Mode notifications"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-cyan-950/10 bg-white shadow-xl shadow-cyan-950/10">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-black text-slate-950">👁 Stalker Mode alerts</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No activity yet</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 ${!e.read ? 'bg-cyan-50/50' : ''}`}>
                  <span className="mt-0.5 shrink-0">{SIGNAL_ICONS[e.signal] ?? '📌'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">@{e.handle}</p>
                    <p className="text-xs text-slate-500">
                      {e.signal.replace(/_/g, ' ').toLowerCase()}
                      {e.newValue && ` → ${e.signal === 'NEW_FOLLOW' ? '@' : ''}${e.newValue.length > 30 ? e.newValue.slice(0, 30) + '…' : e.newValue}`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(e.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
