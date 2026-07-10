-- Migration: AI Schema - Theology Knowledge Base
-- Created: 19 June 2026
-- Purpose: Support AI Knowledge Retriever for Bot 1-8

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
SET search_path = public, extensions;

-- Create theology schema
CREATE SCHEMA IF NOT EXISTS theology;

-- Table: theology.references
CREATE TABLE IF NOT EXISTS theology.references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code TEXT NOT NULL,        -- 'KGK', 'KHK', 'VATII', 'SC', 'KALENDER', etc
    title TEXT NOT NULL,
    paragraph_number TEXT,
    content_text TEXT NOT NULL,
    content_embedding VECTOR(1536),     -- untuk semantic search (via pgvector)
    source_url TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_theology_references_document_code ON theology.references(document_code);
CREATE INDEX IF NOT EXISTS idx_theology_references_embedding ON theology.references USING hnsw (content_embedding vector_cosine_ops);

-- Table: theology.prayers
CREATE TABLE IF NOT EXISTS theology.prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'pagi','malam','sebelum_makan','sesudah_makan','rosario','examen','other'
    text_id TEXT NOT NULL,              -- teks dalam Bahasa Indonesia
    text_la TEXT,                       -- teks Latin (jika ada)
    occasion TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: theology.prayer_guides
CREATE TABLE IF NOT EXISTS theology.prayer_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_name TEXT NOT NULL,
    steps_json JSONB NOT NULL,          -- langkah-langkah panduan
    target_mode TEXT,                   -- mode Bot 3 yang relevan: 'examen','rosario','lamentasi','discernment'
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE theology.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE theology.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE theology.prayer_guides ENABLE ROW LEVEL SECURITY;

-- Public read for authenticated users
DROP POLICY IF EXISTS theology_references_read ON theology.references;
CREATE POLICY theology_references_read ON theology.references
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS theology_prayers_read ON theology.prayers;
CREATE POLICY theology_prayers_read ON theology.prayers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS theology_prayer_guides_read ON theology.prayer_guides;
CREATE POLICY theology_prayer_guides_read ON theology.prayer_guides
    FOR SELECT TO authenticated USING (true);

-- Admin write only (access_layer >= 6)
DROP POLICY IF EXISTS theology_references_write ON theology.references;
CREATE POLICY theology_references_write ON theology.references
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

DROP POLICY IF EXISTS theology_prayers_write ON theology.prayers;
CREATE POLICY theology_prayers_write ON theology.prayers
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

DROP POLICY IF EXISTS theology_prayer_guides_write ON theology.prayer_guides;
CREATE POLICY theology_prayer_guides_write ON theology.prayer_guides
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

-- Comment
COMMENT ON SCHEMA theology IS 'Theological knowledge base for AI bots - contains official Catholic documents, prayers, and guides';