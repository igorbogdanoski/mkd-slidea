-- 5.1 Public Template Gallery — community-contributed lesson templates.
-- SEO-friendly URLs: /templates/:slug
-- Idempotent — safe to re-run on top of any prior community_templates schema.

CREATE TABLE IF NOT EXISTS public.community_templates (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  title       TEXT         NOT NULL,
  description TEXT,
  polls       JSONB        NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add (or backfill) columns introduced by Sprint 5.1.
ALTER TABLE public.community_templates
  ADD COLUMN IF NOT EXISTS slug         TEXT,
  ADD COLUMN IF NOT EXISTS subject      TEXT,
  ADD COLUMN IF NOT EXISTS category     TEXT,
  ADD COLUMN IF NOT EXISTS grade        TEXT,
  ADD COLUMN IF NOT EXISTS icon         TEXT,
  ADD COLUMN IF NOT EXISTS author_name  TEXT,
  ADD COLUMN IF NOT EXISTS views        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill slug from id for any legacy rows missing one.
UPDATE public.community_templates
   SET slug = LOWER(REGEXP_REPLACE(COALESCE(slug, id::text), '[^a-z0-9-]+', '-', 'g'))
 WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_community_templates_slug
  ON public.community_templates (slug);
CREATE INDEX IF NOT EXISTS idx_community_templates_published
  ON public.community_templates (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_templates_subject
  ON public.community_templates (subject);

ALTER TABLE public.community_templates ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can read published & public templates — SEO + viral discovery.
DROP POLICY IF EXISTS "Public read published templates" ON public.community_templates;
CREATE POLICY "Public read published templates"
  ON public.community_templates
  FOR SELECT
  USING (COALESCE(is_published, TRUE) = TRUE AND COALESCE(is_public, TRUE) = TRUE);

-- Authenticated users can submit templates.
DROP POLICY IF EXISTS "Authenticated insert own templates" ON public.community_templates;
CREATE POLICY "Authenticated insert own templates"
  ON public.community_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owners can update / delete their own templates.
DROP POLICY IF EXISTS "Owner update own templates" ON public.community_templates;
CREATE POLICY "Owner update own templates"
  ON public.community_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner delete own templates" ON public.community_templates;
CREATE POLICY "Owner delete own templates"
  ON public.community_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-generate slug from title on insert when not supplied.
CREATE OR REPLACE FUNCTION public.community_templates_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  suffix INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := LOWER(REGEXP_REPLACE(COALESCE(NEW.title, NEW.id::text), '[^a-zA-Z0-9]+', '-', 'g'));
    base := TRIM(BOTH '-' FROM base);
    IF base = '' THEN base := NEW.id::text; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.community_templates WHERE slug = candidate AND id <> NEW.id) LOOP
      suffix := suffix + 1;
      candidate := base || '-' || suffix;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_templates_slug ON public.community_templates;
CREATE TRIGGER trg_community_templates_slug
  BEFORE INSERT OR UPDATE ON public.community_templates
  FOR EACH ROW EXECUTE FUNCTION public.community_templates_set_slug();

-- View counter (anon-callable via security definer to avoid leaking write perms).
CREATE OR REPLACE FUNCTION public.increment_template_views(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_templates
     SET views = COALESCE(views, 0) + 1
   WHERE slug = p_slug
     AND COALESCE(is_published, TRUE) = TRUE
     AND COALESCE(is_public, TRUE) = TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_template_views(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_template_views(TEXT) TO anon, authenticated;

COMMENT ON TABLE public.community_templates IS
  'Public lesson templates contributed by teachers — Sprint 5.1 (SEO + viral growth).';
