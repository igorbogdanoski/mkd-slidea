-- ============================================================================
-- FIX: participants could see "session ended" instead of "paused"
-- ============================================================================
-- EventWrapper.jsx distinguished "paused" from "ended" using
-- isEnded = !event.active_poll_id — but active_poll_id is ALSO null before
-- the host has ever activated a poll (the normal pre-session state). If a
-- host locked the audience before activating any poll, participants would
-- incorrectly see the "🎉 Session ended" screen instead of "paused."
--
-- endSession() already sets is_locked=true + active_poll_id=null as a
-- deliberate pair — this gives it its own unambiguous marker instead of an
-- overloaded coincidence.
-- ============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
