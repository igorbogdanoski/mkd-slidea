// How long an answer may be, by activity type.
//
// One number used to serve both, and it was chosen for the word cloud: 300
// characters, in a single-line input. That is right for one word on a wall and
// wrong for an open question, where the whole point is that a student explains
// something — "Кој е вашиот став за примената на ВИ во наставата" cannot be
// answered in a line, and the field silently stopped accepting text partway
// through a sentence.
//
// The database never imposed this. `options.text` and `votes.answer_text` are
// both unbounded `text`; the cap is entirely ours.
export const ANSWER_LIMITS = {
  wordcloud: 40,    // one word, occasionally two — it has to fit on a wall
  open: 1500,       // a paragraph, comfortably
  default: 300,
};

export function answerLimit(type) {
  return ANSWER_LIMITS[type] ?? ANSWER_LIMITS.default;
}

/** Shortest input worth submitting — a single letter is a slip, not an answer. */
export function answerMinLength(type) {
  return type === 'wordcloud' ? 2 : 3;
}

/** Open questions get room to write; a word cloud gets one line on purpose. */
export function isLongForm(type) {
  return type === 'open';
}
