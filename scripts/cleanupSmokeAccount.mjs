// Deletes every event owned by the throwaway smoke test account, children
// first. Each authenticated browser context creates its own event, so a full
// Playwright run leaves dozens behind — 146 had piled up by 30.08.2026, enough
// that the analytics aggregate stopped rendering inside DB-04's timeout.
//
//   node scripts/cleanupSmokeAccount.mjs            # dry run — counts only
//   node scripts/cleanupSmokeAccount.mjs --confirm  # actually delete
//
// Igor's own events are never touched: the filter is user_id = the smoke
// account's uid, so B5V338 and every real presentation are out of scope.
import { readFileSync } from 'fs';

const CONFIRM = process.argv.includes('--confirm');
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const URL_ = env.VITE_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

const SMOKE_EMAIL = process.env.SMOKE_TEST_EMAIL || 'smoke@mismath.net';

const get = async (path) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: H });
  const t = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t);
};
const del = async (path) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { method: 'DELETE', headers: H });
  if (!r.ok) throw new Error(`DELETE ${path} → ${r.status} ${(await r.text()).slice(0, 200)}`);
};

// PostgREST caps `in.()` lists by URL length, so chunk the id lists.
const chunk = (arr, n = 60) => arr.reduce((acc, v, i) => {
  if (i % n === 0) acc.push([]);
  acc[acc.length - 1].push(v);
  return acc;
}, []);

const main = async () => {
  const [profile] = await get(`profiles?select=id,email&email=eq.${SMOKE_EMAIL}`);
  if (!profile) throw new Error(`no profile for ${SMOKE_EMAIL}`);
  const uid = profile.id;
  console.log(`smoke account ${SMOKE_EMAIL} → ${uid}`);

  const events = await get(`events?select=id,code&user_id=eq.${uid}`);
  const eventIds = events.map((e) => e.id);
  console.log(`events owned: ${eventIds.length}`);
  if (!eventIds.length) return;

  const polls = [];
  for (const ids of chunk(eventIds)) {
    polls.push(...await get(`polls?select=id&event_id=in.(${ids.join(',')})`));
  }
  const pollIds = polls.map((p) => p.id);
  console.log(`polls under them: ${pollIds.length}`);

  // survey_responses hangs off poll_id, not event_id — the realtime channel in
  // the participant view filters on `poll_id=eq.…`.
  let votes = 0, responses = 0, options = 0;
  for (const ids of chunk(pollIds)) {
    votes += (await get(`votes?select=id&poll_id=in.(${ids.join(',')})`)).length;
    options += (await get(`options?select=id&poll_id=in.(${ids.join(',')})`)).length;
    responses += (await get(`survey_responses?select=id&poll_id=in.(${ids.join(',')})`)).length;
  }
  console.log(`votes: ${votes}, options: ${options}, survey_responses: ${responses}`);

  if (!CONFIRM) { console.log('\n--- dry run. Re-run with --confirm to delete. ---'); return; }

  for (const ids of chunk(pollIds)) {
    await del(`votes?poll_id=in.(${ids.join(',')})`);
    await del(`options?poll_id=in.(${ids.join(',')})`);
    await del(`survey_responses?poll_id=in.(${ids.join(',')})`);
  }
  for (const ids of chunk(eventIds)) {
    await del(`polls?event_id=in.(${ids.join(',')})`);
  }
  await del(`events?user_id=eq.${uid}`);

  const left = await get(`events?select=id&user_id=eq.${uid}`);
  console.log(`deleted. events remaining for smoke: ${left.length}`);
};

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
