-- Sprint 14 (5.6) — Open API: API keys for school-system integrations.
-- Idempotent. Stores ONLY a SHA-256 hash of the key (never the plaintext).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  key_prefix   TEXT NOT NULL,        -- first 8 chars for display ("mks_abcd")
  scopes       TEXT[] NOT NULL DEFAULT ARRAY['read:events','read:results']::TEXT[],
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user      ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash      ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own keys" ON public.api_keys;
CREATE POLICY "Owner reads own keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Insert / revoke handled exclusively by SECURITY DEFINER functions.

-- 1) Create a key. Plaintext is returned ONCE and never stored.
CREATE OR REPLACE FUNCTION public.create_api_key(p_name TEXT)
RETURNS TABLE (id UUID, plaintext TEXT, prefix TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_random TEXT;
  v_plain  TEXT;
  v_hash   TEXT;
  v_prefix TEXT;
  v_id     UUID;
  v_at     TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 32 hex chars of randomness → safe for API keys.
  v_random := ENCODE(gen_random_bytes(24), 'hex');
  v_plain  := 'mks_' || v_random;
  v_hash   := ENCODE(digest(v_plain, 'sha256'), 'hex');
  v_prefix := SUBSTRING(v_plain FROM 1 FOR 12); -- "mks_xxxxxxxx"

  INSERT INTO public.api_keys (user_id, name, key_hash, key_prefix)
  VALUES (v_user, COALESCE(NULLIF(TRIM(p_name), ''), 'API Key'), v_hash, v_prefix)
  RETURNING public.api_keys.id, public.api_keys.created_at
  INTO v_id, v_at;

  RETURN QUERY SELECT v_id, v_plain, v_prefix, v_at;
END;
$$;

REVOKE ALL ON FUNCTION public.create_api_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_api_key(TEXT) TO authenticated;

-- 2) Revoke a key.
CREATE OR REPLACE FUNCTION public.revoke_api_key(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN FALSE; END IF;
  UPDATE public.api_keys
     SET revoked_at = NOW()
   WHERE id = p_id AND user_id = v_user AND revoked_at IS NULL;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_api_key(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(UUID) TO authenticated;

-- 3) Resolve a hashed key → owner profile (called by Edge fn with service role).
CREATE OR REPLACE FUNCTION public.resolve_api_key(p_hash TEXT)
RETURNS TABLE (key_id UUID, owner_id UUID, scopes TEXT[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, scopes
    FROM public.api_keys
   WHERE key_hash = p_hash
     AND revoked_at IS NULL
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_api_key(TEXT) FROM PUBLIC;
-- Only the service role (Edge function) should resolve keys.
GRANT EXECUTE ON FUNCTION public.resolve_api_key(TEXT) TO service_role;

-- 4) Touch last_used_at (audit).
CREATE OR REPLACE FUNCTION public.touch_api_key(p_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.api_keys SET last_used_at = NOW() WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.touch_api_key(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_api_key(UUID) TO service_role;

COMMENT ON TABLE public.api_keys IS
  'Sprint 5.6 — Open API. Plaintext key returned once via create_api_key; only SHA-256 hash stored.';
