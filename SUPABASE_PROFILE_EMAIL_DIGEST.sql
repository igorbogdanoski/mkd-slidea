-- ============================================================================
-- profiles.email_digest — the column the profile form has been writing all along
--
-- 30.08.2026: ProfileTab.jsx upserts { id, name, public_teacher, email_digest }
-- but the column was never added to this instance. PostgREST answers a missing
-- column with 42703 and rejects the WHOLE row, so the save did not merely drop
-- the digest preference — a teacher could not save their display name or the
-- "public teacher" flag either. Found by tests/settings.spec.js SET-04, which
-- waits for the "Зачувано!" toast that never came.
--
-- Additive and safe to run against the live database: NOT NULL DEFAULT FALSE
-- backfills existing rows, and nothing reads the column server-side yet — the
-- only cron that sends a digest today is api/email/pending-reminder.js, which
-- is the admin pending-orders mail and does not consult profiles.
-- ============================================================================

alter table public.profiles
  add column if not exists email_digest boolean not null default false;

comment on column public.profiles.email_digest is
  'Teacher opt-in for the weekly summary mail, toggled in Профил → Нотификации. '
  'No sender reads it yet; it stores the preference so the toggle survives a '
  'reload and a digest job can pick it up when one is written.';
