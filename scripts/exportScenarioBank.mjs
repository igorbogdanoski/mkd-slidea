// Export the reviewed lesson quizzes out of Firestore into one JSON file.
//
// Run from inside the math-curriculum-ai-navigator checkout, where the service
// account already lives in .env.local. Reads only — nothing is written back.
//
//   node scripts/exportScenarioBank.mjs quiz-export.json
//
// The quizzes sit in g{6..9}_generated, keyed by lesson id, alongside
// g{6..9}_lessons which carries the titles. Both are pulled so a question can
// be traced to the lesson it belongs to.
//
// Output contains lesson content only — no user data, no keys — but check it
// before putting it anywhere public.
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
if (!raw) {
  console.error('No FIREBASE_SERVICE_ACCOUNT in .env.local — run this from the navigator checkout.');
  process.exit(1);
}
const sa = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({ credential: cert(sa), projectId: sa.project_id }, 'export'));

const OUT = process.argv[2] || 'quiz-export.json';
const GRADES = (process.argv[3] || '6,7,8,9').split(',').map((g) => g.trim());

const out = { exported: new Date().toISOString(), project: sa.project_id, grades: {} };
let totalLessons = 0;
let totalQuizzes = 0;
let totalQuestions = 0;

for (const g of GRADES) {
  process.stdout.write(`grade ${g}: `);

  const lessonsSnap = await db.collection(`g${g}_lessons`).get();
  const lessons = Object.fromEntries(lessonsSnap.docs.map((d) => [d.id, d.data()]));

  const genSnap = await db.collection(`g${g}_generated`).get();
  const generated = genSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Quizzes are stored under a few different shapes across grades; take
  // whichever array is actually present rather than assuming one.
  const items = generated.map((doc) => {
    const quiz = doc.quiz || doc.questions || doc.assessment || null;
    const questions = Array.isArray(quiz) ? quiz : Array.isArray(quiz?.questions) ? quiz.questions : [];
    return {
      lessonId: doc.id,
      title: lessons[doc.id]?.title || doc.title || null,
      topic: lessons[doc.id]?.topic || doc.topic || null,
      questions,
      scenario: doc.scenario ? true : false,
    };
  });

  const withQuiz = items.filter((i) => i.questions.length > 0);
  const qCount = withQuiz.reduce((s, i) => s + i.questions.length, 0);

  out.grades[`G${g}`] = {
    lessons: lessonsSnap.size,
    generated: genSnap.size,
    withQuiz: withQuiz.length,
    questions: qCount,
    items,
  };

  totalLessons += lessonsSnap.size;
  totalQuizzes += withQuiz.length;
  totalQuestions += qCount;
  console.log(`${lessonsSnap.size} lessons, ${withQuiz.length} with a quiz, ${qCount} questions`);
}

out.totals = { lessons: totalLessons, quizzes: totalQuizzes, questions: totalQuestions };

// Print one question verbatim so the transformation can be written against the
// real shape instead of an assumed one.
const sample = Object.values(out.grades).flatMap((g) => g.items).find((i) => i.questions.length);
if (sample) {
  console.log('\nSample question shape:');
  console.log(JSON.stringify(sample.questions[0], null, 2).slice(0, 700));
}

writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\nTotals: ${totalLessons} lessons · ${totalQuizzes} quizzes · ${totalQuestions} questions`);
console.log(`→ ${OUT}`);
