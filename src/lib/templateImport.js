// Slidea Interchange Format — one shape every tool can write, one importer here.
//
// There are already three tools with overlapping content: Slidea (live
// classroom activities), MathDigitizer (digitising old worksheets and videos
// into tasks), ActionBounty (gamified quest stages). Wiring them pairwise
// means six directions for three tools and twelve for four. One documented
// format means each tool writes an exporter and reads an importer, and the
// next tool costs two, not two-times-N.
//
// ── The format ──────────────────────────────────────────────────────────────
// {
//   "slidea_import": 1,
//   "title": "Дропки — вежби",
//   "subject": "Математика",          // optional
//   "grade": "6 одделение",           // optional
//   "source": {                       // optional but strongly encouraged
//     "app": "MathDigitizer",
//     "url": "https://…",             // where the material came from
//     "exportedAt": "2026-08-06T…"
//   },
//   "activities": [
//     { "type": "quiz", "question": "…",
//       "options": [{ "text": "…", "correct": true }, …],
//       "explanation": "…" },
//     { "type": "open", "question": "…", "answer": "…", "explanation": "…" },
//     { "type": "fill_blanks", "question": "… {{b1}} …",
//       "blanks": [{ "id": "b1", "accept": ["…"] }] },
//     { "type": "poll", "question": "…", "options": [{ "text": "…" }, …] },
//     { "type": "wordcloud" | "rating" | "scale", "question": "…" }
//   ]
// }
//
// LaTeX in $…$ is supported everywhere — see MathText.
//
// ── Why it validates the way it does ────────────────────────────────────────
// Import is partial by design: a file with twelve good activities and one
// broken one imports twelve and says so. Refusing the whole file teaches
// people to fix the exporter by deleting content. Nothing is ever guessed —
// a quiz whose correct option cannot be identified is dropped, not assigned
// one, because a wrong answer key is discovered by a class, out loud.

export const IMPORT_VERSION = 1;

// ── The shared vocabulary ───────────────────────────────────────────────────
// Four tools need one way to say "this content is about percentages in grade
// six". The temptation is to invent an id scheme and make everyone adopt it,
// which means whoever moves last blocks everyone.
//
// It already exists and belongs to nobody: БРО publishes outcome codes —
// МА.6.2.3 is subject, grade, topic, outcome. MathDigitizer already extracts
// them from the source PDFs, the navigator's curriculum is built around the
// same programme, and Slidea already carries `curriculum_tags` on a poll,
// feeding semantic search and the benchmark badge.
//
// So an activity arriving from another tool with an outcome code lands here
// already searchable and already comparable, with no new machinery.
const OUTCOME_CODE = /^[А-ШA-Z]{2,4}\.\d{1,2}\.\d{1,2}\.\d{1,3}$/;

/** Normalises whatever a tool sends into a list of БРО outcome codes. */
export function readOutcomes(source) {
  const raw = []
    .concat(source?.outcomes || [])
    .concat(source?.curriculum?.outcomes || [])
    .concat(source?.curriculum_tags || []);
  return [...new Set(raw.map((c) => String(c ?? '').trim().toUpperCase()).filter((c) => OUTCOME_CODE.test(c)))].slice(0, 12);
}

// Only what this app can actually render. A type it cannot show is worse than
// a missing activity: it reaches a projector as a blank.
const RENDERABLE = new Set(['quiz', 'poll', 'open', 'fill_blanks', 'wordcloud', 'rating', 'scale', 'ranking']);

const text = (v, max = 300) => String(v ?? '').trim().slice(0, max);

const BLANK_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g;

function convertActivity(raw, index, inherited = []) {
  const where = `активност ${index + 1}`;
  const type = String(raw?.type || '').trim();
  // An activity may name its own outcomes; otherwise it inherits the
  // document's. Most exports tag once at the top — a worksheet is usually one
  // outcome — and tagging per activity is the exception, not the rule.
  const own = readOutcomes(raw);
  const activityOutcomes = own.length ? own : inherited;
  const question = text(raw?.question);

  if (!question) return { error: `${where}: нема текст на прашањето` };
  if (!RENDERABLE.has(type)) return { error: `${where}: непознат тип „${type}"` };

  if (type === 'quiz' || type === 'poll' || type === 'ranking') {
    const options = (Array.isArray(raw.options) ? raw.options : [])
      .map((o) => (typeof o === 'string' ? { text: o } : o))
      .filter((o) => text(o?.text, 150))
      .map((o) => ({ text: text(o.text, 150), is_correct: !!o.correct }));

    if (options.length < 2) return { error: `${where}: бара најмалку две опции` };

    if (type === 'quiz') {
      const correct = options.filter((o) => o.is_correct).length;
      // Never guess. A quiz with no marked answer, or two, has no answer key —
      // and an invented one is found out by a whole class at once.
      if (correct !== 1) {
        return { error: `${where}: квизот мора да има точно еден точен одговор (има ${correct})` };
      }
    } else {
      options.forEach((o) => { delete o.is_correct; });
    }

    return {
      poll: {
        question,
        type: type === 'quiz' ? 'quiz' : type,
        is_quiz: type === 'quiz',
        options,
        answer_explanation: text(raw.explanation, 2000) || null,
        curriculum_tags: activityOutcomes.length ? activityOutcomes : null,
      },
    };
  }

  if (type === 'fill_blanks') {
    const ids = [...new Set([...question.matchAll(BLANK_RE)].map((m) => m[1]))];
    if (!ids.length) return { error: `${where}: нема ниту една празнина {{b1}} во текстот` };

    const blanks = [];
    for (const id of ids) {
      const found = (Array.isArray(raw.blanks) ? raw.blanks : []).find((b) => b?.id === id);
      const accept = (found?.accept || []).map((a) => text(a, 150)).filter(Boolean);
      if (!accept.length) return { error: `${where}: празнината {{${id}}} нема прифатен одговор` };
      blanks.push({ id, accept: accept.slice(0, 8) });
    }

    return {
      poll: {
        question,
        type: 'fill_blanks',
        is_quiz: false,
        options: [],
        blanks,
        answer_explanation: text(raw.explanation, 2000) || null,
        curriculum_tags: activityOutcomes.length ? activityOutcomes : null,
      },
    };
  }

  if (type === 'open') {
    return {
      poll: {
        question,
        type: 'open',
        is_quiz: false,
        options: [],
        // Optional: an open question without a key behaves exactly as it
        // always has. With one, the host can reveal it.
        correct_answer: text(raw.answer, 500) || null,
        answer_explanation: text(raw.explanation, 2000) || null,
        curriculum_tags: activityOutcomes.length ? activityOutcomes : null,
      },
    };
  }

  // wordcloud / rating / scale take no authored options.
  return {
    poll: {
      question,
      type,
      is_quiz: false,
      options: [],
      answer_explanation: text(raw.explanation, 2000) || null,
      curriculum_tags: activityOutcomes.length ? activityOutcomes : null,
    },
  };
}

