// Multi-event load test — run FROM the VPS itself.
//
// The existing load_test.mjs answers "can one event hold N participants?".
// A school does not look like that. One shift at a 60-teacher school is a
// dozen or more classes running at the same time, each its own event with its
// own six realtime channels, each with 20–26 students. Same total connection
// count, completely different shape: many channels with few subscribers each,
// rather than few channels with many.
//
// Usage:  node multi_event_test.mjs <events> <participantsPerEvent> [rampMs]
// Example: node multi_event_test.mjs 16 26 30000
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { readFileSync } from 'fs';

const envText = readFileSync('/root/supabase-mkd-slidea/docker/.env', 'utf8');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
const SUPABASE_URL = env.SUPABASE_PUBLIC_URL || env.API_EXTERNAL_URL;
const ANON_KEY = env.ANON_KEY;

// Credentials come from the environment, never the file. An earlier copy of
// this script carried the admin email and password inline; on a VPS that is
// bad enough, but committed to the repo it would be a published credential.
if (!(process.env.LOADTEST_EMAIL || env.LOADTEST_EMAIL)) {
  console.error('Set LOADTEST_EMAIL and LOADTEST_PASSWORD (env or docker/.env) before running.');
  process.exit(1);
}

const N_EVENTS = parseInt(process.argv[2] || '16', 10);
const PER_EVENT = parseInt(process.argv[3] || '26', 10);
const RAMP_MS = parseInt(process.argv[4] || '30000', 10);
// Spread the votes over this window. Zero = the synthetic worst case where
// every student in every class taps in the same millisecond. A real shift
// has classes at different points in their lesson, so the realistic figure
// is a spread, not a spike.
const VOTE_SPREAD_MS = parseInt(process.argv[5] || '0', 10);
const TOTAL = N_EVENTS * PER_EVENT;

const admin = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false }, realtime: { transport: WebSocket } });

const percentile = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

function subscribeChannel(channel, timeoutMs = 25000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const timeout = setTimeout(() => resolve({ status: 'CLIENT_TIMEOUT', ms: Date.now() - t0 }), timeoutMs);
    channel.subscribe((status) => {
      if (['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
        clearTimeout(timeout);
        resolve({ status, ms: Date.now() - t0 });
      }
    });
  });
}

