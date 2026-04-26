// Offline-resilient vote/answer queue.
// When the user has no connectivity (or Supabase fetch fails) we persist the
// pending vote in localStorage and replay it the moment we come back online.
// Replay is idempotent — votes are upserted on (poll_id, session_id).
import { supabase } from './supabase';

const STORAGE_KEY = 'mkd_slidea_pending_votes_v1';
let flushing = false;

function readQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota / private mode — drop silently.
  }
}

export function queueVote(payload) {
  const q = readQueue();
  q.push({ ...payload, queued_at: Date.now() });
  writeQueue(q);
}

export async function flushQueue() {
  if (flushing) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const items = readQueue();
  if (!items.length) return;
  flushing = true;
  const remaining = [];
  for (const item of items) {
    try {
      const { error } = await supabase.from('votes').upsert(item.row, {
        onConflict: 'poll_id,session_id',
        ignoreDuplicates: false,
      });
      if (error) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  flushing = false;
}

export function initOfflineQueue() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => { flushQueue(); });
  // Also try on app boot in case the user was offline on close.
  setTimeout(() => { flushQueue(); }, 2000);
}

export function pendingCount() {
  return readQueue().length;
}
