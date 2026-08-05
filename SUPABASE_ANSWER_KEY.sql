-- ============================================================================
-- Answer keys for open questions, and the fill-in-the-blanks activity type.
--
-- Two changes, deliberately of different sizes:
--
-- 1. `open` gains an answer key. It is not a new activity type — an open
--    question with a known answer is the same interaction as one without,
--    plus the answer. Splitting it into a ninth type would duplicate the
--    whole render path and divide analytics between two things that mean the
--    same. Both columns are nullable, so every existing open question keeps
--    behaving exactly as it does today.
--
-- 2. `fill_blanks` is genuinely a new type: the prompt carries internal
--    structure, the response is per-gap rather than one answer, and it is
--    displayed as inline fields rather than a textarea.
--
-- Safe to run more than once.
-- ============================================================================

-- ── 1. Answer key for open questions ────────────────────────────────────────
alter table public.polls
  add column if not exists correct_answer text,
  add column if not exists answer_explanation text;

comment on column public.polls.correct_answer is
  'Optional answer key for open questions. Revealed by the host after voting '
  'closes — never used to auto-mark a response. Macedonian free text inflects '
  '("множество"/"множеството") and auto-marking would produce confident wrong '
  'verdicts in front of a class.';

comment on column public.polls.answer_explanation is
  'Optional worked explanation shown alongside the answer when revealed.';

-- ── 2. Fill-in-the-blanks ───────────────────────────────────────────────────
-- Shape of `blanks`:
--   [{ "id": "b1", "accept": ["множество", "мн."], "hint": "…" }, …]
-- The prompt marks each gap with {{b1}}, so the text and the gaps stay
-- together and reordering a gap cannot silently detach it from its answer.
alter table public.polls
  add column if not exists blanks jsonb not null default '[]'::jsonb;

comment on column public.polls.blanks is
  'Gaps for a fill_blanks poll. Each entry lists the accepted answers; the '
  'question text marks its position with {{id}}. Checking is normalised '
  '(case, spacing, punctuation) and advisory only: the presenter shows every '
  'response so the teacher can see near misses and decide.';

-- Responses. votes.answer_text already holds free text for open questions;
-- for fill_blanks it holds a JSON object keyed by blank id, so no new table
-- is needed and existing export/CSV paths keep working.

-- ── 3. Reveal state ─────────────────────────────────────────────────────────
-- Whether the host has revealed the answer for the active poll. Kept on the
-- poll rather than in client state so every participant and the projector see
-- the reveal at the same moment, through the realtime channel that already
-- watches this table.
alter table public.polls
  add column if not exists answer_revealed boolean not null default false;

comment on column public.polls.answer_revealed is
  'Set by the host to reveal correct_answer/blanks to everyone at once. Lives '
  'on the row so the existing polls realtime subscription delivers it.';
