-- Migration: Refactor AI Schema to v6.0
-- Created: 29 June 2026
-- Purpose: Implement the v6.0 RAG architecture changes, including metadata/content separation,
--          new qa_pairs and pastoral_sessions tables, and updated functions/RLS.

SET search_path = public, extensions;

-- ============================================================
-- 1. DROP OBSOLETE COLUMNS AND CONSTRAINTS from ai_knowledge_base
--    AND ADD MISSING content_type COLUMN
-- ============================================================
ALTER TABLE public.ai_knowledge_base
    DROP COLUMN IF EXISTS question_variations,
    DROP COLUMN IF EXISTS answer_text,
    DROP COLUMN IF EXISTS embedding,
    DROP COLUMN IF EXISTS document_type;

ALTER TABLE public.ai_knowledge_base
    DROP CONSTRAINT IF EXISTS chk_entry_type;

-- Add the missing content_type column, set default, then make it NOT NULL
ALTER TABLE public.ai_knowledge_base
    ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Update existing rows before making it NOT NULL. Assume existing data was 'rag_chunk'.
UPDATE public.ai_knowledge_base
    SET content_type = 'rag_chunk' WHERE content_type IS NULL;

ALTER TABLE public.ai_knowledge_base
    ALTER COLUMN content_type SET NOT NULL,
    ADD CONSTRAINT chk_content_type_enum CHECK (content_type IN ('qa_pair', 'rag_chunk'));


-- ============================================================
-- 2. CREATE TABLE: public.qa_pairs
--    Content store for all direct Q&A.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qa_pairs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_variations     TEXT[] NOT NULL,
    answer_text             TEXT NOT NULL,
    embedding               VECTOR(768),
    is_approved             BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at             TIMESTAMPTZ,
    domain                  TEXT NOT NULL,
    bot_access              TEXT[] NOT NULL DEFAULT '{}',
    access_level_min        INTEGER NOT NULL DEFAULT 0,
    embedding_outdated      BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: mark embedding outdated when qa_pairs content changes
CREATE OR REPLACE FUNCTION mark_qa_pair_embedding_outdated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.question_variations IS DISTINCT FROM NEW.question_variations
       OR OLD.answer_text IS DISTINCT FROM NEW.answer_text THEN
        NEW.embedding_outdated = TRUE;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER trg_qa_pair_content_changed
BEFORE UPDATE ON public.qa_pairs
FOR EACH ROW EXECUTE FUNCTION mark_qa_pair_embedding_outdated();

