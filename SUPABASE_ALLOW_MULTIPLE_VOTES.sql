-- ============================================================================
-- FIX: "Повеќекратно гласање" (allow multiple votes) toggle was fully inert
-- ============================================================================
-- EventSettingsModal.jsx had a working-looking toggle, but it only wrote to
-- the HOST's own localStorage — participants on other devices had no way to
-- read it, and nothing in the vote path (EventWrapper.jsx) ever checked it.
-- Votes were always capped at one per session via the votes table's
-- UNIQUE(poll_id, session_id) constraint, regardless of the toggle's state.
--
-- Also: the old localStorage read used `!== 'false'`, which defaults to TRUE
-- for anyone who never touched the toggle (a null localStorage key isn't
-- 'false'). Now that this is real, defaulting to true would have silently
-- allowed vote-stuffing on every event unless a host explicitly opted out.
-- The DB column below defaults to false instead — single vote per session
-- unless explicitly enabled, matching normal expectations.
-- ============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_multiple_votes BOOLEAN NOT NULL DEFAULT false;
