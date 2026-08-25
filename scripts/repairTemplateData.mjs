// Repairs two defects in community_templates that the app now tolerates but
// should not have to.
//
//   1. `polls` held as a JSON *string* instead of an array (18 rows). The
//      gallery renders `polls.length`, which on a string is the character
//      count — those templates advertised thousands of activities.
//   2. `word_cloud` where every branch in the app matches `wordcloud`. An
//      unmatched type falls through to the multiple-choice renderer and shows
//      an empty panel.
//
// Usage: node scripts/repairTemplateData.mjs [--apply]     (default: dry run)
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

const ALIASES = { word_cloud: 'wordcloud', wordCloud: 'wordcloud' };

const res = await fetch(`${env.SUPABASE_URL}/rest/v1/community_templates?select=id,slug,polls&limit=2000`, { headers: h });
const rows = await res.json();

let stringFixed = 0, typeFixed = 0, touched = 0;
const updates = [];

for (const row of rows) {
  let polls = row.polls;
  let changed = false;

  if (typeof polls === 'string') {
    try { polls = JSON.parse(polls); changed = true; stringFixed++; }
    catch { console.warn(`  ! ${row.slug}: polls is a string that will not parse — left alone`); continue; }
  }
  if (!Array.isArray(polls)) continue;

  polls = polls.map((p) => {
    if (p && ALIASES[p.type]) { changed = true; typeFixed++; return { ...p, type: ALIASES[p.type] }; }
    return p;
  });

  if (changed) { touched++; updates.push({ id: row.id, slug: row.slug, polls }); }
}

console.log(`${rows.length} templates scanned`);
console.log(`  stringified polls to parse: ${stringFixed}`);
console.log(`  word_cloud activities to rename: ${typeFixed}`);
console.log(`  rows to update: ${touched}`);

if (!APPLY) {
  console.log('\n--- dry run, nothing written. Re-run with --apply ---');
  updates.slice(0, 5).forEach((u) => console.log(`   ${u.slug} → ${u.polls.length} activities`));
  process.exit(0);
}

let ok = 0, failed = 0;
for (const u of updates) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/community_templates?id=eq.${u.id}`, {
    method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ polls: u.polls }),
  });
  if (r.ok) { ok++; } else { failed++; console.error(`  ! ${u.slug}: ${r.status} ${await r.text()}`); }
}
console.log(`\nupdated ${ok}, failed ${failed}`);
