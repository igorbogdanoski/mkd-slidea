-- RAG 2.3 — Re-embedding trigger
-- Run once in Supabase SQL Editor.
-- When a poll question or a community template title/description changes,
-- clears the embedding so embed-batch cron re-embeds it on the next run.

-- ── polls: re-embed when question text changes ─────────────────────────────
CREATE OR REPLACE FUNCTION clear_poll_embedding()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.question IS DISTINCT FROM OLD.question
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.curriculum_tags IS DISTINCT FROM OLD.curriculum_tags
  THEN
    NEW.embedding := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_poll_reembed ON polls;
CREATE TRIGGER trg_poll_reembed
  BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE FUNCTION clear_poll_embedding();

-- ── community_templates: re-embed when content changes ────────────────────
CREATE OR REPLACE FUNCTION clear_template_embedding()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.subject IS DISTINCT FROM OLD.subject
     OR NEW.grade IS DISTINCT FROM OLD.grade
  THEN
    NEW.embedding := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_template_reembed ON community_templates;
CREATE TRIGGER trg_template_reembed
  BEFORE UPDATE ON community_templates
  FOR EACH ROW EXECUTE FUNCTION clear_template_embedding();
