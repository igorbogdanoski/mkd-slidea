-- ============================================================================
-- Backup heartbeat — the daily backup cron (on the VPS) logged locally only,
-- so a silently-broken backup looked identical to a working one. The backup
-- script now writes a heartbeat row here on success; a Vercel cron
-- (api/check-backup-health.js) checks it daily and emails an alert if the
-- last successful backup is more than ~26h old.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_health (
  key TEXT PRIMARY KEY,
  last_success_at TIMESTAMPTZ,
  detail TEXT
);

ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_health_admin_read ON public.system_health;
CREATE POLICY system_health_admin_read ON public.system_health FOR SELECT USING (public.is_admin());

INSERT INTO public.system_health (key, last_success_at, detail)
VALUES ('backup', NULL, 'awaiting first heartbeat')
ON CONFLICT (key) DO NOTHING;
