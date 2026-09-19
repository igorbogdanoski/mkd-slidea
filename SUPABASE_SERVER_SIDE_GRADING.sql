-- ============================================================================
-- Server-side grading, stage A: the verdict stops being the caller's to give.
--
-- ── The hole ───────────────────────────────────────────────────────────────
-- claim_vote() takes p_is_correct and writes it straight into votes:
--
--   INSERT INTO public.votes (poll_id, session_id, username, answer_text, is_correct)
--   VALUES (p_poll_id, p_session_id, …, p_is_correct)
--
-- It is SECURITY DEFINER and granted to anon, and the anon key ships inside the
-- public JavaScript bundle. So the correctness of an answer was decided by
-- whoever submitted it. event_scoreboard and event_leaderboard both count
-- FILTER (WHERE v.is_correct), which means a single curl against
-- /rest/v1/rpc/claim_vote with p_is_correct=true put any name at the top of the
-- class scoreboard — no answer needed, no key needed, nothing to detect it
-- afterwards because the row looks exactly like an honest one.
--
-- Reading the key (polls.correct_answer, options.is_correct, polls.blanks →
-- accept[]) is the smaller half of the same problem, and stage B closes it.
-- This stage closes the half that lets someone write a score they did not earn.
--
-- ── Ordering, learned the hard way on 2026-08-06 ──────────────────────────
-- Applying this file changes nothing about how the deployed client behaves:
-- claim_vote_graded() is new, and claim_vote() keeps its exact signature. The
-- sequence is:
--
--   1. apply this file            (old client keeps working, forging already dead)
--   2. deploy the client that calls claim_vote_graded
--   3. confirm production serves it and votes still land
--
-- There is no step that drops claim_vote(). It stays as a grading shim for as
-- long as an old bundle might be open in someone's browser; see below.
--
-- Safe to run more than once.
-- ============================================================================

SET client_encoding = 'UTF8';

CREATE OR REPLACE FUNCTION public.claim_vote_graded(
  p_poll_id     UUID,
  p_session_id  TEXT,
  p_username    TEXT,
  p_answer_text TEXT,
  p_option_id   UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inserted  INT;
  v_correct BOOLEAN;
BEGIN
  -- The participant names the option they chose; whether it is right is looked
  -- up here, from the key that never leaves the database. Types with no key —
  -- open, wordcloud, fill_blanks, survey, ranking — pass NULL and are graded
  -- NULL, exactly as before. Nothing here auto-marks free text: Macedonian
  -- inflects, and a confident wrong verdict in front of a class is worse than
  -- no verdict.
  IF p_option_id IS NOT NULL THEN
    SELECT o.is_correct INTO v_correct
      FROM public.options o
     WHERE o.id = p_option_id
       AND o.poll_id = p_poll_id;
    -- An option that does not belong to this activity is not an answer to it.
    -- Refusing beats grading it NULL: a NULL would let a forged or stale option
    -- id count as a submitted-but-ungraded answer and sit on the leaderboard's
    -- denominator forever.
    IF NOT FOUND THEN
      RAISE EXCEPTION 'option % does not belong to poll %', p_option_id, p_poll_id
        USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO public.votes (poll_id, session_id, username, answer_text, is_correct)
  VALUES (p_poll_id, p_session_id, LEFT(COALESCE(p_username, 'Анонимен'), 80),
          LEFT(p_answer_text, 2000), v_correct)
  ON CONFLICT (poll_id, session_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted > 0;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_vote_graded(UUID, TEXT, TEXT, TEXT, UUID)
  TO anon, authenticated;

COMMENT ON FUNCTION public.claim_vote_graded(UUID, TEXT, TEXT, TEXT, UUID) IS
  'Claims one answer for a session and grades it from the stored key. Returns '
  'TRUE when this call created the votes row, FALSE when one was already there. '
  'Replaces claim_vote(), which accepted the verdict from the caller and so let '
  'anyone holding the public anon key award themselves a correct answer.';

-- ── The old entry point becomes a shim that grades too ─────────────────────
--
-- Dropping claim_vote() the moment the new bundle goes up would break every
-- browser still running the old one — an open tab keeps its hashed assets until
-- it is reloaded, and a class that joined before the deploy is exactly the
-- class that would lose its votes mid-lesson.
--
-- So the signature stays and p_is_correct is accepted and then ignored. The
-- verdict is looked up from the answer text, which the old client already sends
-- verbatim as the chosen option's text. Old callers keep working and start
-- being graded honestly; the forging hole closes immediately instead of
-- waiting for every tab in the country to refresh.
--
-- No match is not an error here, unlike claim_vote_graded: a word cloud entry,
-- an open answer and a fill-in-the-blanks payload are all answer texts that
-- legitimately name no option, and they are not graded.
CREATE OR REPLACE FUNCTION public.claim_vote(
  p_poll_id     UUID,
  p_session_id  TEXT,
  p_username    TEXT,
  p_answer_text TEXT,
  p_is_correct  BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inserted  INT;
  v_correct BOOLEAN;
BEGIN
  -- p_is_correct is deliberately unused. It is still in the signature so the
  -- deployed bundle's call resolves; its value is discarded.
  SELECT o.is_correct INTO v_correct
    FROM public.options o
   WHERE o.poll_id = p_poll_id
     AND o.text = LEFT(COALESCE(p_answer_text, ''), 2000)
   LIMIT 1;

  INSERT INTO public.votes (poll_id, session_id, username, answer_text, is_correct)
  VALUES (p_poll_id, p_session_id, LEFT(COALESCE(p_username, 'Анонимен'), 80),
          LEFT(p_answer_text, 2000), v_correct)
  ON CONFLICT (poll_id, session_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted > 0;
END;
$function$;

COMMENT ON FUNCTION public.claim_vote(UUID, TEXT, TEXT, TEXT, BOOLEAN) IS
  'Compatibility shim. Keeps the old signature so a browser still running a '
  'pre-grading bundle keeps working, but ignores p_is_correct and grades from '
  'the answer text instead — the caller no longer gets to say whether its own '
  'answer was right. New code calls claim_vote_graded(). Drop this only once no '
  'old bundle is in the field.';

-- ============================================================================
-- Verify after applying (read-only):
--
--   SELECT proname, pg_get_function_arguments(oid)
--     FROM pg_proc WHERE proname LIKE 'claim_vote%';
--   -- both must be present: the graded one and the shim
--
-- The behavioural checks live in scripts/verifyAllActivityTypes.mjs, which runs
-- them with the anon key against a throwaway event it deletes afterwards:
--   claim_vote_graded(poll, s1, name, <correct option's text>, <its id>)
--     → TRUE, votes.is_correct = true
--   claim_vote_graded(poll, s2, name, <wrong option's text>, <its id>)
--     → TRUE, votes.is_correct = false
--   claim_vote_graded(poll, s3, name, text, <a nil UUID>)
--     → 22023, no row
--
-- The shim is worth checking the same way, because it is what every browser
-- still running the previous bundle is calling: claim_vote() with
-- p_is_correct=true and the text of a WRONG option must still grade false.
-- ============================================================================
