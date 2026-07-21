-- ============================================================================
-- FIX: ranking polls only recorded the participant's #1 pick
-- ============================================================================
-- Participant.jsx's ranking UI lets people drag/reorder ALL options, but on
-- submit it called handleVote(rankingOrder[0]) — only the top pick reached
-- the backend via increment_vote(option_id), a plain +1. The rest of the
-- ordering was discarded; there was no way to record it since increment_vote
-- can't add anything other than 1.
--
-- Fix: a weighted variant that adds an arbitrary amount in one atomic UPDATE,
-- same SECURITY DEFINER pattern as increment_vote. The app now submits a
-- Borda count for every option in the ranking (most preferred = N points,
-- least = 1), reusing options.votes as the aggregate score — no schema
-- change needed, and Presenter's existing medal/bar ranking view (sorted by
-- votes) already renders a meaningful aggregate ranking as a result.
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_vote_weighted(option_id UUID, weight INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.options SET votes = votes + weight WHERE id = option_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_vote_weighted(UUID, INT) TO anon, authenticated;
