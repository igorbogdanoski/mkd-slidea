-- ============================================================================
-- Stage B: the answer key stops shipping to everyone who opens the page.
--
-- Stage A made the verdict the database's, so nothing on a participant's screen
-- needs the key to grade anything any more. But the key is still readable: with
-- the public anon key that ships inside the bundle, anyone can ask for
--
--   polls.correct_answer, polls.answer_explanation, polls.blanks (whose accept[]
--   arrays ARE the answers), and options.is_correct
--
-- and get them, before the host has revealed anything. A student with DevTools
-- open has the answer sheet.
--
-- These three functions are what the client reads instead. Each returns only
-- what the person asking has earned:
--
--   poll_answer_key(p_poll_id)
--       has_key is always answered — PresenterControls needs it to decide
--       whether the "Покажи одговор" button belongs on screen at all. The key
--       itself is nulled unless the host has set answer_revealed, which is the
--       same rule the UI already followed, now enforced where it cannot be
--       stepped around.
--
--   participant_blanks(p_poll_id)
--       Gap ids and a clamped field width, with no accept[] at all. The width
--       is computed here rather than from the answers on the client, and clamped
--       to the same 6–16ch range FillBlanksInput used, so the box does not leak
--       the length of the answer either.
--
--   quiz_verdict(p_poll_id, p_session_id)
--       The verdict and which option was right — but only for a session that has
--       a votes row for this activity. Someone who has not answered gets no rows,
--       so this cannot be used to read the key before answering.
--
-- ── Behaviour change this enables, agreed with the author ───────────────────
-- PollResultsRenderer showed each gap's accepted answer on the projector at all
-- times, and marked every response right or wrong against it. /event/:id/present
-- is not a protected route, so that was readable from any phone in the room by
-- opening the presenter URL. From now on the projector shows the accepted
-- answers only once the host reveals them — the same moment participants get
-- theirs. Before the reveal it shows the gaps and what students wrote, ungraded.
--
-- ── Ordering ───────────────────────────────────────────────────────────────
-- Additive only. Nothing is revoked here. The sequence, per the lesson recorded
-- in SUPABASE_LOCK_DOWN_ANON_READS.sql from 2026-08-06 — a revoked column does
-- not vanish from `select=*`, it fails the whole request with 42501:
--
--   1. apply this file
--   2. deploy the client that reads through these functions and names its
--      columns (src/lib/pollColumns.js already does; the key comes out of that
--      list in the same commit)
--   3. confirm production serves it and the reveal, the blanks form, the quiz
--      result and the projector all still work
--   4. only then run section 4 below
--
-- Sections 1-3 are safe to leave standing indefinitely. Section 4 is the one
-- that breaks a client which still asks for the columns.
--
-- Safe to run more than once.
-- ============================================================================

SET client_encoding = 'UTF8';

