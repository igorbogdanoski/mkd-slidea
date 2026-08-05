// Offline-resilient vote/answer queue.
// When the user has no connectivity (or Supabase fetch fails) we persist the
// pending vote in localStorage and replay it the moment we come back online.
//
// A queued item carries two independent halves, because the app writes the
// vote in two places and only one of them is idempotent:
//   • `row`  — the `votes` audit row, upserted on (poll_id, session_id).
//   • `ops`  — the aggregate increments (`increment_vote` /
//              `increment_vote_weighted` / `/api/vote-text`) that actually move
//              `options.votes`. There is no AFTER INSERT trigger on `votes`, so
//              without replaying these the offline vote is never counted and the
//              "гласот е зачуван" promise is a lie.
// `ops` are NOT idempotent, so the caller only queues the ones it knows never
// landed, and flushQueue drops each op from the item the moment it succeeds —
// a failure halfway through can never double-count on the next attempt.
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

// Replays a single aggregate operation. Resolves true only when the increment
// is known to have been applied — anything else leaves the op queued.
async function replayOp(op) {
  if (!op || !op.kind) return true; // nothing to do — treat as applied
  if (op.kind === 'text') {
    const res = await fetch('/api/vote-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId: op.pollId, text: op.text }),
    });
    return res.ok;
  }
  if (op.kind === 'weighted') {
    const { error } = await supabase.rpc('increment_vote_weighted', {
      option_id: op.optionId,
      weight: op.weight,
    });
    return !error;
  }
  if (op.kind === 'option') {
    const { error } = await supabase.rpc('increment_vote', { option_id: op.optionId });
    return !error;
  }
  return true; // unknown kind from an older build — don't block the queue forever
}

export async function flushQueue() {
  if (flushing) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const items = readQueue();
  if (!items.length) return;
  flushing = true;
  const succeededIds = new Set();
  // Ops confirmed applied during this flush, so a later failure in the same
  // item doesn't replay them: id -> remaining ops.
  const remainingOps = new Map();
  for (const item of items) {
    const id = item.id || (item.id = makeId());
    try {
      // 1. Aggregates first — this is what makes the vote actually count.
      const ops = Array.isArray(item.ops) ? [...item.ops] : [];
      while (ops.length) {
        const applied = await replayOp(ops[0]);
        if (!applied) break;
        ops.shift();
      }
      remainingOps.set(id, ops);
      if (ops.length) continue; // still owes increments — retry the whole item later

      // 2. Then the audit row (idempotent).
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
  writeQueue(
    current
      .filter(item => !succeededIds.has(item.id))
      .map(item => (remainingOps.has(item.id) ? { ...item, ops: remainingOps.get(item.id) } : item))
  );
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
