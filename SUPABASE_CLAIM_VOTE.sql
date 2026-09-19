-- ============================================================================
-- claim_vote(): the function the whole voting path now depends on, and until
-- this file existed it had no record anywhere in the repository.
--
-- It was created directly against the live database in commit e271d74
-- (2026-08-25) and only ever described in that commit message. That left the
-- single most load-bearing function in the app — every participant vote, in
-- the main view, the embed and the offline replay, goes through it — present
-- in production and absent from the schema's history. A restore, a new
-- environment or a second instance would have come up with voting silently
-- broken and nothing in the repo to say why.
--
-- The definition below is not a reconstruction. It is the output of
-- pg_get_functiondef() read back from the live database on 2026-09-19, so
-- applying this file is a no-op there and a repair anywhere else.
--
-- ── Why the vote is claimed before it is counted ───────────────────────────
-- The tally lives in options.votes and moves through increment_vote(), a blind
-- `votes = votes + 1` with no idea who is calling. The one-answer-per-session
-- rule lives somewhere else entirely: UNIQUE(poll_id, session_id) on votes
-- (SUPABASE_SETUP.sql). Run in the other order and a second submission moved
-- the counter and then quietly failed to record itself — the chart went up, the
-- votes table stayed at one row, and the only thing standing between a
-- participant and voting twice was a client-side flag.
--
-- ── Why a function and not an upsert the caller reads back ─────────────────
-- The first version was `upsert(…, { ignoreDuplicates: true }).select('poll_id')`
-- with an empty result read as "already voted". That works only while the
-- table is readable: asking PostgREST to return the row needs SELECT on votes,
-- and the moment SUPABASE_LOCK_DOWN_ANON_READS.sql closed it, every vote in
-- production answered 401. The insert had always been fine — it was reading it
-- back that failed. This does the same INSERT … ON CONFLICT DO NOTHING inside
-- the database and returns whether a row was created, which is the only thing
-- any caller ever needed.
--
-- It is also why the offline replay uses this rather than the table: anon holds
-- INSERT and SELECT on votes and nothing else, and an upsert is
-- INSERT … ON CONFLICT DO UPDATE, which the planner checks for UPDATE whether
-- or not a conflict occurs. Measured on production: 42501.
--
-- Safe to run more than once.
-- ============================================================================

SET client_encoding = 'UTF8';

-- The conflict target this depends on. Already in SUPABASE_SETUP.sql; repeated
-- here so the file stands alone, because a claim_vote() without it does not
-- merely fail — ON CONFLICT with no matching constraint is an error at call
-- time, and every vote in the app would take it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'votes' AND c.contype = 'u'
  ) THEN
    ALTER TABLE public.votes ADD CONSTRAINT votes_poll_session_key UNIQUE (poll_id, session_id);
  END IF;
END $$;

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
  inserted INT;
BEGIN
  INSERT INTO public.votes (poll_id, session_id, username, answer_text, is_correct)
  VALUES (p_poll_id, p_session_id, LEFT(COALESCE(p_username, 'Анонимен'), 80),
          LEFT(p_answer_text, 2000), p_is_correct)
  ON CONFLICT (poll_id, session_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted > 0;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_vote(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- ============================================================================
-- Callers, so a change to the signature is a change to all four:
--   src/components/EventWrapper.jsx   handleVote — the participant's answer
--   src/views/Embed.jsx               handleVote — the embedded widget
--   src/lib/offlineQueue.js           flushQueue — the offline replay
--   scripts/verifyAllActivityTypes.mjs           — the end-to-end check
--
-- Returns TRUE when this call created the row, FALSE when a row for that
-- (poll_id, session_id) was already there. FALSE is a refusal for the first
-- two and a completed replay for the third.
--
-- The LEFT(…, 2000) bound is what makes an unbounded answer_text safe at the
-- column; the client trims to answerLimit(type) before it gets here, and the
-- two do not have to agree for this to hold.
-- ============================================================================
