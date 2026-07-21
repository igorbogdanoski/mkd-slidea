-- ============================================================================
-- FIX: poll cover images were dead end-to-end
-- ============================================================================
-- CreatePollModal.jsx already sent cover_url/cover_meta in its onSave payload,
-- Presenter.jsx already rendered currentPoll.cover_url when present — but the
-- picker button to actually set them was never rendered (IllustrationPickerModal
-- imported + isOpen state declared, never mounted), the polls table had no
-- matching columns, and onSavePoll dropped both fields on insert/update even
-- if they had been set. All three layers now wired up.
-- ============================================================================

ALTER TABLE polls ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS cover_meta JSONB;
