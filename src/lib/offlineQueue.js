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

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function queueVote(payload) {
  const q = readQueue();
  q.push({ ...payload, id: makeId(), queued_at: Date.now() });
  writeQueue(q);
}

export async function flushQueue() {
  if (flushing) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const items = readQueue();
  if (!items.length) return;
  flushing = true;
  const succeededIds = new Set();
  for (const item of items) {
    const id = item.id || (item.id = makeId());
    try {
      const { error } = await supabase.from('votes').upsert(item.row, {
        onConflict: 'poll_id,session_id',
        ignoreDuplicates: false,
      });
      if (!error) succeededIds.add(id);
    } catch {
      // leave it queued for the next flush attempt
    }
  }
  // Re-read the queue instead of writing back the start-of-flush snapshot —
  // queueVote() may have appended new items while this flush was in flight,
  // and blindly overwriting with the stale snapshot would drop them.
  const current = readQueue();
  writeQueue(current.filter(item => !succeededIds.has(item.id)));
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
