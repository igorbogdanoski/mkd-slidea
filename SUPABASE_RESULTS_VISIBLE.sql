-- Add results_visible and needs_moderation columns to polls table
-- Run this once in Supabase SQL editor

ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS results_visible BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS needs_moderation BOOLEAN NOT NULL DEFAULT FALSE;

-- Update any existing rows that have NULL (shouldn't happen with DEFAULT, but just in case)
UPDATE polls SET results_visible = TRUE WHERE results_visible IS NULL;
UPDATE polls SET needs_moderation = FALSE WHERE needs_moderation IS NULL;
