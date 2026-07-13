#!/usr/bin/env node
// Live regression check for two fixes that can't be meaningfully unit-tested
// without a real Postgres connection: the options.event_id realtime-filter
// trigger, and the atomic upsert_text_option() word-cloud RPC. Both were only
// verified manually during the self-hosted migration session — this script
// makes that verification repeatable instead of tribal knowledge.
//
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/verify-realtime-db-fixes.mjs
// Creates and deletes its own throwaway event/poll — safe to run against production.

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SB_URL || !SB_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

async function rest(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}), Prefer: opts.method ? 'return=representation' : undefined },
  });
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function rpc(name, args) {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers, body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`rpc ${name} -> ${res.status} ${await res.text()}`);
}

let failed = false;
const check = (label, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${label}`);
  if (!cond) failed = true;
};

const testCode = `TST${Date.now().toString(36).slice(-6).toUpperCase()}`;
let eventId, pollId;

try {
  console.log('Creating throwaway test event/poll...');
  const [event] = await rest('events', { method: 'POST', body: JSON.stringify({ code: testCode, title: 'verify-script' }) });
  eventId = event.id;
  const [poll] = await rest('polls', { method: 'POST', body: JSON.stringify({ event_id: eventId, question: 'verify-script', type: 'wordcloud' }) });
  pollId = poll.id;

  // --- Test 1: options.event_id trigger auto-populates without being set explicitly ---
  const [option] = await rest('options', { method: 'POST', body: JSON.stringify({ poll_id: pollId, text: 'trigger-check', votes: 0 }) });
  check('options.event_id trigger auto-populates on insert', option.event_id === eventId);

  // --- Test 2: upsert_text_option() is atomic — same word twice merges into one row ---
  await rpc('upsert_text_option', { p_poll_id: pollId, p_text: 'React', p_is_approved: true });
  await rpc('upsert_text_option', { p_poll_id: pollId, p_text: 'react', p_is_approved: true }); // different case, same lower()
  const rows = await rest(`options?poll_id=eq.${pollId}&text=ilike.react&select=text,votes`);
  check('upsert_text_option merges case-insensitive duplicates into ONE row', rows.length === 1);
  check('merged row has votes=2 (not 2 separate rows with votes=1 each)', rows[0]?.votes === 2);

  // --- Test 3: concurrent submissions of the same word don't race into duplicates ---
  await Promise.all([
    rpc('upsert_text_option', { p_poll_id: pollId, p_text: 'concurrent', p_is_approved: true }),
    rpc('upsert_text_option', { p_poll_id: pollId, p_text: 'concurrent', p_is_approved: true }),
    rpc('upsert_text_option', { p_poll_id: pollId, p_text: 'concurrent', p_is_approved: true }),
  ]);
  const concurrentRows = await rest(`options?poll_id=eq.${pollId}&text=ilike.concurrent&select=text,votes`);
  check('3 concurrent identical submissions produce exactly 1 row', concurrentRows.length === 1);
  check('...with votes=3 (no lost updates under concurrency)', concurrentRows[0]?.votes === 3);
} finally {
  if (eventId) {
    await fetch(`${SB_URL}/rest/v1/events?id=eq.${eventId}`, { method: 'DELETE', headers }).catch(() => {});
    console.log('Cleaned up test event (cascade deleted poll/options).');
  }
}

process.exit(failed ? 1 : 0);
