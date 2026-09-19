-- ============================================================================
-- Q&A: the columns and the table the client has always written to, and that
-- were never created here.
--
-- SUPABASE_QA_REACTIONS.sql adds questions.session_id, the question_upvotes
-- joiner and toggle_question_upvote(). It was never applied. What was applied
-- instead is section 3 of SUPABASE_ALL_MISSING_COLUMNS.sql, which adds
-- is_pinned / is_hidden / answered_at and nothing else — so three of the four
-- columns that migration names exist, and the fourth does not.
--
-- is_answered is in neither file. No migration ever created it, although
-- questionsCore.js and useHostSession both filter on it and both were written
-- to tolerate its absence — which is why nothing ever complained.
--
-- ── Measured on production, 2026-09-19, with the public anon key ───────────
--   questions.session_id            42703   column does not exist
--   questions.is_answered           42703   column does not exist
--   question_upvotes                PGRST205  no such table
--   events.is_qa_enabled            42703
--   events.is_reactions_enabled     42703
--   rows in questions, all 242 events:      0
--
-- The zero is the proof this is not an unused corner. submitQuestion()
-- (src/hooks/useEvent.js) names session_id in its insert, so every question
-- every participant ever tried to ask was rejected with 42703, and
-- handleSubmitQuestion in EventWrapper.jsx caught it into a console.error and
-- cleared the input as though it had been sent. markQuestionAnswered() names
-- is_answered, so the presenter's "Одговорено" button has never done anything.
--
-- Idempotent and additive: no DROP, no DELETE, no UPDATE of existing data.
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ── 1. questions: who asked, and whether it was dealt with ─────────────────
-- NOT NULL with a default, deliberately: questionsCore.pipelineQuestions keeps
-- a row only when `is_answered === false`, and a NULL would fail that strict
-- comparison while still passing the hasOwnProperty guard — every question
-- would vanish from the pending queue instead of appearing in it. No code path
-- writes NULL here; submitQuestion does not name the column at all.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS session_id  TEXT,
  ADD COLUMN IF NOT EXISTS is_answered BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.questions.session_id IS
  'Client-generated browser id of whoever asked. toggle_question_upvote uses it '
  'to make an upvote a per-session toggle rather than an unbounded increment.';

COMMENT ON COLUMN public.questions.is_answered IS
  'Set by the presenter when a question has been dealt with. The host queue and '
  'the participant list both filter on it.';

CREATE INDEX IF NOT EXISTS idx_questions_event_votes
  ON public.questions (event_id, votes DESC);
CREATE INDEX IF NOT EXISTS idx_questions_event_pinned
  ON public.questions (event_id, is_pinned, votes DESC);

-- ── 2. question_upvotes: the joiner behind a per-session upvote toggle ─────
CREATE TABLE IF NOT EXISTS public.question_upvotes (
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (question_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_question_upvotes_session
  ON public.question_upvotes (session_id);

ALTER TABLE public.question_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS question_upvotes_public_read ON public.question_upvotes;
CREATE POLICY question_upvotes_public_read ON public.question_upvotes
  FOR SELECT USING (true);

-- ── 3. toggle_question_upvote ──────────────────────────────────────────────
-- Without it, useEvent.upvoteQuestion() takes its pre-migration fallback to
-- increment_question_vote(): every click counts, and none can be taken back.
CREATE OR REPLACE FUNCTION public.toggle_question_upvote(
  p_question_id UUID,
  p_session_id  TEXT
)
RETURNS TABLE (votes INT, upvoted BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_existed BOOLEAN;
  v_count   INT;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 3 THEN
    RAISE EXCEPTION 'invalid_session';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.question_upvotes
    WHERE question_id = p_question_id AND session_id = p_session_id
  ) INTO v_existed;

  IF v_existed THEN
    DELETE FROM public.question_upvotes
      WHERE question_id = p_question_id AND session_id = p_session_id;
    UPDATE public.questions SET votes = GREATEST(0, votes - 1)
      WHERE id = p_question_id
      RETURNING public.questions.votes INTO v_count;
    RETURN QUERY SELECT COALESCE(v_count, 0), FALSE;
  ELSE
    INSERT INTO public.question_upvotes (question_id, session_id)
      VALUES (p_question_id, p_session_id)
      ON CONFLICT DO NOTHING;
    UPDATE public.questions SET votes = votes + 1
      WHERE id = p_question_id
      RETURNING public.questions.votes INTO v_count;
    RETURN QUERY SELECT COALESCE(v_count, 0), TRUE;
  END IF;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.toggle_question_upvote(UUID, TEXT) TO anon, authenticated;

-- ── 4. The two event flags the Q&A insert policy and sendReaction read ─────
-- Both default TRUE, which is what the client already assumes: sendReaction
-- treats an undefined is_reactions_enabled as enabled, and the insert policy
-- in SUPABASE_QA_REACTIONS.sql wraps the flag in COALESCE(…, TRUE).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_qa_enabled        BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_reactions_enabled BOOLEAN DEFAULT TRUE;

-- anon SELECT on events is granted column by column — section 4 of
-- SUPABASE_LOCK_DOWN_ANON_READS.sql is applied, and re-verified 2026-09-19
-- (password, cohost_code and select=* all answer 42501). A new column is
-- therefore invisible until it is granted. No client reads either flag today;
-- this keeps them readable if one ever does, and grants nothing else.
GRANT SELECT (is_qa_enabled, is_reactions_enabled) ON public.events TO anon, authenticated;

-- ── 5. Realtime ────────────────────────────────────────────────────────────
-- useEvent.js and useHostSession.js both subscribe to postgres_changes on
-- questions. Without the table in the publication the host's pending-question
-- queue only refreshes on a full reload.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verify after applying (all read-only, all safe to repeat):
--
--   -- every one of these must return a row, not 42703
--   SELECT session_id, is_answered FROM public.questions LIMIT 1;
--   SELECT question_id, session_id FROM public.question_upvotes LIMIT 1;
--   SELECT is_qa_enabled, is_reactions_enabled FROM public.events LIMIT 1;
--
--   -- must return 1
--   SELECT count(*) FROM pg_proc WHERE proname = 'toggle_question_upvote';
--
-- And from a browser, with the anon key: a question submitted on /event/<code>
-- must appear in the presenter's queue, and questions must stop being 0 rows.
-- ============================================================================
