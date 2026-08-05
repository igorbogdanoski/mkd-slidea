// Turns the MK math curriculum (grades 5–9) into a flat concept taxonomy.
//
// Source: igorbogdanoski/math-curriculum-ai-navigator, data/grade{5..9}.ts —
// the official BRO programme structured as topics → concepts, each concept
// carrying its assessment standards.
//
// A concept is the unit a template should map to, not a lesson. The lesson
// indexes in that repo list 561 lessons for grades 6–9, but six consecutive
// lessons routinely share one title ("Множества (поим за множество…"), so one
// template per lesson would publish six pages competing for the same phrase —
// they cannibalise each other in search and none of them ranks. 97 concepts
// are 97 distinct things a teacher actually types into Google.
//
// Usage: node scripts/extractMathConcepts.mjs <dir-with-grade5..9.ts> [out.json]
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fixHyphenation } from '../src/lib/textCleanup.js';

const srcDir = process.argv[2];
const outFile = process.argv[3] || 'src/data/mathConceptTaxonomy.json';
if (!srcDir) {
  console.error('usage: node scripts/extractMathConcepts.mjs <dir> [out.json]');
  process.exit(1);
}

// The files are `export const gradeNData: Grade = { ...json... };` — the body
// is plain JSON apart from a couple of unquoted keys, so it is cheaper and
// far more predictable to slice the object out than to run a TS parser.
function parseGradeFile(text) {
  // Anchor on the export, not the first brace — the first `{` in the file
  // belongs to `import { type Grade } …`.
  const marker = text.match(/export\s+const\s+\w+\s*:\s*\w+\s*=\s*/);
  if (!marker) throw new Error('no `export const … =` found');
  const start = text.indexOf('{', marker.index + marker[0].length - 1);
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no object literal found');
  let body = text.slice(start, end + 1);
  // Quote bare keys (weeklyHours: 4 → "weeklyHours": 4) and drop trailing commas.
  body = body
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(body);
}

const concepts = [];
for (const grade of [5, 6, 7, 8, 9]) {
  const file = path.join(srcDir, `grade${grade}.ts`);
  let data;
  try {
    data = parseGradeFile(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`! grade${grade}: ${e.message}`);
    continue;
  }

  for (const topic of data.topics || []) {
    for (const concept of topic.concepts || []) {
      concepts.push({
        id: concept.id,
        grade: `G${grade}`,
        gradeLabel: `${grade}. одделение`,
        topic: fixHyphenation(topic.title || ''),
        title: fixHyphenation(concept.title || ''),
        description: fixHyphenation(concept.description || ''),
        // The standards are what a question should actually assess, so they
        // are the useful prompt material — far better than a topic name alone.
        assessmentStandards: (concept.assessmentStandards || []).map(fixHyphenation),
        learningOutcomes: (topic.topicLearningOutcomes || []).map(fixHyphenation),
        activityCount: (concept.activities || []).length,
      });
    }
  }
}

const byGrade = concepts.reduce((a, c) => { a[c.grade] = (a[c.grade] || 0) + 1; return a; }, {});
const out = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'igorbogdanoski/math-curriculum-ai-navigator — data/grade5..9.ts (БРО програма)',
  subject: 'Математика',
  total: concepts.length,
  byGrade,
  concepts,
};

writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`${concepts.length} concepts →  ${outFile}`);
console.log(Object.entries(byGrade).map(([g, n]) => `  ${g}: ${n}`).join('\n'));
