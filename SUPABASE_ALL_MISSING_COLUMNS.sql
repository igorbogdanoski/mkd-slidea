-- ============================================================
-- MKD Slidea — Comprehensive missing-columns patch
-- Safe to re-run (all use IF NOT EXISTS / ON CONFLICT).
-- Run this ONCE in Supabase SQL Editor to fix all 400 errors.
-- ============================================================

-- ── 1. events.brand_font ─────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS brand_font TEXT;

-- Anon needs SELECT on brand_font (Phase B revoked SELECT * on events)
GRANT SELECT (brand_font) ON public.events TO anon;

-- ── 2. polls: presenter_notes + curriculum_tags ───────────────
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS presenter_notes TEXT;

ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS curriculum_tags TEXT[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS polls_curriculum_tags_gin
  ON public.polls USING gin (curriculum_tags);

-- ── 3. questions: is_pinned, is_hidden, answered_at ──────────
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_pinned   BOOLEAN DEFAULT false;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_hidden   BOOLEAN DEFAULT false;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;

-- ── 4. increment_vote: SECURITY DEFINER (critical for votes) ─
-- Anon participants cannot UPDATE options.votes due to RLS.
-- SECURITY DEFINER makes the function run as its definer role,
-- bypassing RLS so vote counts actually increment.
CREATE OR REPLACE FUNCTION public.increment_vote(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.options SET votes = votes + 1 WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_vote(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_question_vote(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.questions SET votes = votes + 1 WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_question_vote(UUID) TO anon, authenticated;

-- ── 5. votes: correct SELECT policy for event owners ─────────
DROP POLICY IF EXISTS votes_owner_read ON public.votes;
CREATE POLICY votes_owner_read ON public.votes FOR SELECT USING (
  auth.role() = 'anon'
  OR EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id
      AND e.user_id IS NOT NULL
      AND e.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- Ensure anon INSERT is open
DROP POLICY IF EXISTS votes_public_insert ON public.votes;
CREATE POLICY votes_public_insert ON public.votes FOR INSERT WITH CHECK (true);

-- ── 6. results_visible / needs_moderation defaults ───────────
-- (already in Phase A, but safe to repeat)
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS results_visible   BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS needs_moderation  BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.polls SET results_visible  = TRUE  WHERE results_visible  IS NULL;
UPDATE public.polls SET needs_moderation = FALSE WHERE needs_moderation IS NULL;
