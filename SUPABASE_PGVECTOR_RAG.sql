-- ============================================================================
-- ФАЗА 8.1 — pgvector + Gemini Embeddings RAG
-- ----------------------------------------------------------------------------
-- Цел: AI генерациите да се grounded во MK курикулум + community templates +
--       сопствена историја на хост. Цена: 0€ (gemini-embedding-001 free tier
--       + pgvector во Supabase free).
--
-- Димензија: 768 (Matryoshka truncation од gemini-embedding-001 native 3072).
-- Distance: cosine (vector_cosine_ops).
-- Index: HNSW (фасттер insert/query од IVFFlat за умерени dataset-и).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────
-- 1) Embedding колони на постоечки табели
-- ─────────────────────────────────────────────────────────────────

-- polls: за „chat-with-your-events" + сличност на host историја
ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- community_templates: за семантичко пребарување на shared templates
ALTER TABLE community_templates
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- ─────────────────────────────────────────────────────────────────
-- 2) Curriculum chunks — RAG knowledge base за MK курикулум
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS curriculum_chunks (
  id BIGSERIAL PRIMARY KEY,
  track TEXT NOT NULL,                    -- primary | gymnasium | vocational4 | ...
  grade TEXT NOT NULL,                    -- G1..G13
  subject TEXT NOT NULL,                  -- math | physics | mk_language | ...
  topic TEXT,
  subtopic TEXT,
  text TEXT NOT NULL,                     -- chunk текст за embed
  tags TEXT[] DEFAULT '{}',
  embedding vector(768),
  source TEXT,                            -- БРО / MoN / community
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track, grade, subject, topic, subtopic, text)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_chunks_grade_subject
  ON curriculum_chunks(grade, subject);

-- HNSW индекси (создаваат се само кога има податоци; safe with IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_polls_embedding_hnsw') THEN
    EXECUTE 'CREATE INDEX idx_polls_embedding_hnsw ON polls USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_templates_embedding_hnsw') THEN
    EXECUTE 'CREATE INDEX idx_templates_embedding_hnsw ON community_templates USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_curriculum_embedding_hnsw') THEN
    EXECUTE 'CREATE INDEX idx_curriculum_embedding_hnsw ON curriculum_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 3) RLS — curriculum_chunks се public-read, write само service role
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE curriculum_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS curriculum_public_read ON curriculum_chunks;
CREATE POLICY curriculum_public_read ON curriculum_chunks
  FOR SELECT USING (true);

-- (No INSERT/UPDATE/DELETE policy → only service_role bypasses RLS.)

-- ─────────────────────────────────────────────────────────────────
-- 4) RPC: match_curriculum — top-K курикулум chunks за query
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_curriculum(
  query_embedding vector(768),
  match_count INT DEFAULT 3,
  p_grade TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  track TEXT,
  grade TEXT,
  subject TEXT,
  topic TEXT,
  subtopic TEXT,
  text TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.track,
    c.grade,
    c.subject,
    c.topic,
    c.subtopic,
    c.text,
    c.tags,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM curriculum_chunks c
  WHERE c.embedding IS NOT NULL
    AND (p_grade   IS NULL OR c.grade   = p_grade)
    AND (p_subject IS NULL OR c.subject = p_subject)
  ORDER BY c.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(match_count, 10));
END;
$$;

GRANT EXECUTE ON FUNCTION match_curriculum(vector, INT, TEXT, TEXT) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- 5) RPC: match_templates — top-K shared templates
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_templates(
  query_embedding vector(768),
  match_count INT DEFAULT 5,
  p_subject TEXT DEFAULT NULL,
  p_grade TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  subject TEXT,
  grade TEXT,
  uses_count INT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.subject,
    t.grade,
    COALESCE(t.uses_count, 0) AS uses_count,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM community_templates t
  WHERE t.embedding IS NOT NULL
    AND COALESCE(t.is_published, TRUE) = TRUE
    AND (p_subject IS NULL OR t.subject = p_subject)
    AND (p_grade   IS NULL OR t.grade   = p_grade)
  ORDER BY t.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(match_count, 20));
END;
$$;

GRANT EXECUTE ON FUNCTION match_templates(vector, INT, TEXT, TEXT) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- 6) RPC: match_my_polls — host-scoped (само сопствени polls)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_my_polls(
  query_embedding vector(768),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  question TEXT,
  type TEXT,
  curriculum_tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.event_id,
    p.question,
    p.type,
    COALESCE(p.curriculum_tags, '{}'::TEXT[]) AS curriculum_tags,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM polls p
  JOIN events e ON e.id = p.event_id
  WHERE e.user_id = uid
    AND p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(match_count, 20));
END;
$$;

GRANT EXECUTE ON FUNCTION match_my_polls(vector, INT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 7) Helper RPC: stats за backfill progress
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION embedding_backfill_stats()
RETURNS TABLE (
  table_name TEXT,
  total BIGINT,
  embedded BIGINT,
  pending BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'polls'::TEXT,
         COUNT(*)::BIGINT,
         COUNT(embedding)::BIGINT,
         (COUNT(*) - COUNT(embedding))::BIGINT
  FROM polls
  UNION ALL
  SELECT 'community_templates'::TEXT,
         COUNT(*)::BIGINT,
         COUNT(embedding)::BIGINT,
         (COUNT(*) - COUNT(embedding))::BIGINT
  FROM community_templates
  UNION ALL
  SELECT 'curriculum_chunks'::TEXT,
         COUNT(*)::BIGINT,
         COUNT(embedding)::BIGINT,
         (COUNT(*) - COUNT(embedding))::BIGINT
  FROM curriculum_chunks;
$$;

GRANT EXECUTE ON FUNCTION embedding_backfill_stats() TO service_role;

-- ============================================================================
-- DONE. Следен чекор: api/_lib/embeddings.js + api/embed-batch.js за backfill.
-- ============================================================================
