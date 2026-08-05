// Export the reviewed quiz bank out of Firestore into a flat JSON file.
//
// Run this inside the math-curriculum-ai-navigator checkout, where the Firebase
// admin credentials already live. It reads only — nothing is written back.
//
//   cd math-curriculum-ai-navigator
//   cp <this file> scripts/
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
//   node scripts/exportScenarioBank.mjs scenario-bank-export.json
//
// Then hand over the JSON. It contains lesson content only — no user data, no
// keys — so it is safe to move around, but do not commit it to a public repo
// without checking it first.
import { writeFileSync } from 'fs';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const OUT = process.argv[2] || 'scenario-bank-export.json';
const COLLECTION = process.argv[3] || 'scenario_bank';

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();

console.log(`Reading ${COLLECTION} …`);
const snap = await db.collection(COLLECTION).get();

const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
console.log(`  ${docs.length} documents`);

// A quick shape report, so we can see what we are working with before writing
// any transformation code against it.
const keyCounts = {};
for (const doc of docs) {
  for (const k of Object.keys(doc)) keyCounts[k] = (keyCounts[k] || 0) + 1;
}
console.log('\nFields present (field: how many docs have it):');
for (const [k, n] of Object.entries(keyCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${n}`);
}

const withQuestions = docs.filter((d) =>
  Array.isArray(d.questions) || Array.isArray(d.quiz) || Array.isArray(d.items)
);
console.log(`\nDocuments carrying a question array: ${withQuestions.length}`);

writeFileSync(OUT, JSON.stringify({
  exported: new Date().toISOString(),
  collection: COLLECTION,
  count: docs.length,
  docs,
}, null, 2));

console.log(`\n→ ${OUT}`);
