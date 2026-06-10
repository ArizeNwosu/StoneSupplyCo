'use client';

import { useEffect, useState } from 'react';

interface StalkerEvent {
  id: string;
  signal: string;
  handle: string;
  oldValue: string | null;
  newValue: string | null;
  read: boolean;
  createdAt: string;
}

interface StalkerEventFeedProps {
  trackedAccountId?: string;
  className?: string;
}

const SIGNAL_META: Record<string, { icon: string; label: string }> = {
  BIO_CHANGED:          { icon: '📝', label: 'Bio changed' },
  LINK_CHANGED:         { icon: '🔗', label: 'Link changed' },
  AVATAR_CHANGED:       { icon: '🖼️', label: 'Profile photo changed' },
  NEW_POST:             { icon: '📸', label: 'New post' },
  POST_DELETED:         { icon: '🗑️', label: 'Post deleted' },
  NEW_FOLLOW:           { icon: '👀', label: 'Started following' },
  WENT_PRIVATE:         { icon: '🔒', label: 'Account went private' },
  DISPLAY_NAME_CHANGED: { icon: '✏️', label: 'Display name changed' },
  USERNAME_CHANGED:     { icon: '🔄', label: 'Username changed' },
  VERIFIED_CHANGED:     { icon: '✅', label: 'Verification status changed' },
  CATEGORY_CHANGED:     { icon: '🏷️', label: 'Category changed' },
  PRONOUNS_CHANGED:     { icon: '💬', label: 'Pronouns changed' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncate(s: string | null | undefined, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export function StalkerEventFeed({ trackedAccountId, className }: StalkerEventFeedProps) {
  const [events, setEvents] = useState<StalkerEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (trackedAccountId) params.set('trackedAccountId', trackedAccountId);
      const res = await fetch(`/api/stalker/events?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedAccountId]);

  async function markAllRead() {
    await fetch('/api/stalker/events/read-all', { method: 'POST' });
    setEvents(prev => prev.map(e => ({ ...e, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className={`overflow-y-auto max-h-96 ${className ?? ''}`}>
      <div className="sticky top-0 bg-white flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <span className="font-semibold text-sm text-gray-700">Activity</span>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="ml-auto text-xs text-blue-600 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 p-3">
          <div className="animate-pulse bg-gray-100 rounded h-10 w-full" />
          <div className="animate-pulse bg-gray-100 rounded h-10 w-full" />
          <div className="animate-pulse bg-gray-100 rounded h-10 w-full" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 px-4">
          No activity yet — we'll notify you when something changes.
        </p>
      ) : (
        <ul>
          {events.map(event => {
            const meta = SIGNAL_META[event.signal] ?? { icon: '❓', label: event.signal };
            const hasValues =
              (event.oldValue !== null && event.oldValue !== '') ||
              (event.newValue !== null && event.newValue !== '');

            return (
              <li
                key={event.id}
                className={`flex items-start gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0 ${
                  event.read ? '' : 'bg-blue-50'
                }`}
              >
                <div className="w-8 h-8 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-base">
                  {meta.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">@{event.handle}</span>{' '}
                    {meta.label}
                  </p>
                  {hasValues && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {event.oldValue !== null && event.oldValue !== '' && (
                        <p>was: {truncate(event.oldValue, 40)}</p>
                      )}
                      {event.newValue !== null && event.newValue !== '' && (
                        <p>now: {truncate(event.newValue, 40)}</p>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-xs text-gray-400 shrink-0 pt-0.5">
                  {relativeTime(event.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
