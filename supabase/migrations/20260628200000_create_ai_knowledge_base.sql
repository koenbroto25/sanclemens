CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
SET search_path = public, extensions;

-- ============================================================
-- MIGRATION: Create public.ai_knowledge_base
-- VERSI: 1.0
-- TANGGAL: 28 Juni 2026
-- DESKRIPSI: Single source of truth untuk semua RAG data
-- Mendukung dynamic filtering oleh Q&A Orchestrator multi-bot
-- ============================================================

-- ============================================================
-- 1. CREATE TABLE: public.ai_knowledge_base
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
    -- === IDENTIFIERS ===
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_index INTEGER NOT NULL,
    document_code TEXT NOT NULL,
    document_type TEXT DEFAULT 'theology',
    -- Nilai: theology, catechism_module, public_info, business_profile,
    --        charity_service, scraped_web
    
    -- === CONTENT ===
    content_for_rag TEXT NOT NULL,              -- Teks chunk
    content_embedding extensions.vector(768),              -- Gemini embedding 768 dimensi
    answer_text TEXT,                           -- Jawaban pre-defined (NULL untuk RAG-only)
    question_variations TEXT[],                 -- Array variasi pertanyaan
    
    -- === DYNAMIC FILTERING METADATA (Kunci Orchestrator) ===
    domain TEXT NOT NULL DEFAULT 'theology',
    -- Nilai: public_info, theology, catechism_module, business_work,
    --        charity_social, user_profile, admin_parish, admin_lingkungan,
    --        admin_documents, system_guidance, liturgical_data, ai_feedback
    
    bot_access TEXT[] NOT NULL DEFAULT '{}',
    -- Contoh: ARRAY['Bot 8 Learn Catholic', 'Bot 3 Companion Rohani']
    
    access_level_min INTEGER DEFAULT 0,
    -- 0=public, 2=umat_aktif, 4=KL, 5+=DPP, 9=Pastor, 10=SuperAdmin
    
    question_type_classification TEXT,
    -- Contoh: dogmatic_explanation, moral_guidance, business_search_query,
    --         job_search_query, family_data_query, document_procedure_query,
    --         saint_of_the_day_query, prayer_recommendation_query,
    --         catechism_lesson, skill_exchange_request, charity_request_query
    
    -- === SUMBER REFERENSI ===
    source_reference TEXT,                      -- e.g., "KGK §123", "Kej 1:1", "Kan. 7"
    source_url TEXT,                            -- URL asli jika dari web/scrape
    fetch_date TIMESTAMPTZ,                     -- Tanggal fetch untuk data scrape
    
    -- === METADATA TAMBAHAN (dari theology_references) ===
    nama_dokumen TEXT,                          -- e.g., "Katekismus Gereja Katolik"
    penulis TEXT,                               -- e.g., "Gereja Katolik"
    kategori TEXT,                              -- e.g., "katekismus", "kitab_suci"
    theology_topic TEXT[],                      -- e.g., ["trinity", "eucharist"]
    
    -- === QUALITY & LIFECYCLE ===
    chunk_quality_score INTEGER DEFAULT 5 
        CHECK (chunk_quality_score >= 1 AND chunk_quality_score <= 5),
    auto_generated_summary TEXT,                -- Ringkasan singkat untuk re-ranking
    status TEXT DEFAULT 'approved' 
        CHECK (status IN ('approved', 'draft', 'needs_review', 'deprecated', 'scrape_pending_review')),
    
    -- === AUDIT ===
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- === CONSTRAINTS ===
    CONSTRAINT ai_knowledge_base_doc_chunk_unique UNIQUE (document_code, chunk_index)
);

-- ============================================================
-- 2. CREATE INDEXES
-- ============================================================

-- HNSW index untuk vector search (WAJIB untuk performa)
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_embedding 
    ON public.ai_knowledge_base 
    USING hnsw (content_embedding extensions.vector_cosine_ops);

-- B-tree indexes untuk filtering metadata
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_domain 
    ON public.ai_knowledge_base USING btree (domain);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_document_code 
    ON public.ai_knowledge_base USING btree (document_code);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_bot_access 
    ON public.ai_knowledge_base USING gin (bot_access);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_access_level 
    ON public.ai_knowledge_base USING btree (access_level_min);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_status 
    ON public.ai_knowledge_base USING btree (status);

-- Composite index untuk query umum Orchestrator
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_domain_bot 
    ON public.ai_knowledge_base USING btree (domain, access_level_min)
    WHERE status = 'approved';

-- Index untuk search by question_type
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_question_type 
    ON public.ai_knowledge_base USING btree (question_type_classification);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa baca data yang sudah approved
CREATE POLICY "Anyone can read approved data"
    ON public.ai_knowledge_base
    FOR SELECT
    USING (status = 'approved');

-- Policy: Hanya admin/Super Admin (access_layer >= 9) yang bisa insert
CREATE POLICY "Admin can insert"
    ON public.ai_knowledge_base
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE access_layer >= 9
        )
    );

-- Policy: Hanya admin/Super Admin yang bisa update
CREATE POLICY "Admin can update"
    ON public.ai_knowledge_base
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE access_layer >= 9
        )
    );

-- ============================================================
-- 4. TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_ai_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_knowledge_base_updated_at
    BEFORE UPDATE ON public.ai_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_knowledge_base_updated_at();