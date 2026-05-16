-- RAG 2.4 — Search analytics log
-- Run once in Supabase SQL Editor.
-- Tracks semantic search queries for quality monitoring and UX improvement.

CREATE TABLE IF NOT EXISTS search_logs (
  id          bigserial   PRIMARY KEY,
  query       text        NOT NULL,
  subject     text,
  grade       text,
  scopes      text[],
  result_count_curriculum  int DEFAULT 0,
  result_count_templates   int DEFAULT 0,
  result_count_my_polls    int DEFAULT 0,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for analytics queries (by day, subject, grade)
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_subject    ON search_logs (subject) WHERE subject IS NOT NULL;

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Service role writes; admins can read all; users can see own
CREATE POLICY "service_write" ON search_logs
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_read_all" ON search_logs
  FOR SELECT TO service_role USING (true);

CREATE POLICY "user_read_own" ON search_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── Top queries RPC (admin analytics) ────────────────────────────────────
CREATE OR REPLACE FUNCTION top_search_queries(
  p_limit  int     DEFAULT 20,
  p_days   int     DEFAULT 30,
  p_subject text   DEFAULT NULL
)
RETURNS TABLE (
  query        text,
  count        bigint,
  avg_results  numeric,
  last_seen    timestamptz
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    query,
    COUNT(*)                                          AS count,
    ROUND(AVG(result_count_curriculum
            + result_count_templates
            + result_count_my_polls), 1)              AS avg_results,
    MAX(created_at)                                   AS last_seen
  FROM search_logs
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    AND (p_subject IS NULL OR subject = p_subject)
  GROUP BY query
  ORDER BY count DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION top_search_queries TO authenticated, service_role;

-- ── Backfill stats (existing function reminder — already in PGVECTOR_RAG.sql)
-- embedding_backfill_stats() already exists; no change needed.
