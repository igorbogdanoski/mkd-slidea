// Turns the reviewed curriculum quiz bank into Slidea starter templates.
//
//   node scripts/buildMathTemplates.mjs <quiz-export.json> [out.js]
//
// The export holds 605 lessons with 4,840 questions for grades 6–9, already
// through two reviewers. This is a transformation, not a generation: nothing
// here invents a question or an answer.
//
// One template per *distinct lesson title*, not per lesson. 605 lessons carry
// only 277 distinct titles — G9 has 144 lessons under 17 titles — and
// publishing six pages named "Множества (поим за множество…)" would have them
// compete for one phrase and rank for none.
import { readFileSync, writeFileSync } from 'fs';
import { fixHyphenation } from '../src/lib/textCleanup.js';

const IN = process.argv[2];
const OUT = process.argv[3] || 'src/lib/mathCurriculumTemplates.js';
if (!IN) {
  console.error('usage: node scripts/buildMathTemplates.mjs <quiz-export.json> [out.js]');
  process.exit(1);
}

const GRADE_LABEL = { G6: '6 одделение', G7: '7 одделение', G8: '8 одделение', G9: '9 одделение' };
const ICONS = ['🔢', '📐', '➗', '📊', '📈', '🧮', '📏', '🔷'];

const slugify = (s) => {
  const map = {
    а:'a',б:'b',в:'v',г:'g',д:'d',ѓ:'gj',е:'e',ж:'zh',з:'z',ѕ:'dz',и:'i',ј:'j',к:'k',
    л:'l',љ:'lj',м:'m',н:'n',њ:'nj',о:'o',п:'p',р:'r',с:'s',т:'t',ќ:'kj',у:'u',ф:'f',
    х:'h',ц:'c',ч:'ch',џ:'dj',ш:'sh',
  };
  return String(s).toLowerCase().split('').map((ch) => map[ch] ?? ch).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
};

// "A) $0$" → { label: 'A', text: '$0$' }. The bank prefixes every choice with
// its letter and stores correctAnswer as that letter, so the prefix has to
// come off the displayed text and stay as the key.
function splitOption(raw) {
  const m = String(raw).match(/^\s*([A-DА-Г])\)\s*(.*)$/s);
  return m ? { label: m[1], text: m[2].trim() } : { label: null, text: String(raw).trim() };
}

function toQuiz(q) {
  const opts = (q.options || []).map(splitOption);
  if (opts.length < 2) return null;

  const key = String(q.correctAnswer ?? '').trim();
  // Either a letter key ("A") or the answer text itself (true/false items).
  let correctIdx = opts.findIndex((o) => o.label && o.label === key);
  if (correctIdx === -1) correctIdx = opts.findIndex((o) => o.text === key);
  if (correctIdx === -1) return null;   // unresolvable key — drop rather than guess

  return {
    question: q.text,
    type: 'quiz',
    is_quiz: true,
    options: opts.map((o, i) => ({ text: o.text, is_correct: i === correctIdx })),
    answer_explanation: q.solution || null,
  };
}

function toOpen(q) {
  if (!String(q.correctAnswer || '').trim()) return null;
  return {
    question: q.text,
    type: 'open',
    is_quiz: false,
    options: [],
    // Revealed by the host, never auto-marked — Macedonian free text inflects.
    correct_answer: String(q.correctAnswer).trim().slice(0, 500),
    answer_explanation: q.solution || null,
  };
}

function toFillBlanks(q) {
  const answer = String(q.correctAnswer || '').trim();
  if (!answer) return null;

  // The bank marks a gap with a run of underscores; Slidea marks it {{b1}}.
  // A question with two gaps still carries only one correctAnswer, so there is
  // no way to say which gap it answers — those are dropped rather than half
  // converted, which would leave a student staring at a "___" nobody can fill.
  const gaps = (q.text.match(/_{2,}/g) || []).length;
  if (gaps !== 1) return null;

  return {
    question: q.text.replace(/_{2,}/, '{{b1}}'),
    type: 'fill_blanks',
    is_quiz: false,
    options: [],
    blanks: [{ id: 'b1', accept: [answer] }],
    answer_explanation: q.solution || null,
  };
}

const CONVERT = {
  multiple_choice: toQuiz,
  true_false: toQuiz,
  short_answer: toOpen,
  fill_blanks: toFillBlanks,
};

const data = JSON.parse(readFileSync(IN, 'utf8'));
const lessons = Object.values(data.grades).flatMap((g) => g.items).filter((i) => i.questions?.length);

// Group by grade + cleaned title.
const groups = new Map();
for (const lesson of lessons) {
  const grade = 'G' + Number(lesson.lessonId.slice(1, 3));
  const title = fixHyphenation(lesson.title || '').replace(/\s*\([^)]*$/, '').trim();
  if (!title) continue;
  const key = grade + '|' + title;
  if (!groups.has(key)) groups.set(key, { grade, title, questions: [], topic: lesson.topic || null });
  groups.get(key).questions.push(...lesson.questions);
}

const stats = { groups: groups.size, emitted: 0, dropped: 0, byType: {} };
const templates = [];

for (const [, group] of groups) {
  // Dedupe: the same question recurs across lessons that share a title.
  const seen = new Set();
  const unique = group.questions.filter((q) => {
    const k = String(q.text || '').trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const converted = [];
  for (const q of unique) {
    const fn = CONVERT[q.type];
    const out = fn ? fn(q) : null;
    if (out) {
      converted.push({ ...out, dok: q.dok ?? 2 });
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
    } else {
      stats.dropped++;
    }
  }
  if (converted.length < 2) continue;   // not enough for a lesson activity

  // Order by depth so a class warms up, and cap at five: a template is the
  // interactive check inside a lesson, not the whole lesson.
  converted.sort((a, b) => (a.dok ?? 2) - (b.dok ?? 2));
  const picked = converted.slice(0, 5).map(({ dok, ...rest }) => rest);

  templates.push({
    id: `mk-math-${group.grade.toLowerCase()}-${slugify(group.title)}`,
    title: group.title,
    subject: 'Математика',
    grade: GRADE_LABEL[group.grade] || group.grade,
    icon: ICONS[templates.length % ICONS.length],
    color: 'from-blue-500 to-indigo-500',
    description: `${group.title} — ${picked.length} активности според наставната програма за ${GRADE_LABEL[group.grade] || group.grade}.`,
    source: 'БРО наставна програма',
    polls: picked,
  });
  stats.emitted++;
}

templates.sort((a, b) => a.grade.localeCompare(b.grade, 'mk') || a.title.localeCompare(b.title, 'mk'));

const banner = `// Generated by scripts/buildMathTemplates.mjs — do not edit by hand.
//
// Source: the reviewed curriculum quiz bank exported from
// math-curriculum-ai-navigator (Firestore g{6..9}_generated), transformed, not
// generated: no question or answer here was invented by this script.
//
// One template per distinct lesson title. The export holds ${lessons.length} lessons but only
// ${groups.size} distinct titles, so publishing one per lesson would have pages competing
// for the same search phrase.
`;

writeFileSync(OUT, `${banner}\nexport const MATH_CURRICULUM_TEMPLATES = ${JSON.stringify(templates, null, 2)};\n`);

console.log(`groups: ${stats.groups}`);
console.log(`templates emitted: ${stats.emitted}`);
console.log(`questions converted:`, stats.byType);
console.log(`questions dropped (unresolvable): ${stats.dropped}`);
const byGrade = templates.reduce((a, t) => { a[t.grade] = (a[t.grade] || 0) + 1; return a; }, {});
console.log('by grade:', byGrade);
console.log(`→ ${OUT}`);