-- HNSW Index for similarity search on qa_pairs
CREATE INDEX IF NOT EXISTS idx_qa_pairs_embedding
    ON public.qa_pairs
    USING hnsw (embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- B-tree indexes for filtering
CREATE INDEX IF NOT EXISTS idx_qa_pairs_domain
    ON public.qa_pairs USING btree (domain);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_bot_access
    ON public.qa_pairs USING gin (bot_access);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_approved
    ON public.qa_pairs USING btree (is_approved)
    WHERE embedding_outdated = FALSE;

-- RLS: Access via service_role ONLY
ALTER TABLE public.qa_pairs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON public.qa_pairs; -- Drop existing if any
CREATE POLICY "Service role only"
    ON public.qa_pairs FOR ALL
    USING (auth.role() = 'service_role');


-- ============================================================
-- 3. CREATE TABLE: public.pastoral_sessions
--    Persistent summary for Bot 3.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pastoral_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_session_date       TIMESTAMPTZ,
    key_themes              TEXT[],
    prayer_requests         TEXT[],
    faith_journey_stage     TEXT,
    language_preference     TEXT DEFAULT 'formal',
    total_sessions          INTEGER DEFAULT 0,
    last_turn_count         INTEGER DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pastoral_sessions_user_id
    ON public.pastoral_sessions USING btree (user_id);

-- RLS: Service role only
ALTER TABLE public.pastoral_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON public.pastoral_sessions; -- Drop existing if any
CREATE POLICY "Service role only"
    ON public.pastoral_sessions FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger: update updated_at for pastoral_sessions
CREATE OR REPLACE FUNCTION update_pastoral_sessions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE TRIGGER trg_pastoral_sessions_updated_at
BEFORE UPDATE ON public.pastoral_sessions
FOR EACH ROW EXECUTE FUNCTION update_pastoral_sessions_updated_at();

-- ============================================================
-- 4. ALTER TABLE: public.ai_knowledge_base (add qa_pair_id and update constraint)
-- ============================================================
ALTER TABLE public.ai_knowledge_base
    ADD COLUMN IF NOT EXISTS qa_pair_id UUID REFERENCES public.qa_pairs(id) ON DELETE CASCADE;

-- Drop existing unique constraint on chunk_table_ref, chunk_id to allow modification
ALTER TABLE public.ai_knowledge_base DROP CONSTRAINT IF EXISTS uq_chunk_pointer;
ALTER TABLE public.ai_knowledge_base DROP CONSTRAINT IF EXISTS uq_qa_pair;

-- Re-add/update the complex CHECK constraint and new unique constraints
ALTER TABLE public.ai_knowledge_base
    ADD CONSTRAINT chk_content_type_pointer CHECK (
        (content_type = 'qa_pair'   AND qa_pair_id IS NOT NULL AND chunk_table_ref IS NULL AND chunk_id IS NULL)
        OR
        (content_type = 'rag_chunk' AND qa_pair_id IS NULL     AND chunk_table_ref IS NOT NULL AND chunk_id IS NOT NULL)
    );

-- Add new unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS uq_akb_qa_pair ON public.ai_knowledge_base (qa_pair_id) WHERE qa_pair_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_akb_chunk_pointer ON public.ai_knowledge_base (chunk_table_ref, chunk_id) WHERE chunk_table_ref IS NOT NULL AND chunk_id IS NOT NULL;


-- ============================================================
-- 5. ALTER TABLE: public.ai_interaction_logs (add new columns)
-- ============================================================
ALTER TABLE public.ai_interaction_logs
    ADD COLUMN IF NOT EXISTS retrieval_path        TEXT,
    ADD COLUMN IF NOT EXISTS confidence_score      FLOAT,
    ADD COLUMN IF NOT EXISTS was_redirected        BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS was_refused           BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS injection_attempt     BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS bot_served            TEXT,
    ADD COLUMN IF NOT EXISTS domain_matched        TEXT,
    ADD COLUMN IF NOT EXISTS original_query        TEXT,
    ADD COLUMN IF NOT EXISTS formalized_query      TEXT,
    ADD COLUMN IF NOT EXISTS retrieval_context     JSONB;

-- ============================================================
-- 6. UPDATE FUNCTIONS: search_direct_qa() and search_rag_chunks()
-- ============================================================

-- Drop functions before recreating with new signatures
DROP FUNCTION IF EXISTS search_direct_qa(VECTOR(768), TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_rag_chunks(VECTOR(768), TEXT, TEXT, INTEGER, INTEGER);

-- search_direct_qa()
CREATE OR REPLACE FUNCTION search_direct_qa(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 5
)
RETURNS TABLE (
    qa_pair_id                  UUID,
    answer_text                 TEXT,
    source_reference            TEXT,
    similarity_score            FLOAT,
    chunk_quality_score         INTEGER,
    question_type_classification TEXT,
    is_approved                 BOOLEAN
)
LANGUAGE sql STABLE AS $$
    SELECT
        qp.id                                           AS qa_pair_id,
        qp.answer_text,
        akb.source_reference,
        1 - (qp.embedding <=> p_query_embedding)        AS similarity_score,
        akb.chunk_quality_score,
        akb.question_type_classification,
        qp.is_approved
    FROM public.qa_pairs qp
    JOIN public.ai_knowledge_base akb ON akb.qa_pair_id = qp.id
    WHERE akb.domain            = p_domain
      AND akb.bot_access        @> ARRAY[p_bot_access]
      AND akb.access_level_min  <= p_user_access_level
      AND akb.status            = 'approved'
      AND akb.content_type      = 'qa_pair'
      AND qp.embedding          IS NOT NULL
      AND qp.embedding_outdated = FALSE
    ORDER BY
        qp.is_approved DESC,                            -- Approved Q&A muncul lebih dulu
        qp.embedding <=> p_query_embedding              -- Lalu sort by similarity
    LIMIT p_limit;
$$;

-- search_rag_chunks()
CREATE OR REPLACE FUNCTION search_rag_chunks(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 20
)
RETURNS TABLE (
    chunk_id                    UUID,
    content_for_rag             TEXT,
    source_reference            TEXT,
    similarity_score            FLOAT,
    domain                      TEXT,
    chunk_table                 TEXT,
    chunk_quality_score         INTEGER,
    question_type_classification TEXT
)
LANGUAGE sql STABLE AS $$
    SELECT * FROM (
    SELECT tc.id, tc.content_for_rag, akb.source_reference,
           1 - (tc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'theological_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.theological_chunks tc ON tc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.content_type = 'rag_chunk' AND akb.chunk_table_ref = 'theological_chunks'
      AND tc.embedding_outdated = FALSE

    UNION ALL

    SELECT oc.id, oc.content_for_rag, akb.source_reference,
           1 - (oc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'operational_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.operational_chunks oc ON oc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.content_type = 'rag_chunk' AND akb.chunk_table_ref = 'operational_chunks'
      AND oc.embedding_outdated = FALSE
      AND (oc.expires_at IS NULL OR oc.expires_at > NOW())

    UNION ALL

    SELECT sc.id, sc.content_for_rag, akb.source_reference,
           1 - (sc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'structured_entity_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.structured_entity_chunks sc ON sc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.content_type = 'rag_chunk' AND akb.chunk_table_ref = 'structured_entity_chunks'
      AND sc.embedding_outdated = FALSE AND sc.entity_active = TRUE
      AND (sc.expires_at IS NULL OR sc.expires_at > NOW())

    UNION ALL

    SELECT ia.id, ia.content_for_rag, akb.source_reference,
           1 - (ia.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'internal_admin_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.internal_admin_chunks ia ON ia.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.content_type = 'rag_chunk' AND akb.chunk_table_ref = 'internal_admin_chunks'
      AND ia.embedding_outdated = FALSE
    ) AS sub
    ORDER BY similarity_score DESC
    LIMIT p_limit;
$$;


-- ============================================================
-- 7. DROP OBSOLETE TABLES (if they exist and are replaced)
-- ============================================================
DROP TABLE IF EXISTS public.theology_prayer_guides CASCADE;