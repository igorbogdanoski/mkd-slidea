// Loads the generated curriculum templates into community_templates.
//
//   node scripts/seedMathTemplates.mjs [--dry]
//
// They go in the database rather than the bundle on purpose. The generated
// file is 1.3MB; importing it anywhere reachable from the app would put that
// on every visitor's first load, for templates most of them will never open —
// the same mistake as letting KaTeX into the eager vendor chunk, five times
// larger. The public templates page already reads this table, prerendering
// and the sitemap already pick rows up from it, and content in a table can be
// corrected without a deploy.
//
// Idempotent: keyed on slug, so re-running updates rather than duplicates.
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { MATH_CURRICULUM_TEMPLATES } from '../src/lib/mathCurriculumTemplates.js';
import { MATURA_TEMPLATES } from '../src/lib/maturaTemplates.js';

const DRY = process.argv.includes('--dry');

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const rows = [...MATH_CURRICULUM_TEMPLATES, ...MATURA_TEMPLATES].map((t) => ({
  slug: t.id,
  title: t.title,
  subject: t.subject,
  grade: t.grade,
  category: t.subject,
  description: t.description,
  icon: t.icon,
  polls: t.polls,
  author_name: t.source || 'БРО наставна програма',
  is_public: true,
  is_published: true,
}));

console.log(`${rows.length} templates · ${rows.reduce((s, r) => s + r.polls.length, 0)} activities`);
const byGrade = rows.reduce((a, r) => { a[r.grade] = (a[r.grade] || 0) + 1; return a; }, {});
console.log('by grade:', byGrade);

if (DRY) {
  console.log('\n--- dry run, nothing written ---');
  console.log(JSON.stringify(rows[0], null, 2).slice(0, 600));
  process.exit(0);
}

let ok = 0;
let failed = 0;
// Batched: a single 1.3MB request is a good way to discover a body-size limit
// during a seed rather than before one.
const BATCH = 25;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await db.from('community_templates').upsert(batch, { onConflict: 'slug' });
  if (error) {
    failed += batch.length;
    console.error(`  ! batch ${i / BATCH + 1}: ${error.message}`);
  } else {
    ok += batch.length;
    process.stdout.write(`\r  ${ok}/${rows.length}`);
  }
}

console.log(`\nupserted ${ok}, failed ${failed}`);

const { count } = await db.from('community_templates').select('*', { count: 'exact', head: true });
console.log(`community_templates now holds ${count} rows`);
