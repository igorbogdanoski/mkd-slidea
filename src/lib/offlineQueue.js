// Offline-resilient vote/answer queue.
// When the user has no connectivity (or Supabase fetch fails) we persist the
// pending vote in localStorage and replay it the moment we come back online.
//
// A queued item carries two independent halves, because the app writes the
// vote in two places and only one of them is idempotent:
//   • `row`  — the `votes` audit row, claimed through claim_vote_graded().
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

// A queued item is not only waiting for connectivity. /api/vote-text rate
// limits per IP, and a class submitting a word cloud from behind one school NAT
// blows through that window in seconds — those votes are owed a retry while the
// phone is perfectly online, and `online` will never fire to trigger one.
// Bounded, so a genuinely dead item cannot keep waking the app forever.
const RETRY_DELAY_MS = 10_000;
const MAX_RETRIES = 6;
let retryTimer = null;
let retryAttempts = 0;

function scheduleRetry() {
  if (retryTimer !== null || retryAttempts >= MAX_RETRIES) return;
  retryAttempts += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    flushQueue();
  }, RETRY_DELAY_MS);
}

function clearRetry() {
  if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
  retryAttempts = 0;
}

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
  // Offline is the `online` event's job, not the retry timer's — burning retry
  // attempts while the phone has no signal would spend the budget before there
  // is anything to spend it on.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const items = readQueue();
  if (!items.length) { clearRetry(); return; }
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

      // 2. Then the audit row, through claim_vote_graded() — the same SECURITY
      //    DEFINER function the online path uses.
      //
      //    This was `supabase.from('votes').upsert(row, { onConflict: … })`.
      //    An upsert is INSERT … ON CONFLICT DO UPDATE, and the planner wants
      //    ACL_UPDATE on the table whether or not a conflict ever occurs. Anon
      //    lost UPDATE on votes when the lock-down landed (measured on
      //    production: 42501 insufficient_privilege), so every replay failed.
      //    A participant offline in a classroom was told the vote was saved,
      //    was locked out of the activity by markVoted(), and the answer then
      //    never arrived — the item stayed queued and retried into the same
      //    denial on every `online` event and every app boot, forever.
      //
      //    The function runs as its definer, so it needs no grant on the table,
      //    and its ON CONFLICT DO NOTHING makes the replay safe to repeat.
      //    `false` means a row is already there for this session and activity,
      //    which is the outcome we wanted — only a call error keeps it queued.
      //
      //    It grades from p_option_id rather than taking a verdict, so a queued
      //    item carries the option the participant chose. An item written by an
      //    older build carries is_correct and no option_id; it replays as
      //    ungraded, which is still better than what it did before — nothing.
      const { error } = await supabase.rpc('claim_vote_graded', {
        p_poll_id: item.row.poll_id,
        p_session_id: item.row.session_id,
        p_username: item.row.username ?? 'Анонимен',
        p_answer_text: item.row.answer_text ?? null,
        p_option_id: item.row.option_id ?? null,
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
  // Something is still owed and the phone is online — a rate-limited text vote,
  // a transient RPC failure. Nothing else will wake this up, so wake it.
  if (readQueue().length) scheduleRetry();
  else clearRetry();
}

/** Ask for a replay soon, from a caller that has just queued while online. */
export function scheduleFlush() {
  if (!readQueue().length) return;
  retryAttempts = 0; // a fresh debt gets a fresh budget
  scheduleRetry();
}

export function initOfflineQueue() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => { retryAttempts = 0; flushQueue(); });
  // Also try on app boot in case the user was offline on close.
  setTimeout(() => { flushQueue(); }, 2000);
}

export function pendingCount() {
  return readQueue().length;
}
