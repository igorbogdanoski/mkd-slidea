-- ============================================================
-- CRITICAL FIX: increment_vote must use SECURITY DEFINER
-- ============================================================
-- The anon role cannot UPDATE options.votes directly because
-- options_owner_write RLS requires auth.uid() = event owner.
-- Adding SECURITY DEFINER lets the function bypass RLS and run
-- as the definer (postgres), so participants can vote correctly.
-- Run this in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.increment_vote(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.options SET votes = votes + 1 WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_vote(UUID) TO anon, authenticated;

-- Also apply SECURITY DEFINER to increment_question_vote for Q&A upvotes
CREATE OR REPLACE FUNCTION public.increment_question_vote(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.questions SET votes = votes + 1 WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_question_vote(UUID) TO anon, authenticated;

-- Fix votes SELECT so the host (authenticated event owner) can always read
-- votes for their events, even when checking stats in the modal.
DROP POLICY IF EXISTS votes_owner_read ON public.votes;
CREATE POLICY votes_owner_read ON public.votes FOR SELECT USING (
  -- Anon participants can read (needed for live aggregate results)
  auth.role() = 'anon'
  -- Event owners can read all votes for their events
  OR EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id
      AND e.user_id IS NOT NULL
      AND e.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- Ensure votes INSERT is open (idempotent — safe to re-run)
DROP POLICY IF EXISTS votes_public_insert ON public.votes;
CREATE POLICY votes_public_insert ON public.votes FOR INSERT WITH CHECK (true);