/**
 * Converts an interchange document into a Slidea template.
 * Always returns a result — never throws on bad input, because the caller is
 * a file picker and the user needs to be told what was wrong with their file.
 *
 * @returns {{ ok: boolean, template: object|null, imported: number,
 *             skipped: Array<string>, errors: Array<string> }}
 */
export function importTemplate(input) {
  const errors = [];
  const skipped = [];

  let doc = input;
  if (typeof input === 'string') {
    try { doc = JSON.parse(input); } catch (e) {
      return { ok: false, template: null, imported: 0, skipped, errors: [`Датотеката не е валиден JSON: ${e.message}`] };
    }
  }

  if (!doc || typeof doc !== 'object') {
    return { ok: false, template: null, imported: 0, skipped, errors: ['Празна или неисправна датотека.'] };
  }

  const version = Number(doc.slidea_import);
  if (!version) {
    errors.push('Недостига полето „slidea_import" — ова не изгледа како Slidea увоз.');
  } else if (version > IMPORT_VERSION) {
    // Forward compatibility beats a hard stop: a newer file usually still
    // holds activities this version understands.
    skipped.push(`Датотеката е верзија ${version}, а овој увозник е ${IMPORT_VERSION} — новите можности ќе се игнорираат.`);
  }

  const title = text(doc.title, 150);
  if (!title) errors.push('Недостига наслов.');

  const rawActivities = Array.isArray(doc.activities) ? doc.activities : [];
  if (!rawActivities.length) errors.push('Датотеката нема ниту една активност.');

  if (errors.length) return { ok: false, template: null, imported: 0, skipped, errors };

  const docOutcomes = readOutcomes(doc);
  const polls = [];
  rawActivities.forEach((raw, i) => {
    const { poll, error } = convertActivity(raw, i, docOutcomes);
    if (poll) polls.push(poll);
    else skipped.push(error);
  });

  if (!polls.length) {
    return { ok: false, template: null, imported: 0, skipped, errors: ['Ниту една активност не можеше да се увезе.'] };
  }

  const app = text(doc?.source?.app, 60);
  return {
    ok: true,
    imported: polls.length,
    skipped,
    errors: [],
    template: {
      title,
      subject: text(doc.subject, 60) || 'Општо',
      grade: text(doc.grade, 40) || '',
      description: text(doc.description, 300)
        || `${polls.length} активности${app ? ` · увезено од ${app}` : ''}.`,
      // Provenance travels with the content. A teacher deciding whether to
      // trust a question deserves to know where it came from, and a wrong
      // answer needs a trail back to the tool that produced it.
      source: app || 'Увоз',
      source_url: text(doc?.source?.url, 500) || null,
      // The join key back to the other three tools, and forward into this
      // app's own semantic search.
      curriculum_tags: docOutcomes.length ? docOutcomes : null,
      polls,
    },
  };
}

/**
 * MathDigitizer's MathTask → interchange activities. Reference implementation:
 * this is the conversion that tool should eventually do itself, kept here so
 * the mapping is written down somewhere both sides can read.
 *
 * The interesting part is `misconceptions`. MathDigitizer records the mistakes
 * students actually make on a task — which are exactly the distractors a
 * multiple-choice question wants. A task with recorded misconceptions becomes
 * a quiz whose wrong answers mean something, rather than three invented
 * near-misses.
 */
export function mathTaskToActivities(tasks) {
  return (Array.isArray(tasks) ? tasks : []).flatMap((task) => {
    const question = text(task?.title || task?.original_text, 300);
    if (!question) return [];

    const answer = Array.isArray(task?.solution_steps) && task.solution_steps.length
      ? task.solution_steps[task.solution_steps.length - 1]
      : null;

    const distractors = (task?.misconceptions || [])
      .map((m) => text(m?.mistake, 150))
      .filter(Boolean);

    if (answer && distractors.length >= 2) {
      return [{
        type: 'quiz',
        question,
        options: [
          { text: text(answer, 150), correct: true },
          ...distractors.slice(0, 3).map((d) => ({ text: d })),
        ],
        explanation: (task.solution_steps || []).join(' ') || undefined,
      }];
    }

    return [{
      type: 'open',
      question,
      answer: answer ? text(answer, 500) : undefined,
      explanation: (task?.solution_steps || []).join(' ') || undefined,
    }];
  });
}
