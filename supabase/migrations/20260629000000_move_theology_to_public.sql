-- Migration: Move theology tables to public schema
-- Purpose: Simplify access via Supabase client (no custom schema needed)

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Move theology.references to public.theology_references
-- theology.references already exists as public.theology_references from earlier migrations
-- ALTER TABLE IF EXISTS theology.references SET SCHEMA public;
-- ALTER TABLE IF EXISTS public.references RENAME TO theology_references;

-- Move theology.prayers to public.theology_prayers
ALTER TABLE IF EXISTS theology.prayers SET SCHEMA public;
ALTER TABLE IF EXISTS public.prayers RENAME TO theology_prayers;

-- Move theology.prayer_guides to public.theology_prayer_guides
ALTER TABLE IF EXISTS theology.prayer_guides SET SCHEMA public;
ALTER TABLE IF EXISTS public.prayer_guides RENAME TO theology_prayer_guides;

-- Update indexes
DROP INDEX IF EXISTS theology.idx_theology_references_document_code;
DROP INDEX IF EXISTS theology.idx_theology_references_embedding;

CREATE INDEX IF NOT EXISTS idx_theology_references_document_code ON public.theology_references(document_code);
SET search_path = public, extensions;
-- Skipped: content_embedding is vector(3072), exceeds 2000 dim limit for both hnsw and ivfflat
-- Vector search on theology_references is done via ai_knowledge_base (vector(768)) instead
DROP INDEX IF EXISTS idx_theology_references_embedding;
DROP INDEX IF EXISTS idx_theology_references_embedding_ivf;

-- RLS
ALTER TABLE public.theology_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theology_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theology_prayer_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS theology_references_read ON public.theology_references;
CREATE POLICY theology_references_read ON public.theology_references FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS theology_prayers_read ON public.theology_prayers;
CREATE POLICY theology_prayers_read ON public.theology_prayers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS theology_prayer_guides_read ON public.theology_prayer_guides;
CREATE POLICY theology_prayer_guides_read ON public.theology_prayer_guides FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS theology_references_write ON public.theology_references;
CREATE POLICY theology_references_write ON public.theology_references FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
);

DROP POLICY IF EXISTS theology_prayers_write ON public.theology_prayers;
CREATE POLICY theology_prayers_write ON public.theology_prayers FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
);

DROP POLICY IF EXISTS theology_prayer_guides_write ON public.theology_prayer_guides;
CREATE POLICY theology_prayer_guides_write ON public.theology_prayer_guides FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
);

-- Grant service_role access
GRANT ALL ON public.theology_references TO service_role;
GRANT ALL ON public.theology_prayers TO service_role;
GRANT ALL ON public.theology_prayer_guides TO service_role;