// Identical channel set to useEvent.js, so this measures the real client cost.
async function simulateParticipant(eventId, eventCode, optionId, eventIdx) {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false }, realtime: { transport: WebSocket } });
  await client.from('events').select('id').ilike('code', eventCode).limit(1);

  const channels = [
    client.channel(`event-polls-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${eventId}` }, () => {})
      .on('postgres_changes', { event: '*', schema: 'public', table: 'options', filter: `event_id=eq.${eventId}` }, () => {}),
    client.channel(`event-questions-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${eventId}` }, () => {}),
    client.channel(`reactions:${eventId}`, { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'emoji' }, () => {})
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions', filter: `event_id=eq.${eventId}` }, () => {}),
    client.channel(`event-details-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, () => {}),
    client.channel(`event-nav-${eventId}`)
      .on('broadcast', { event: 'active-poll' }, () => {}),
    client.channel(`presence:${eventId}`)
      .on('presence', { event: 'sync' }, () => {}),
  ];

  const t0 = Date.now();
  const results = await Promise.all(channels.map((ch) => subscribeChannel(ch)));
  const connectMs = Date.now() - t0;
  const subscribed = results.filter((r) => r.status === 'SUBSCRIBED').length;

  return { client, channels, optionId, connectMs, subscribed, total: channels.length, eventIdx };
}

async function main() {
  console.log(`Multi-event load test (FROM VPS)`);
  console.log(`  events=${N_EVENTS}  participants/event=${PER_EVENT}  total=${TOTAL}  ramp=${RAMP_MS}ms`);
  console.log(`  target=${SUPABASE_URL}\n`);

  const { data: signIn, error: signInErr } = await admin.auth.signInWithPassword({
    email: process.env.LOADTEST_EMAIL || env.LOADTEST_EMAIL,
    password: process.env.LOADTEST_PASSWORD || env.LOADTEST_PASSWORD,
  });
  if (signInErr) throw new Error('admin sign-in failed: ' + signInErr.message);

  // ── Build N independent events, each like a real classroom ──────────────
  const events = [];
  for (let e = 0; e < N_EVENTS; e++) {
    const code = 'MT' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const { data: event, error: evErr } = await admin.from('events')
      .insert([{ code, title: `MULTI LOAD TEST ${e + 1} — safe to delete`, user_id: signIn.user.id }])
      .select().single();
    if (evErr) throw new Error(`event ${e} create failed: ` + evErr.message);

    const { data: poll, error: pollErr } = await admin.from('polls')
      .insert([{ event_id: event.id, question: `Час ${e + 1} — тест прашање`, type: 'poll', active: true }])
      .select().single();
    if (pollErr) throw new Error(`poll ${e} create failed: ` + pollErr.message);

    const { data: opts, error: optErr } = await admin.from('options')
      .insert(['A', 'B', 'C', 'D'].map((t) => ({ poll_id: poll.id, event_id: event.id, text: t })))
      .select();
    if (optErr) throw new Error(`options ${e} create failed: ` + optErr.message);

    await admin.from('events').update({ active_poll_id: poll.id }).eq('id', event.id);
    events.push({ code, id: event.id, pollId: poll.id, optionIds: opts.map((o) => o.id) });
  }
  console.log(`Created ${events.length} test events\n`);

  // ── Ramp everyone in, interleaved across events, as a bell would ────────
  const batchCount = 20;
  const batchSize = Math.max(1, Math.ceil(TOTAL / batchCount));
  const delayPerBatch = RAMP_MS / batchCount;

  const launched = [];
  let n = 0;
  while (n < TOTAL) {
    for (let i = 0; i < batchSize && n < TOTAL; i++, n++) {
      const eventIdx = n % N_EVENTS;
      const ev = events[eventIdx];
      launched.push(simulateParticipant(ev.id, ev.code, ev.optionIds[n % 4], eventIdx));
    }
    if (n < TOTAL) await new Promise((r) => setTimeout(r, delayPerBatch));
  }

  console.log(`All ${TOTAL} participants launched across ${N_EVENTS} events, settling...`);
  const results = await Promise.all(launched);

  const connectMsAll = results.map((r) => r.connectMs);
  const fullyConnected = results.filter((r) => r.subscribed === r.total).length;
  const noneConnected = results.filter((r) => r.subscribed === 0).length;

  console.log('\n=== CONNECTION RESULTS ===');
  console.log(`Fully connected (6/6 channels): ${fullyConnected}/${TOTAL} (${(100 * fullyConnected / TOTAL).toFixed(1)}%)`);
  console.log(`Failed entirely: ${noneConnected}/${TOTAL}`);
  console.log(`Connect ms — p50=${percentile(connectMsAll, 50)} p95=${percentile(connectMsAll, 95)} max=${Math.max(...connectMsAll)}`);
  console.log(`Total realtime channel subscriptions: ${TOTAL * 6}`);

  // ── The bell rings: every class votes at once ───────────────────────────
  await new Promise((r) => setTimeout(r, 3000));
  console.log('\nFiring vote burst — every participant in every event votes simultaneously...');
  const voteStart = Date.now();
  let firstError = null;
  const voteResults = await Promise.all(results.map(async (r, i) => {
    if (VOTE_SPREAD_MS > 0) await new Promise((res) => setTimeout(res, Math.floor((i / results.length) * VOTE_SPREAD_MS)));
    const t0 = Date.now();
    try {
      const { error } = await r.client.rpc('increment_vote', { option_id: r.optionId });
      if (error && !firstError) firstError = JSON.stringify(error);
      return { ms: Date.now() - t0, error: error?.message || null, eventIdx: r.eventIdx };
    } catch (e) {
      if (!firstError) firstError = e.message;
      return { ms: Date.now() - t0, error: e.message, eventIdx: r.eventIdx };
    }
  }));
  const burstMs = Date.now() - voteStart;

  const voteMs = voteResults.map((v) => v.ms);
  const ok = voteResults.filter((v) => !v.error).length;
  const errCounts = voteResults.filter((v) => v.error)
    .reduce((a, v) => { a[v.error] = (a[v.error] || 0) + 1; return a; }, {});

  console.log('\n=== VOTE BURST RESULTS ===');
  console.log(`Wall time for all ${TOTAL} votes: ${burstMs}ms`);
  console.log(`Success: ${ok}/${TOTAL} (${(100 * ok / TOTAL).toFixed(1)}%)`);
  console.log(`Vote latency ms — p50=${percentile(voteMs, 50)} p95=${percentile(voteMs, 95)} max=${Math.max(...voteMs)}`);
  if (Object.keys(errCounts).length) console.log('Errors:', errCounts);
  if (firstError) console.log('First error detail:', firstError);

  // Per-event breakdown — a single struggling classroom would hide in the aggregate.
  console.log('\n=== PER-EVENT ===');
  for (let e = 0; e < N_EVENTS; e++) {
    const mine = voteResults.filter((v) => v.eventIdx === e);
    const mineOk = mine.filter((v) => !v.error).length;
    const { data: finalOpts } = await admin.from('options').select('votes').eq('poll_id', events[e].pollId);
    const dbVotes = (finalOpts || []).reduce((s, o) => s + o.votes, 0);
    console.log(`  event ${String(e + 1).padStart(2)}: votes ok ${mineOk}/${mine.length}, DB total ${dbVotes}, p50 ${percentile(mine.map(v => v.ms), 50)}ms`);
  }

  console.log('\nCleaning up...');
  for (const r of results) for (const ch of r.channels) { try { r.client.removeChannel(ch); } catch { /* ignore */ } }
  for (const ev of events) {
    const { error } = await admin.from('events').delete().eq('id', ev.id);
    if (error) console.log(`  ! failed to delete ${ev.code}: ${error.message}`);
  }
  console.log(`Deleted ${events.length} test events`);
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