-- ── 1. The key, gated on the host's reveal ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.poll_answer_key(p_poll_id UUID)
RETURNS TABLE (
  has_key            BOOLEAN,
  revealed           BOOLEAN,
  correct_answer     TEXT,
  answer_explanation TEXT,
  blanks             JSONB
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT
    -- Whether a key exists at all, so the reveal button can be shown or hidden
    -- without the caller being able to read the key to find out.
    -- CASE, not AND: jsonb_array_length raises on a non-array, and SQL does not
    -- promise to evaluate the left operand of AND first.
    (COALESCE(btrim(p.correct_answer), '') <> ''
       OR CASE WHEN jsonb_typeof(p.blanks) = 'array'
               THEN jsonb_array_length(p.blanks) > 0
               ELSE FALSE END) AS has_key,
    p.answer_revealed IS TRUE AS revealed,
    CASE WHEN p.answer_revealed IS TRUE THEN p.correct_answer     END AS correct_answer,
    CASE WHEN p.answer_revealed IS TRUE THEN p.answer_explanation END AS answer_explanation,
    CASE WHEN p.answer_revealed IS TRUE THEN p.blanks             END AS blanks
  FROM public.polls p
  WHERE p.id = p_poll_id;
$fn$;

GRANT EXECUTE ON FUNCTION public.poll_answer_key(UUID) TO anon, authenticated;

-- ── 2. The gaps, without the answers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.participant_blanks(p_poll_id UUID)
RETURNS TABLE (id TEXT, size INT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT
    gap->>'id',
    -- Same clamp FillBlanksInput applied client-side: a field sized from the
    -- longest accepted answer, bounded so the box cannot itself spell out how
    -- long the answer is.
    GREATEST(6, LEAST(16,
      GREATEST(6, COALESCE((
        SELECT max(length(ans))
        FROM jsonb_array_elements_text(gap->'accept') AS ans
      ), 0)) + 3))::INT
  FROM public.polls p
  -- Guarded inside the LATERAL, not in WHERE: the join is evaluated before the
  -- filter, so a blanks value that is not an array would raise rather than be
  -- skipped. NULL is fine on its own — the function is strict and yields no rows.
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(p.blanks) = 'array' THEN p.blanks ELSE '[]'::jsonb END
  ) AS gap
  WHERE p.id = p_poll_id
    AND gap->>'id' IS NOT NULL;
$fn$;

GRANT EXECUTE ON FUNCTION public.participant_blanks(UUID) TO anon, authenticated;

-- ── 3. The verdict, for a session that has answered ────────────────────────
CREATE OR REPLACE FUNCTION public.quiz_verdict(p_poll_id UUID, p_session_id TEXT)
RETURNS TABLE (is_correct BOOLEAN, correct_option_id UUID)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT
    v.is_correct,
    (SELECT o.id FROM public.options o
      WHERE o.poll_id = p_poll_id AND o.is_correct
      ORDER BY o.created_at LIMIT 1) AS correct_option_id
  FROM public.votes v
  WHERE v.poll_id = p_poll_id
    AND v.session_id = p_session_id
  LIMIT 1;
$fn$;

GRANT EXECUTE ON FUNCTION public.quiz_verdict(UUID, TEXT) TO anon, authenticated;

-- ── 3b. Aggregate accuracy, for the projector's curriculum benchmark ───────
-- CurriculumBenchmarkBadge compares this class's accuracy on the live activity
-- against the curriculum average. It computed that by summing options.votes for
-- the options marked is_correct — which is the answer key again, just used as a
-- filter. The projector is an anonymous route, so revoking is_correct would have
-- left it permanently reporting 0% and telling every class it was below average.
--
-- What it actually needs is two numbers, and the votes rows are already graded
-- by claim_vote_graded(), so the sum moves into the database. It reveals nothing
-- about which option was right, only how many answers were.
CREATE OR REPLACE FUNCTION public.poll_accuracy(p_poll_id UUID)
RETURNS TABLE (correct BIGINT, total BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT COUNT(*) FILTER (WHERE v.is_correct) AS correct,
         COUNT(*)                             AS total
  FROM public.votes v
  WHERE v.poll_id = p_poll_id;
$fn$;

GRANT EXECUTE ON FUNCTION public.poll_accuracy(UUID) TO anon, authenticated;

-- ============================================================================
-- 4. NOT YET APPLIED — run only after the client that reads through the
--    functions above is deployed and confirmed in production.
--
--    Until then these columns stay readable, and the client simply stops
--    asking for them.
-- ============================================================================
--
-- REVOKE SELECT (correct_answer, answer_explanation, blanks)
--   ON public.polls FROM anon;
-- REVOKE SELECT (is_correct) ON public.options FROM anon;
--
-- Deliberately NOT revoked: presenter_notes. The presenter route is anonymous,
-- and the teacher's notes are a smaller exposure than an answer key — closing it
-- means the projector has to authenticate, which is a separate decision.
--
-- Deliberately NOT revoked from authenticated: the host screen, the Dashboard
-- analytics, the CSV and Markdown exports and the editor all read the key to
-- author and grade, and they are owner-scoped by row security.
--
-- Verify after running section 4, with the anon key:
--   polls?select=correct_answer        → 42501
--   polls?select=blanks                → 42501
--   options?select=is_correct          → 42501
--   polls?select=id,question&type=…    → still 200 (answering still works)
--   poll_answer_key / participant_blanks / quiz_verdict → still 200
-- ============================================================================

-- ============================================================================
-- Sections 1-3 APPLIED to production 2026-09-19 and verified against real rows
-- (both writes below were inside transactions that were rolled back; the
-- database ended at 242 events / 290 polls / 296 votes / 3 revealed polls,
-- exactly as it started):
--
--   poll_answer_key, host has NOT revealed
--     has_key=true  revealed=false
--     correct_answer=NULL  answer_explanation=NULL  blanks=NULL
--   poll_answer_key, same activity after the reveal
--     has_key=true  revealed=true  gaps=2
--     → has_key stays true while unrevealed, which is what lets
--       PresenterControls show the reveal button without reading the key.
--
--   participant_blanks on the newest fill_blanks activity
--     b1→9, b2→10     (ids and a width; no accept[] anywhere)
--     Stored longest accepted answer is 7 characters, and the width matches
--     FillBlanksInput's own formula exactly: min(16, max(6, max(6,len)+3)).
--
--   quiz_verdict for a session that answered → is_correct + correct_option_id
--   quiz_verdict for a session that never did → 0 rows
--   verdicts disagreeing with options.is_correct, across all 19 quiz votes → 0
--
-- Section 4 is NOT applied. It waits on the client rewiring listed below.
--
-- ── What is left before section 4 can run ──────────────────────────────────
-- The key is still in src/lib/pollColumns.js, so every one of these still reads
-- it straight off the poll object and would break on a revoke:
--
--   src/components/AnswerReveal.jsx        → poll_answer_key
--   src/components/FillBlanksInput.jsx     → participant_blanks
--   src/components/EventWrapper.jsx        → quiz_verdict (handleVote quiz branch)
--   src/views/Participant.jsx              → quiz result colours already receive
--                                             quizResult.correctIndex; stop reading
--                                             option.is_correct
--   src/components/Presenter/PollResultsRenderer.jsx
--                                          → gate the accepted answers and the
--                                             right/wrong marking on revealed
--   src/components/Presenter/PresenterControls.jsx
--                                          → has_key from poll_answer_key
--   src/views/Presenter.jsx                → fetch once, pass down
--   src/views/PublicResults.jsx            → its explicit select names blanks and
--                                             options.is_correct; move both to
--                                             poll_answer_key
--   src/__tests__/pollColumns.test.js      → currently asserts the key columns
--                                             ARE present; that assertion flips
--
-- Host-side readers are unaffected by an anon-only revoke: useHostSession's CSV
-- export and adaptiveSuggestion, useDashboardData, AnalyticsTab, exportMarkdown,
-- CreateQuizModal and the template data all run authenticated and owner-scoped.
-- ============================================================================
