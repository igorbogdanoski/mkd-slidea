-- ============================================================================
-- Section 4 of SUPABASE_ANSWER_KEY_SCOPED.sql. APPLIED to production
-- 2026-09-19 and verified. Do not run it again — it is already in force.
--
-- Verified after applying, with the public anon key taken from the deployed
-- bundle (entry index-Bhx5xpLx.js):
--
--   polls.correct_answer / answer_explanation / blanks   → 401 42501
--   options.is_correct                                   → 401 42501
--   polls?select=*  and  options?select=*                → 401 42501
--   the anonymous column list, and the same list with
--     options(...) embedded exactly as useEvent sends it  → 200
--   events?select=id,code (joining by code)              → 200
--   poll_answer_key / participant_blanks / quiz_verdict /
--     poll_accuracy                                      → 200
--
-- anon now holds 17 columns on polls and 8 on options. `authenticated` kept
-- polls.correct_answer and options.is_correct, confirmed in
-- information_schema.role_column_grants, so the host screen and the Dashboard
-- are untouched.
--
-- And the browser suite: 189 passed, 0 failed, 0 skipped against production
-- both before and after this file ran — so the client rewiring was verified on
-- its own before the columns went away, which is the order that matters.
--
-- Prerequisites that were confirmed before running it:
--   • the four scoped functions exist and were verified against real rows
--   • production serves the client that reads through them: the anonymous column
--     list carries no key, the host list does, and all four RPC names are in the
--     bundle
--
-- REVOKE SELECT (col) alone would be a silent no-op while a table-wide grant
-- stands, because the per-column entries derive from it. That is recorded in
-- SUPABASE_LOCK_DOWN_ANON_READS.sql and was learned there the hard way. So the
-- table grant goes first and SELECT comes back column by column.
--
-- Only `anon`. The host screen and the Dashboard run as `authenticated` and are
-- owner-scoped by row security; they keep the full table and need it.
--
-- ── ROLLBACK, if a screen ever breaks ──────────────────────────────────────
--   GRANT SELECT ON public.polls   TO anon;
--   GRANT SELECT ON public.options TO anon;
-- That restores the previous state exactly: table-wide SELECT for anon, key
-- readable again. It costs nothing to run and is not destructive.
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

REVOKE SELECT ON public.polls FROM anon;

GRANT SELECT (
  id, event_id, question, type, is_quiz, position, active, created_at,
  answer_revealed, results_visible, needs_moderation, survey_questions,
  timer_ends_at, presenter_notes, curriculum_tags, cover_url, cover_meta
) ON public.polls TO anon;

REVOKE SELECT ON public.options FROM anon;

GRANT SELECT (
  id, poll_id, event_id, text, votes, label, is_approved, created_at
) ON public.options TO anon;

COMMIT;

-- ── Verify from inside the database ────────────────────────────────────────
\pset border 0
\pset format unaligned

SELECT 'anon columns on polls: ' || string_agg(column_name, ', ' ORDER BY column_name)
  FROM information_schema.role_column_grants
 WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'polls'
   AND privilege_type = 'SELECT';

SELECT 'anon columns on options: ' || string_agg(column_name, ', ' ORDER BY column_name)
  FROM information_schema.role_column_grants
 WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'options'
   AND privilege_type = 'SELECT';

-- authenticated must still hold the key, or the host screen breaks. A table-wide
-- grant shows up in role_column_grants as one row per column, so checking the
-- key column directly is the test that matters.
SELECT 'authenticated keeps polls.correct_answer: ' || count(*)
  FROM information_schema.role_column_grants
 WHERE grantee = 'authenticated' AND table_schema = 'public'
   AND table_name = 'polls' AND column_name = 'correct_answer'
   AND privilege_type = 'SELECT';

SELECT 'authenticated keeps options.is_correct: ' || count(*)
  FROM information_schema.role_column_grants
 WHERE grantee = 'authenticated' AND table_schema = 'public'
   AND table_name = 'options' AND column_name = 'is_correct'
   AND privilege_type = 'SELECT';

SELECT 'nothing moved — events/polls/options/votes: '
       || (SELECT count(*) FROM public.events) || '/'
       || (SELECT count(*) FROM public.polls) || '/'
       || (SELECT count(*) FROM public.options) || '/'
       || (SELECT count(*) FROM public.votes);
