-- RAG 2.5 — Add source_url to curriculum_chunks
-- Run once in Supabase SQL Editor.
-- Stores the official BRO PDF URL for each curriculum chunk so that
-- SemanticSearchTab can show a "View official document" link.

ALTER TABLE curriculum_chunks
  ADD COLUMN IF NOT EXISTS source_url text;

-- Index for filtering chunks that have an official document link
CREATE INDEX IF NOT EXISTS idx_curriculum_chunks_source_url
  ON curriculum_chunks (source_url)
  WHERE source_url IS NOT NULL;

-- Update the match_curriculum RPC to also return source_url
CREATE OR REPLACE FUNCTION match_curriculum(
  query_embedding  vector(768),
  match_count      int     DEFAULT 3,
  p_grade          text    DEFAULT NULL,
  p_subject        text    DEFAULT NULL
)
RETURNS TABLE (
  id          bigint,
  track       text,
  grade       text,
  subject     text,
  topic       text,
  subtopic    text,
  text        text,
  tags        text[],
  source_url  text,
  similarity  float
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, track, grade, subject, topic, subtopic, text, tags, source_url,
    1 - (embedding <=> query_embedding) AS similarity
  FROM curriculum_chunks
  WHERE
    embedding IS NOT NULL
    AND (p_grade   IS NULL OR grade   = p_grade)
    AND (p_subject IS NULL OR subject = p_subject)
  ORDER BY embedding <=> query_embedding
  LIMIT LEAST(match_count, 10);
$$;

GRANT EXECUTE ON FUNCTION match_curriculum TO anon, authenticated, service_role;
