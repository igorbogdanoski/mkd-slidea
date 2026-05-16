-- Sprint В.1 — Email Drip Log
-- Run once in Supabase SQL Editor.
-- Tracks which drip emails have been sent to prevent duplicates.

CREATE TABLE IF NOT EXISTS email_drip_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text        NOT NULL,
  drip_day   int         NOT NULL CHECK (drip_day IN (0, 3, 7, 14)),
  sent_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, drip_day)
);

ALTER TABLE email_drip_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (cron job uses service role key)
CREATE POLICY "service_only" ON email_drip_log
  USING (false) WITH CHECK (false);
