ALTER TABLE public.theology_references DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.theology_references DROP COLUMN IF EXISTS content_embedding;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS embedding extensions.vector(768);
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS content_embedding extensions.vector(768);
CREATE INDEX IF NOT EXISTS idx_theology_embedding ON public.theology_references USING hnsw (embedding extensions.vector_cosine_ops);