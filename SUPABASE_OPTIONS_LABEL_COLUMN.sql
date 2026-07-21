-- ============================================================================
-- FIX: scale poll custom endpoint labels (e.g. "Воопшто не" / "Апсолутно да")
-- were captured in CreatePollModal.jsx's UI but had nowhere to land — the
-- options table has no label column, and useHostSession.onSavePoll only ever
-- forwarded {text, is_correct} when inserting/updating options, dropping
-- whatever label the form built. Dead feature end-to-end.
-- ============================================================================

ALTER TABLE options ADD COLUMN IF NOT EXISTS label TEXT;
