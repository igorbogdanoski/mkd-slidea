-- ============================================================================
-- Renewal reminder tracking — nothing emailed a paying customer whose
-- subscription was about to expire; only an admin-side "pending order" nag
-- existed. renewal_reminder_sent_at lets the cron (api/email/renewal-reminder.js)
-- avoid re-sending the same reminder every day, while naturally resetting on
-- each renewal (a fresh pro_until makes the old timestamp "stale" relative
-- to it, so the next expiration gets its own reminder).
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ;
