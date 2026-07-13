-- ============================================================================
-- Self-hosted error monitoring — no production crash was ever visible to the
-- founder before this (only console.error in the browser). Client and server
-- errors are logged here instead of a paid third-party service (Sentry etc.)
-- since standing one up mid-session isn't something that can be done without
-- the founder creating an account there themselves.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('client', 'server')),
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context JSONB
);

CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON public.error_log(created_at DESC);

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the log; writes go through api/log-error.js (service
-- role) or server-side catch blocks (also service role) — no direct
-- anon/authenticated INSERT policy needed.
DROP POLICY IF EXISTS error_log_admin_read ON public.error_log;
CREATE POLICY error_log_admin_read ON public.error_log FOR SELECT USING (public.is_admin());

-- Keep the table from growing unbounded — errors older than 30 days are
-- routine noise by then, not worth keeping.
CREATE OR REPLACE FUNCTION public.prune_error_log()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_log WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
