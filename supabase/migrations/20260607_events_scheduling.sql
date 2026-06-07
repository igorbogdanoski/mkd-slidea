-- Migration: Session Scheduling
-- Run this in Supabase SQL Editor or via: supabase db push
--
-- Adds starts_at (nullable UTC timestamp) and reminded (flag to prevent duplicate emails)
-- to the events table. Both are optional — existing rows are unaffected.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS starts_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminded    BOOLEAN     DEFAULT FALSE;

-- Index for the Edge Function cron query (events starting in the next ~15 min)
CREATE INDEX IF NOT EXISTS idx_events_starts_at
  ON events (starts_at)
  WHERE starts_at IS NOT NULL AND reminded = FALSE;

-- Grant anon read on starts_at (needed for public results page display)
-- (write remains host-only via RLS)
COMMENT ON COLUMN events.starts_at  IS 'Optional scheduled start time. NULL = no schedule.';
COMMENT ON COLUMN events.reminded   IS 'TRUE once a 15-min reminder email has been sent.';
