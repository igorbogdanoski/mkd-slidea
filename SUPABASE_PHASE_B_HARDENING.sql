-- ============================================================
-- MKD Slidea — Phase B: Security Hardening
-- Run AFTER SUPABASE_PHASE_A_MIGRATION.sql.
-- Goals:
--   1. Hide event.password and event.cohost_code from public anon SELECT
--   2. Provide SECURITY DEFINER RPCs for password / cohost validation
--   3. Tighten votes / survey_responses RLS so anon cannot UPDATE/DELETE others
--   4. Tighten options/questions public mutation surfaces
-- This migration is idempotent — safe to re-run.
-- ============================================================

-- 0a. Profiles onboarding tracking ------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- 0b. Public-safe boolean flags ------------------------------
-- Public clients need to know that a password gate exists without
-- being able to read the password itself. Generated columns are
-- computed by Postgres and cannot be tampered with from the client.

DO $$
BEGIN
  ALTER TABLE public.events
    ADD COLUMN has_password BOOLEAN
    GENERATED ALWAYS AS (password IS NOT NULL AND length(password) > 0) STORED;
EXCEPTION WHEN duplicate_column THEN NULL;
END$$;

-- 1. RPCs ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_event_password(p_event_id UUID, p_password TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events
    WHERE id = p_event_id
      AND password IS NOT NULL
      AND password = p_password
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_event_password(UUID, TEXT) TO anon, authenticated;

-- Co-host code lookup: returns event id only (no leakage of other rows).
CREATE OR REPLACE FUNCTION public.find_event_by_cohost_code(p_code TEXT)
RETURNS TABLE (id UUID, code TEXT, title TEXT) AS $$
  SELECT id, code, title
  FROM public.events
  WHERE cohost_code IS NOT NULL
    AND UPPER(cohost_code) = UPPER(TRIM(p_code))
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.find_event_by_cohost_code(TEXT) TO anon, authenticated;

-- 2. Column-level grants ------------------------------------
-- Hide the sensitive columns from the `anon` role. Authenticated owners
-- still see them through SELECT * because the `authenticated` role retains
-- the default GRANT and RLS guarantees only owners can see their rows.

DO $$
BEGIN
  -- Anon: revoke direct SELECT on the table, then re-grant only safe columns.
  REVOKE SELECT ON public.events FROM anon;
  GRANT SELECT (
    id, code, title, created_at, active_poll_id,
    is_locked, async_mode, async_deadline,
    questions_moderation, brand_color, logo_url,
    user_id, has_password
  ) ON public.events TO anon;
EXCEPTION WHEN undefined_column THEN
  -- Some columns might not yet exist on legacy installs. Fall back to a
  -- broader grant minus the two sensitive ones.
  REVOKE SELECT ON public.events FROM anon;
  GRANT SELECT (id, code, title, created_at, active_poll_id) ON public.events TO anon;
END$$;

-- 3. Tighten participation tables ---------------------------
-- votes: allow public INSERT only. SELECT/UPDATE/DELETE restricted to event owner.

DROP POLICY IF EXISTS votes_public_read ON public.votes;
DROP POLICY IF EXISTS votes_public_write ON public.votes;

DROP POLICY IF EXISTS votes_owner_read ON public.votes;
CREATE POLICY votes_owner_read ON public.votes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
  -- Allow SELECT for anon too, to keep aggregate live results working.
  -- Aggregations rely on counting rows per option; rows themselves don't
  -- contain PII beyond optional username.
  OR auth.role() = 'anon'
);

DROP POLICY IF EXISTS votes_public_insert ON public.votes;
CREATE POLICY votes_public_insert ON public.votes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS votes_owner_update ON public.votes;
CREATE POLICY votes_owner_update ON public.votes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS votes_owner_delete ON public.votes;
CREATE POLICY votes_owner_delete ON public.votes FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
);

-- survey_responses: same pattern.

DROP POLICY IF EXISTS survey_responses_public_read ON public.survey_responses;
DROP POLICY IF EXISTS survey_responses_public_write ON public.survey_responses;

DROP POLICY IF EXISTS survey_responses_owner_read ON public.survey_responses;
CREATE POLICY survey_responses_owner_read ON public.survey_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
  OR auth.role() = 'anon'
);

DROP POLICY IF EXISTS survey_responses_public_insert ON public.survey_responses;
CREATE POLICY survey_responses_public_insert ON public.survey_responses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS survey_responses_owner_update ON public.survey_responses;
CREATE POLICY survey_responses_owner_update ON public.survey_responses FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS survey_responses_owner_delete ON public.survey_responses;
CREATE POLICY survey_responses_owner_delete ON public.survey_responses FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
);

-- 4. Per-poll length / sanity guard for open answers --------
-- Prevent unbounded text answers which can be abused as storage spam.
-- 4kB cap is more than enough for any classroom-sized open answer.

DO $$
BEGIN
  ALTER TABLE public.votes
    ADD CONSTRAINT votes_answer_text_max
    CHECK (answer_text IS NULL OR length(answer_text) <= 4096);
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.questions
    ADD CONSTRAINT questions_text_max
    CHECK (text IS NULL OR length(text) <= 1024);
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
