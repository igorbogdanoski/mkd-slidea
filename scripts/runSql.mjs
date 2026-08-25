// Runs a .sql file against the self-hosted Supabase instance through the
// postgres-meta endpoint that Studio itself uses.
//
//   node scripts/runSql.mjs path/to/file.sql [--confirm]
//
// Dry by default: prints the statements it would run and stops. DDL against a
// live classroom database is not something to trigger by arrow-up.
import { readFileSync } from 'fs';

const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const CONFIRM = process.argv.includes('--confirm');
if (!file) { console.error('usage: node scripts/runSql.mjs <file.sql> [--confirm]'); process.exit(1); }

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const sql = readFileSync(file, 'utf8');
const key = env.SUPABASE_SERVICE_ROLE_KEY;

// Sent whole, not split on semicolons: the file contains function bodies in
// $$ … $$ where a semicolon means nothing, and splitting on it would cut them
// in half.
if (!CONFIRM) {
  const preview = sql.split('\n').filter((l) => l.trim() && !l.trim().startsWith('--'));
  console.log(`${file}: ${preview.length} non-comment lines`);
  console.log(preview.slice(0, 40).join('\n'));
  console.log('\n--- dry run. Re-run with --confirm to execute. ---');
  process.exit(0);
}

const res = await fetch(`${env.SUPABASE_URL}/pg/query`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
const body = await res.text();
console.log(`HTTP ${res.status}`);
console.log(body.slice(0, 2000));
process.exit(res.ok ? 0 : 1);
