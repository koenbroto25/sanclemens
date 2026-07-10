ALTER TABLE public.cache_liturgi
  ADD COLUMN IF NOT EXISTS bacaan_teks JSONB DEFAULT '{}'::jsonb;