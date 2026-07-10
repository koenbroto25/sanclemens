ALTER TABLE public.theology_references DROP COLUMN IF EXISTS content_embedding;
ALTER TABLE public.theology_references DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS content_embedding extensions.vector(3072);
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS embedding extensions.vector(3072);