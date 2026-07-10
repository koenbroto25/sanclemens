-- Migration: Create RAG Core Schema (consolidated chunk tables, refined ai_knowledge_base, RLS, functions)
-- Created: 29 June 2026
-- Purpose: Implement the full AI RAG system schema as per ai_implementation_plan_v6.md and rag_ai.md

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
SET search_path = public, extensions;

-- ============================================================
-- 1. ALTER TABLE: public.ai_knowledge_base
--    - Rename/add embedding column
--    - Add chunk_table_ref, chunk_id, allowed_cross_domains, etc.
--    - Add chk_entry_type constraint
-- ============================================================

-- Drop existing RLS policies on ai_knowledge_base temporarily for schema changes
DROP POLICY IF EXISTS "Admin can insert" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Admin can update" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Anyone can read approved data" ON public.ai_knowledge_base;

-- Add or rename columns as per detailed plan
ALTER TABLE public.ai_knowledge_base
    RENAME COLUMN content_embedding TO embedding; -- Rename existing embedding column

ALTER TABLE public.ai_knowledge_base
    ADD COLUMN IF NOT EXISTS question_variations TEXT[],
    ADD COLUMN IF NOT EXISTS chunk_table_ref TEXT CHECK (chunk_table_ref IN (
                                    'theological_chunks',
                                    'operational_chunks',
                                    'structured_entity_chunks',
                                    'internal_admin_chunks'
                                )),
    ADD COLUMN IF NOT EXISTS chunk_id UUID,
    ADD COLUMN IF NOT EXISTS allowed_cross_domains TEXT[],
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS fetch_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS nama_dokumen TEXT,
    ADD COLUMN IF NOT EXISTS penulis TEXT,
    ADD COLUMN IF NOT EXISTS theology_topic TEXT[],
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add the chk_entry_type constraint
ALTER TABLE public.ai_knowledge_base
    ADD CONSTRAINT chk_entry_type CHECK (
        (answer_text IS NOT NULL AND chunk_table_ref IS NULL AND chunk_id IS NULL)
        OR
        (answer_text IS NULL AND chunk_table_ref IS NOT NULL AND chunk_id IS NOT NULL)
    );

-- Drop unused columns from previous migration if they conflict with the plan
ALTER TABLE public.ai_knowledge_base
    DROP COLUMN IF EXISTS document_type,
    DROP COLUMN IF EXISTS content_for_rag;


-- ============================================================
-- 2. CREATE TABLE: public.theological_chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.theological_chunks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_for_rag     TEXT NOT NULL,
    content_embedding   extensions.vector(768),
    chunk_source_domain TEXT NOT NULL DEFAULT 'theology',
    source_document     TEXT,
    source_reference    TEXT,
    chapter_context     TEXT,
    embedding_outdated  BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CREATE TABLE: public.operational_chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operational_chunks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_for_rag     TEXT NOT NULL,
    content_embedding   extensions.vector(768),
    chunk_source_domain TEXT NOT NULL,
    source_entity_id    UUID,
    source_entity_table TEXT,
    event_date          DATE,
    expires_at          TIMESTAMPTZ,
    embedding_outdated  BOOLEAN DEFAULT FALSE,
    needs_human_review  BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CREATE TABLE: public.structured_entity_chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.structured_entity_chunks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_for_rag     TEXT NOT NULL,
    content_embedding   extensions.vector(768),
    chunk_source_domain TEXT NOT NULL,
    source_entity_id    UUID NOT NULL,
    source_entity_table TEXT NOT NULL,
    entity_location     TEXT,
    entity_category     TEXT,
    entity_active       BOOLEAN DEFAULT TRUE,
    expires_at          TIMESTAMPTZ,
    embedding_outdated  BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. CREATE TABLE: public.internal_admin_chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.internal_admin_chunks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_for_rag     TEXT NOT NULL,
    content_embedding   extensions.vector(768),
    chunk_source_domain TEXT NOT NULL,
    source_entity_id    UUID,
    source_entity_table TEXT,
    policy_version      TEXT,
    embedding_outdated  BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CREATE TABLE: public.theology_prayer_guides (missing from previous list)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.theology_prayer_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_name TEXT NOT NULL,
    steps_json JSONB NOT NULL,
    target_mode TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. CREATE HNSW Indexes for Chunk Tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_theological_chunks_embedding
    ON public.theological_chunks
    USING hnsw (content_embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_operational_chunks_embedding
    ON public.operational_chunks
    USING hnsw (content_embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_structured_entity_chunks_embedding
    ON public.structured_entity_chunks
    USING hnsw (content_embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_internal_admin_chunks_embedding
    ON public.internal_admin_chunks
    USING hnsw (content_embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ============================================================
-- 8. CREATE HELPER FUNCTION: get_current_user_access_layer()
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_user_access_layer()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_layer INTEGER;
BEGIN
    SELECT access_layer INTO v_layer
    FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(v_layer, 0);
END; $$;

-- ============================================================
-- 9. REFINE RLS Policies for public.ai_knowledge_base
-- ============================================================
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: Read public approved entries
CREATE POLICY "Read public approved entries"
    ON public.ai_knowledge_base FOR SELECT
    USING (status = 'approved' AND access_level_min = 0);

-- Policy: Read restricted entries by access layer
CREATE POLICY "Read restricted entries by access layer"
    ON public.ai_knowledge_base FOR SELECT
    USING (
        status = 'approved'
        AND access_level_min > 0
        AND get_current_user_access_layer() >= access_level_min
    );

-- Policy: Admin can write (access_layer >= 9)
CREATE POLICY "Admin can write"
    ON public.ai_knowledge_base FOR ALL
    USING (get_current_user_access_layer() >= 9)
    WITH CHECK (get_current_user_access_layer() >= 9);

-- ============================================================
-- 10. APPLY "Service role only" RLS Policies for Chunk Tables
-- ============================================================
ALTER TABLE public.theological_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.theological_chunks FOR ALL
    USING (auth.role() = 'service_role');

ALTER TABLE public.operational_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.operational_chunks FOR ALL
    USING (auth.role() = 'service_role');

ALTER TABLE public.structured_entity_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.structured_entity_chunks FOR ALL
    USING (auth.role() = 'service_role');

ALTER TABLE public.internal_admin_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.internal_admin_chunks FOR ALL
    USING (auth.role() = 'service_role');

-- Apply Service role only for theology_prayers and theology_prayer_guides
ALTER TABLE public.theology_prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.theology_prayers FOR ALL
    USING (auth.role() = 'service_role');

ALTER TABLE public.theology_prayer_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.theology_prayer_guides FOR ALL
    USING (auth.role() = 'service_role');