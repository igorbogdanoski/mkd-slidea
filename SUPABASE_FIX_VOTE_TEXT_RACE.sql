-- ============================================================================
-- FIX — vote-text.js правеше check-then-act (SELECT потоа INSERT/UPDATE) без
-- unique constraint, па кога повеќе ученици истовремено испратат ист збор во
-- word cloud, секој инсертира своја row наместо инкремент на иста (дупликати
-- наместо еден спој со точен број гласови).
-- ----------------------------------------------------------------------------
-- Атомски upsert преку unique index + ON CONFLICT, во една SECURITY DEFINER
-- RPC функција — ја елиминира целата race-прозорка.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS options_poll_id_lower_text_key
  ON public.options (poll_id, lower(text));

CREATE OR REPLACE FUNCTION public.upsert_text_option(p_poll_id UUID, p_text TEXT, p_is_approved BOOLEAN DEFAULT true)
RETURNS void AS $$
BEGIN
  INSERT INTO public.options (poll_id, text, votes, is_approved)
  VALUES (p_poll_id, p_text, 1, p_is_approved)
  ON CONFLICT (poll_id, lower(text)) DO UPDATE SET votes = options.votes + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.upsert_text_option(UUID, TEXT, BOOLEAN) TO anon, authenticated, service_role;
