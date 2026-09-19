// The columns the participant, presenter, host and results views actually read
// from `polls` and `options`.
//
// Every one of these call sites used to be `select('*, options(*)')`. The
// wildcard also pulls polls.embedding — a 1536-float pgvector column that only
// the server-side RAG endpoints touch, and that nothing in src/ reads. Measured
// on the largest event in production (24 activities):
//
//   select('*, options(*)')   181.9 KB
//   the same list, explicit    12.4 KB      ← 93.2% of the payload was unused
//
// That is not a one-off on page load. useEvent.fetchPolls runs on init, on every
// realtime change to polls or options — and options.votes changes on every vote,
// so every answer re-downloads the whole deck for every phone in the room — and
// again on a 6-second fallback interval. Thirty participants is ~5 MB per vote.
//
// Naming the columns is also what makes a future REVOKE survivable rather than
// catastrophic: a revoked column does not quietly disappear from `select=*`, it
// fails the entire request with 42501. Tightening events that way, ahead of the
// client that named its columns, is what stopped the host screen loading in
// production on 2026-08-06.
//
// Deliberately NOT ordered: the embedded options keep whatever order they have
// today. Rating and scale map taps positionally onto that array, so changing the
// order is a behaviour change and belongs in its own commit with its own check.

/**
 * Every column of `polls` a screen reads. Two deliberate omissions:
 *
 * `embedding` — a 1536-float pgvector column nothing in src/ reads. It was 93%
 * of the payload a participant's phone downloaded on every vote.
 *
 * `correct_answer`, `answer_explanation` and `blanks` — the answer key. Read
 * through poll_answer_key() and participant_blanks() instead (see
 * src/hooks/useAnswerKey.js), which return it only once the host has revealed
 * it. Omitting them here is what makes the REVOKE in section 4 of
 * SUPABASE_ANSWER_KEY_SCOPED.sql survivable: a revoked column does not vanish
 * from `select=*`, it fails the whole request with 42501.
 */
export const POLL_COLUMNS = [
  'id',
  'event_id',
  'question',
  'type',
  'is_quiz',
  'position',
  'active',
  'created_at',
  'answer_revealed',
  'results_visible',
  'needs_moderation',
  'survey_questions',
  'timer_ends_at',
  'presenter_notes',
  'curriculum_tags',
  'cover_url',
  'cover_meta',
].join(', ');

/**
 * Every column of `options` a screen reads.
 *
 * `is_correct` is omitted for the same reason as the key above: it is the quiz
 * answer sheet, and the participant's result view gets its verdict from
 * quiz_verdict() now. The host side is unaffected — it reads options through
 * owner-scoped queries as `authenticated`, and only `anon` loses the column.
 */
export const OPTION_COLUMNS = [
  'id',
  'poll_id',
  'event_id',
  'text',
  'votes',
  'label',
  'is_approved',
  'created_at',
].join(', ');

/** The select string for "the event's activities, with their options". */
export const POLLS_WITH_OPTIONS = `${POLL_COLUMNS}, options(${OPTION_COLUMNS})`;
