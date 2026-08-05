// Load test run FROM the VPS itself (same machine/network as the server),
// eliminating the test client's own network path as a variable. Mirrors
// useEvent.js's channel setup + vote RPC exactly.
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

const N = parseInt(process.argv[2] || '50', 10);
const RAMP_MS = parseInt(process.argv[3] || '10000', 10);

const admin = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false }, realtime: { transport: WebSocket } });

function percentile(arr, p) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function subscribeChannel(channel, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const timeout = setTimeout(() => resolve({ status: 'CLIENT_TIMEOUT', ms: Date.now() - t0 }), timeoutMs);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timeout);
        resolve({ status, ms: Date.now() - t0 });
      }
    });
  });
}

async function simulateParticipant(idx, eventId, eventCode, optionId) {
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

  const connectStart = Date.now();
  const results = await Promise.all(channels.map((ch) => subscribeChannel(ch)));
  const connectMs = Date.now() - connectStart;
  const subscribed = results.filter((r) => r.status === 'SUBSCRIBED').length;
  const failures = results.filter((r) => r.status !== 'SUBSCRIBED').map((r) => r.status);

  return { idx, client, channels, optionId, connectMs, subscribed, failures, total: channels.length };
}

async function main() {
  console.log(`Load test (FROM VPS): N=${N} participants, ramp=${RAMP_MS}ms, target=${SUPABASE_URL}`);

  const { data: signIn, error: signInErr } = await admin.auth.signInWithPassword({
    email: process.env.LOADTEST_EMAIL || env.LOADTEST_EMAIL,
    password: process.env.LOADTEST_PASSWORD || env.LOADTEST_PASSWORD,
  });
  if (signInErr) throw new Error('admin sign-in failed: ' + signInErr.message);

  const code = 'LT' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const { data: event, error: evErr } = await admin.from('events')
    .insert([{ code, title: 'LOAD TEST — safe to delete', user_id: signIn.user.id }])
    .select().single();
  if (evErr) throw new Error('event create failed: ' + evErr.message);

  const { data: poll, error: pollErr } = await admin.from('polls')
    .insert([{ event_id: event.id, question: 'Load test poll', type: 'poll', active: true }])
    .select().single();
  if (pollErr) throw new Error('poll create failed: ' + pollErr.message);

  const { data: opts, error: optErr } = await admin.from('options')
    .insert([
      { poll_id: poll.id, event_id: event.id, text: 'A' },
      { poll_id: poll.id, event_id: event.id, text: 'B' },
      { poll_id: poll.id, event_id: event.id, text: 'C' },
      { poll_id: poll.id, event_id: event.id, text: 'D' },
    ])
    .select();
  if (optErr) throw new Error('option create failed: ' + optErr.message);
  const optionIds = opts.map((o) => o.id);

  await admin.from('events').update({ active_poll_id: poll.id }).eq('id', event.id);
  console.log(`Test event created: code=${code} event_id=${event.id} poll_id=${poll.id} options=${optionIds.length}`);

  const batchSize = Math.max(1, Math.ceil(N / 20));
  const delayPerBatch = RAMP_MS / Math.ceil(N / batchSize);
  let launched = 0;
  const launchPromises = [];
  while (launched < N) {
    const batch = [];
    for (let i = 0; i < batchSize && launched < N; i++, launched++) {
      batch.push(simulateParticipant(launched, event.id, code, optionIds[launched % optionIds.length]));
    }
    launchPromises.push(...batch);
    if (launched < N) await new Promise((r) => setTimeout(r, delayPerBatch));
  }

  console.log(`All ${N} participants launched, waiting for connections to settle...`);
  const results = await Promise.all(launchPromises);

  const connectMsAll = results.map((r) => r.connectMs);
  const fullyConnected = results.filter((r) => r.subscribed === r.total).length;
  const failedConnected = results.filter((r) => r.subscribed === 0).length;

  console.log('\n=== CONNECTION RESULTS ===');
  console.log(`Fully connected (6/6 channels): ${fullyConnected}/${N} (${(100 * fullyConnected / N).toFixed(1)}%)`);
  console.log(`Failed to connect at all: ${failedConnected}/${N}`);
  console.log(`Connect time (ms) — p50=${percentile(connectMsAll, 50)} p95=${percentile(connectMsAll, 95)} max=${Math.max(...connectMsAll)}`);

  await new Promise((r) => setTimeout(r, 2000));
  console.log('\nFiring vote burst (all participants vote simultaneously)...');
  const voteStart = Date.now();
  let firstErrorDetail = null;
  const voteResults = await Promise.all(results.map(async (r) => {
    const t0 = Date.now();
    try {
      const { error } = await r.client.rpc('increment_vote', { option_id: r.optionId });
      if (error && !firstErrorDetail) firstErrorDetail = JSON.stringify(error);
      return { ms: Date.now() - t0, error: error?.message || null };
    } catch (e) {
      if (!firstErrorDetail) firstErrorDetail = `${e.message} | cause: ${e.cause ? JSON.stringify({ code: e.cause.code, message: e.cause.message, errno: e.cause.errno }) : 'none'}`;
      return { ms: Date.now() - t0, error: e.message };
    }
  }));
  const voteBurstMs = Date.now() - voteStart;

  const voteMsAll = voteResults.map((v) => v.ms);
  const voteSuccess = voteResults.filter((v) => !v.error).length;
  const voteErrors = voteResults.filter((v) => v.error).map((v) => v.error);
  const voteErrorCounts = voteErrors.reduce((acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc; }, {});

  console.log('\n=== VOTE BURST RESULTS ===');
  console.log(`Total wall time for all ${N} votes to complete: ${voteBurstMs}ms`);
  console.log(`Success: ${voteSuccess}/${N} (${(100 * voteSuccess / N).toFixed(1)}%)`);
  console.log(`Vote latency (ms) — p50=${percentile(voteMsAll, 50)} p95=${percentile(voteMsAll, 95)} max=${Math.max(...voteMsAll)}`);
  if (voteErrors.length) console.log('Vote error reasons:', voteErrorCounts);
  if (firstErrorDetail) console.log('First error detail:', firstErrorDetail);

  const { data: finalOptions } = await admin.from('options').select('text, votes').eq('poll_id', poll.id).order('text');
  const totalVotes = (finalOptions || []).reduce((sum, o) => sum + o.votes, 0);
  console.log(`\nDB vote counts after burst: total=${totalVotes} (expected ${voteSuccess})`);

  console.log('\nCleaning up...');
  for (const r of results) { for (const ch of r.channels) { try { r.client.removeChannel(ch); } catch {} } }
  const { error: delErr } = await admin.from('events').delete().eq('id', event.id);
  console.log('Deleted test event:', delErr ? delErr.message : 'ok');
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
