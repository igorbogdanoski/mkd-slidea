// Gives back the fixed scale to activities that lost it.
//
// `rating` maps a tapped star onto options[star - 1]; `scale` does the same
// with its 1–10 row. With no option rows the index misses and tapping does
// nothing — no error, no feedback, and the host sees an activity that simply
// never collects an answer. Seven ratings were live in that state, created by
// paths that skipped option insertion when the author supplied an empty array.
//
// Usage: node scripts/repairPollOptions.mjs [--apply]      (default: dry run)
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const h = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

const SCALES = {
  rating: ['1', '2', '3', '4', '5'],
  scale: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

const res = await fetch(`${env.SUPABASE_URL}/rest/v1/polls?select=id,type,question,event_id,options(id)&limit=5000`, { headers: h });
const polls = await res.json();

const broken = polls.filter((p) => SCALES[p.type] && (p.options || []).length === 0);
console.log(`${polls.length} polls scanned`);
console.log(`missing their fixed scale: ${broken.length}`);
broken.forEach((p) => console.log(`   ${p.type}  ${String(p.question || '').slice(0, 60)}`));

if (!APPLY) {
  console.log('\n--- dry run, nothing written. Re-run with --apply ---');
  process.exit(0);
}

let ok = 0, failed = 0;
for (const p of broken) {
  const rows = SCALES[p.type].map((text) => ({ poll_id: p.id, text, votes: 0, is_correct: false }));
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/options`, {
    method: 'POST', headers: { ...h, Prefer: 'return=minimal' }, body: JSON.stringify(rows),
  });
  if (r.ok) ok++; else { failed++; console.error(`  ! ${p.id}: ${r.status} ${await r.text()}`); }
}
console.log(`\nrepaired ${ok}, failed ${failed}`);
