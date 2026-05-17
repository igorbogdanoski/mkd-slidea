-- 3.7 Custom branding (Pro): adds brand_font column to events.
-- Safe to re-run; uses IF NOT EXISTS.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS brand_font TEXT;

COMMENT ON COLUMN public.events.brand_font IS
  'Brand font family stack used in Presenter (system fonts only, no external requests).';

-- Grant anon SELECT on brand_font (Phase B revoked SELECT * and re-granted
-- specific columns — brand_font must be in that list too).
GRANT SELECT (brand_font) ON public.events TO anon;
