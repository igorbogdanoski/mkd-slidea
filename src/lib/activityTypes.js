// One place that decides what an activity type is called.
//
// Two spellings of the word cloud reached the database — `wordcloud`, which
// every branch in the app matches on, and `word_cloud`, which nine seeded
// activities carry and nothing matches. An unmatched type is not a visible
// error: it falls through to the multiple-choice branch, which renders the
// activity's options, and a word cloud has none. The projector shows an empty
// panel and nobody is told why.
const ALIASES = {
  word_cloud: 'wordcloud',
  wordCloud: 'wordcloud',
  cloud: 'wordcloud',
  fillblanks: 'fill_blanks',
  'fill-blanks': 'fill_blanks',
  multiple_choice: 'poll',
  free_text: 'open',
  text: 'open',
  order: 'ranking',
  ordering: 'ranking',
};

// Everything the app can actually render. A type outside this set reaches a
// projector as a blank, which is worse than not arriving.
export const RENDERABLE_TYPES = new Set([
  'poll', 'quiz', 'open', 'wordcloud', 'rating', 'scale', 'ranking', 'fill_blanks', 'survey',
]);

/** Canonical type for an activity, defaulting to a plain poll. */
export function normaliseActivityType(type) {
  const raw = String(type ?? '').trim();
  if (!raw) return 'poll';
  const mapped = ALIASES[raw] || raw.toLowerCase();
  return RENDERABLE_TYPES.has(mapped) ? mapped : 'poll';
}

// Some types do not have authored options — they have a fixed scale that the
// app supplies. If those rows are missing, the activity is not "empty", it is
// dead: `rating` maps a tapped star onto options[star - 1], so with no options
// the index is -1, the lookup misses, and tapping does nothing at all. No
// error, no feedback, and seven of these were live.
//
// Every path that creates a poll asks this rather than deciding for itself.
// The template path used to skip options whenever the incoming array was
// empty, which is exactly the shape an imported rating arrives in.
const FIXED_SCALES = {
  rating: () => ['1', '2', '3', '4', '5'].map((text) => ({ text, votes: 0, is_correct: false })),
  scale: () => Array.from({ length: 10 }, (_, i) => ({ text: String(i + 1), votes: 0, is_correct: false })),
};

/**
 * The options a poll of this type must have, given what the author supplied.
 * Returns [] when the type legitimately has none (open, wordcloud, blanks).
 */
export function optionsForType(type, authored) {
  const t = normaliseActivityType(type);
  const supplied = Array.isArray(authored) ? authored.filter((o) => o && (typeof o === 'string' || o.text)) : [];
  if (FIXED_SCALES[t]) return supplied.length > 0 ? supplied : FIXED_SCALES[t]();
  return supplied;
}

// Everything that defines an activity apart from its question, type and
// options. Three separate code paths built a poll row by listing fields by
// hand — applying a template, duplicating an activity, importing slides — and
// all three listed a different subset. Each omission is silent and each one
// breaks something specific: an activity without `blanks` has no gaps to fill,
// one without `survey_questions` has no questions, one without
// `correct_answer` can never reveal an answer it was written to teach.
//
// One list, so adding a field to the editor cannot quietly fail to survive a
// copy.
const CARRIED_FIELDS = [
  'correct_answer',
  'answer_explanation',
  'blanks',
  'survey_questions',
  'curriculum_tags',
  'presenter_notes',
  'cover_url',
  'cover_meta',
  'needs_moderation',
];

/** The defining fields of an activity, ready to spread into an insert. */
export function carriedActivityFields(source) {
  const out = {};
  for (const key of CARRIED_FIELDS) out[key] = source?.[key] ?? null;
  // A copy starts unrevealed: the reveal belongs to the round it was made in.
  out.answer_revealed = false;
  return out;
}

/**
 * The activities inside a template row.
 *
 * `community_templates.polls` is jsonb, but eighteen of the hand-authored
 * starter templates hold a JSON *string* rather than an array. Iterating one
 * with `for…of` walks it character by character, and each character becomes
 * an activity with no question — so applying such a template produced a row
 * of garbage instead of a lesson.
 */
export function templateActivities(template) {
  let list = template?.polls;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { return []; }
  }
  return Array.isArray(list) ? list.filter((a) => a && typeof a === 'object') : [];
}
