/**
 * offlineQueue.ts
 * Queues failed Supabase script saves to localStorage and drains them
 * when the network comes back online.
 */

import type { CallScript } from '../types';
import { saveScript } from './db';

const QUEUE_KEY = 'callmate_offline_save_queue';

interface QueueEntry {
  userId: string;
  script: CallScript;
  queuedAt: number;
}

function readQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueueEntry[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — nothing we can do
  }
}

/** Enqueue a failed script save for retry when online. */
export function enqueueFailedSave(userId: string, script: CallScript) {
  const queue = readQueue();
  // Deduplicate by script id — replace existing entry if any
  const filtered = queue.filter((e) => e.script.id !== script.id);
  filtered.push({ userId, script, queuedAt: Date.now() });
  writeQueue(filtered);
}

/** Returns the number of pending offline saves. */
export function offlineQueueLength(): number {
  return readQueue().length;
}

/**
 * Attempt to drain all queued saves.
 * Resolves with the number of entries successfully flushed.
 * Entries that still fail are left in the queue.
 */
export async function drainOfflineQueue(): Promise<number> {
  const queue = readQueue();
  if (!queue.length) return 0;

  const remaining: QueueEntry[] = [];
  let flushed = 0;

  await Promise.allSettled(
    queue.map(async (entry) => {
      try {
        await saveScript(entry.userId, entry.script);
        flushed++;
      } catch {
        remaining.push(entry);
      }
    })
  );

  writeQueue(remaining);
  return flushed;
}
