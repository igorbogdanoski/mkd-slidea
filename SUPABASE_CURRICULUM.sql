-- Sprint 6.1 / 6.2 / 6.3 — Curriculum mapping, benchmark, vocabulary corpus.
-- Run in Supabase SQL editor.

-- ─── 6.1 Curriculum mapping ────────────────────────────────────────
ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS curriculum_tags TEXT[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS polls_curriculum_tags_gin
  ON polls USING gin (curriculum_tags);

-- ─── 6.2 Anonymous benchmark ───────────────────────────────────────
-- Returns aggregated quiz performance across all events for a curriculum tag.
-- Privacy: no event_id, no user_id, no host_id leaked. Aggregates over min 3
-- events to avoid de-anonymization on tiny samples.
CREATE OR REPLACE FUNCTION curriculum_tag_benchmark(p_tag TEXT)
RETURNS TABLE(
  tag TEXT,
  events_count INT,
  total_votes INT,
  total_correct INT,
  avg_accuracy NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH tagged AS (
    SELECT p.id, p.event_id
    FROM polls p
    WHERE p.curriculum_tags @> ARRAY[p_tag]
      AND p.is_quiz = TRUE
  ),
  per_poll AS (
    SELECT
      t.event_id,
      t.id AS poll_id,
      COALESCE(SUM(o.votes), 0) AS poll_votes,
      COALESCE(SUM(CASE WHEN o.is_correct THEN o.votes ELSE 0 END), 0) AS poll_correct
    FROM tagged t
    LEFT JOIN options o ON o.poll_id = t.id
    GROUP BY t.event_id, t.id
  ),
  agg AS (
    SELECT
      COUNT(DISTINCT event_id) AS events_count,
      SUM(poll_votes) AS total_votes,
      SUM(poll_correct) AS total_correct
    FROM per_poll
  )
  -- Privacy hardening: when fewer than 3 events exist, return only the tag
  -- and zero counters so the client cannot infer per-class data from small
  -- samples (k-anonymity for raw counts AND accuracy).
  SELECT
    p_tag,
    CASE WHEN COALESCE(events_count, 0) >= 3 THEN events_count::int ELSE 0 END,
    CASE WHEN COALESCE(events_count, 0) >= 3 THEN COALESCE(total_votes, 0)::int ELSE 0 END,
    CASE WHEN COALESCE(events_count, 0) >= 3 THEN COALESCE(total_correct, 0)::int ELSE 0 END,
    CASE
      WHEN COALESCE(events_count, 0) >= 3 AND COALESCE(total_votes, 0) > 0
        THEN ROUND((total_correct::numeric / total_votes::numeric) * 100, 1)
      ELSE NULL
    END
  FROM agg;
$$;

GRANT EXECUTE ON FUNCTION curriculum_tag_benchmark(TEXT) TO anon, authenticated;

-- ─── 6.3 MK education vocabulary corpus ────────────────────────────
-- Anonymous keyword log written by the AI generator. No prompt text, no
-- user_id — only normalized lowercase keywords + counters, so we can build
-- the public top-vocab list without privacy risk.
CREATE TABLE IF NOT EXISTS ai_vocab (
  word         TEXT PRIMARY KEY,
  uses         INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subjects     TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX IF NOT EXISTS ai_vocab_uses_idx ON ai_vocab (uses DESC);

-- Lock down direct access. All read/write must go through SECURITY DEFINER
-- RPCs (bump_vocab, top_vocab). No policies = no direct access for anon /
-- authenticated, even though SELECT/INSERT grants are not given here.
ALTER TABLE ai_vocab ENABLE ROW LEVEL SECURITY;

-- Bump-or-insert helper. Service-role only via api/generate.js; nothing
-- exposed to anon / authenticated for write.
CREATE OR REPLACE FUNCTION bump_vocab(p_word TEXT, p_subject TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO ai_vocab (word, uses, last_used_at, subjects)
  VALUES (LOWER(p_word), 1, NOW(),
          CASE WHEN p_subject IS NULL THEN ARRAY[]::TEXT[] ELSE ARRAY[p_subject] END)
  ON CONFLICT (word) DO UPDATE
    SET uses = ai_vocab.uses + 1,
        last_used_at = NOW(),
        subjects = CASE
          WHEN p_subject IS NULL OR p_subject = ANY(ai_vocab.subjects) THEN ai_vocab.subjects
          ELSE array_append(ai_vocab.subjects, p_subject)
        END;
END;
$$;

REVOKE ALL ON FUNCTION bump_vocab(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bump_vocab(TEXT, TEXT) TO service_role;

-- Public top-N vocabulary (anonymous). Used by the dashboard "data flywheel"
-- widget. No PII — only words and frequencies.
CREATE OR REPLACE FUNCTION top_vocab(p_limit INT DEFAULT 50, p_subject TEXT DEFAULT NULL)
RETURNS TABLE(word TEXT, uses INT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT word, uses
  FROM ai_vocab
  WHERE (p_subject IS NULL OR p_subject = ANY(subjects))
  ORDER BY uses DESC, last_used_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$$;

GRANT EXECUTE ON FUNCTION top_vocab(INT, TEXT) TO anon, authenticated;
