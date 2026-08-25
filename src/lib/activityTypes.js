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
