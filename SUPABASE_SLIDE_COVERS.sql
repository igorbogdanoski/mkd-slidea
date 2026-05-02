-- Sprint 7.B — Cover/illustration per activity
-- Run in Supabase SQL editor.

ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Optional metadata for attribution (Openverse / Pollinations / upload)
ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS cover_meta JSONB DEFAULT '{}'::jsonb;

-- Storage bucket for user-uploaded illustrations.
INSERT INTO storage.buckets (id, name, public)
VALUES ('slide-images', 'slide-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS: authenticated users may upload to their own folder, public read.
DO $$ BEGIN
  CREATE POLICY "slide-images public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'slide-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "slide-images authenticated upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'slide-images'
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "slide-images owner delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'slide-images'
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
