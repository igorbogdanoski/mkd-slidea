-- ============================================================================
-- ФАЗА 8.3.1 + 8.3.2 — Q&A upvote stream + Emoji reactions
-- ----------------------------------------------------------------------------
-- ВАЖНО: го НАДОГРАДУВА постоечкиот `questions` (од SUPABASE_SETUP.sql),
-- НЕ создава нова табела. Така постоечкиот код во useEvent/Presenter
-- продолжува да работи без break-аже.
--
-- Emoji reactions: само Realtime broadcast канал, БЕЗ persist во DB.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────
-- 1) events.is_qa_enabled / is_reactions_enabled flags
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_qa_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_reactions_enabled BOOLEAN DEFAULT TRUE;

-- ─────────────────────────────────────────────────────────────────
-- 2) questions extra columns (session-aware upvoting + pin status)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS session_id TEXT,                    -- кој ја постави
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_questions_event_votes ON questions(event_id, votes DESC);
CREATE INDEX IF NOT EXISTS idx_questions_event_pinned ON questions(event_id, is_pinned, votes DESC);

-- ─────────────────────────────────────────────────────────────────
-- 3) question_upvotes (joiner за session-scoped upvoting)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS question_upvotes (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (question_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_question_upvotes_session ON question_upvotes(session_id);

-- ─────────────────────────────────────────────────────────────────
-- 4) RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS questions_public_read ON questions;
CREATE POLICY questions_public_read ON questions FOR SELECT USING (true);

DROP POLICY IF EXISTS question_upvotes_public_read ON question_upvotes;
CREATE POLICY question_upvotes_public_read ON question_upvotes FOR SELECT USING (true);

-- INSERT: само ако is_qa_enabled = TRUE
DROP POLICY IF EXISTS questions_public_insert ON questions;
CREATE POLICY questions_public_insert ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = questions.event_id
        AND COALESCE(e.is_qa_enabled, TRUE) = TRUE
    )
  );

-- UPDATE / DELETE — само host (owner)
DROP POLICY IF EXISTS questions_host_update ON questions;
CREATE POLICY questions_host_update ON questions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = questions.event_id AND e.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = questions.event_id AND e.user_id = auth.uid())
  );

DROP POLICY IF EXISTS questions_host_delete ON questions;
CREATE POLICY questions_host_delete ON questions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = questions.event_id AND e.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- 5) RPC: toggle_question_upvote(p_question_id, p_session_id)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION toggle_question_upvote(
  p_question_id UUID,
  p_session_id TEXT
)
RETURNS TABLE (
  votes INT,
  upvoted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existed BOOLEAN;
  v_count INT;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 3 THEN
    RAISE EXCEPTION 'invalid_session';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM question_upvotes
    WHERE question_id = p_question_id AND session_id = p_session_id
  ) INTO v_existed;

  IF v_existed THEN
    DELETE FROM question_upvotes
      WHERE question_id = p_question_id AND session_id = p_session_id;
    UPDATE questions
      SET votes = GREATEST(0, votes - 1)
      WHERE id = p_question_id
      RETURNING questions.votes INTO v_count;
    RETURN QUERY SELECT COALESCE(v_count, 0), FALSE;
  ELSE
    INSERT INTO question_upvotes (question_id, session_id)
      VALUES (p_question_id, p_session_id)
      ON CONFLICT DO NOTHING;
    UPDATE questions
      SET votes = votes + 1
      WHERE id = p_question_id
      RETURNING questions.votes INTO v_count;
    RETURN QUERY SELECT COALESCE(v_count, 0), TRUE;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_question_upvote(UUID, TEXT) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 6) Realtime publication
-- ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'questions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE questions';
  END IF;
END $$;

-- ============================================================================
-- DONE.
-- Emoji reactions: користи Realtime BROADCAST channel `event:<id>:reactions`
-- (zero DB cost, ефемерни). Видо client implementation.
-- ============================================================================
