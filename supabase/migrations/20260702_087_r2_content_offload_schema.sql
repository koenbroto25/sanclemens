-- Migration: R2 Content Offload Schema Changes
-- Created: 02 July 2026
-- Purpose: Add R2 key columns to tables, update retrieval functions for Cloudflare R2 content offload.

SET search_path = public, extensions;

-- ============================================================
-- 1. ADD NEW COLUMNS TO qa_pairs
-- ============================================================
ALTER TABLE public.qa_pairs
    ADD COLUMN IF NOT EXISTS answer_r2_key TEXT,
    ADD COLUMN IF NOT EXISTS answer_preview TEXT;

-- ============================================================
-- 2. ADD NEW COLUMNS TO CHUNK TABLES
-- ============================================================
ALTER TABLE public.theological_chunks
    ADD COLUMN IF NOT EXISTS content_r2_key TEXT,
    ADD COLUMN IF NOT EXISTS content_preview TEXT;

ALTER TABLE public.operational_chunks
    ADD COLUMN IF NOT EXISTS content_r2_key TEXT,
    ADD COLUMN IF NOT EXISTS content_preview TEXT;

ALTER TABLE public.structured_entity_chunks
    ADD COLUMN IF NOT EXISTS content_r2_key TEXT,
    ADD COLUMN IF NOT EXISTS content_preview TEXT;

ALTER TABLE public.internal_admin_chunks
    ADD COLUMN IF NOT EXISTS content_r2_key TEXT,
    ADD COLUMN IF NOT EXISTS content_preview TEXT;

-- ============================================================
-- 3. UPDATE search_direct_qa() — Return r2_key & preview instead of full text
-- ============================================================
-- Need to drop first because return type has changed
DROP FUNCTION IF EXISTS search_direct_qa(VECTOR(768), TEXT, TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_direct_qa(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 5
)
RETURNS TABLE (
    entry_id                    UUID,
    answer_r2_key               TEXT,
    answer_preview              TEXT,
    source_reference            TEXT,
    similarity_score            FLOAT,
    chunk_quality_score         INTEGER,
    question_type_classification TEXT
)
LANGUAGE sql STABLE AS $$
    SELECT
        akb.id, qp.answer_r2_key, qp.answer_preview, akb.source_reference,
        1 - (qp.embedding <=> p_query_embedding) AS similarity_score,
        akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.qa_pairs qp ON qp.id = akb.qa_pair_id
    WHERE akb.domain           = p_domain
      AND akb.bot_access       @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level
      AND akb.status           = 'approved'
      AND qp.answer_r2_key     IS NOT NULL
      AND akb.chunk_table_ref  IS NULL
      AND qp.embedding         IS NOT NULL
    ORDER BY qp.embedding <=> p_query_embedding
    LIMIT p_limit;
$$;

-- ============================================================
-- 4. UPDATE search_rag_chunks() — Return r2_key & preview instead of full text
-- ============================================================
-- Need to drop first because return type has changed
DROP FUNCTION IF EXISTS search_rag_chunks(VECTOR(768), TEXT, TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_rag_chunks(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 20
)
RETURNS TABLE (
    chunk_id UUID, 
    content_r2_key TEXT, 
    content_preview TEXT, 
    source_reference TEXT,
    similarity_score FLOAT, 
    domain TEXT, 
    chunk_table TEXT,
    chunk_quality_score INTEGER, 
    question_type_classification TEXT
)
LANGUAGE sql STABLE AS $$
    SELECT * FROM (
    SELECT tc.id, tc.content_r2_key, tc.content_preview, akb.source_reference,
           1 - (tc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'theological_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.theological_chunks tc ON tc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'theological_chunks' AND tc.embedding_outdated = FALSE
      AND tc.content_r2_key IS NOT NULL

    UNION ALL

    SELECT oc.id, oc.content_r2_key, oc.content_preview, akb.source_reference,
           1 - (oc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'operational_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.operational_chunks oc ON oc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'operational_chunks' AND oc.embedding_outdated = FALSE
      AND oc.content_r2_key IS NOT NULL
      AND (oc.expires_at IS NULL OR oc.expires_at > NOW())

    UNION ALL

    SELECT sc.id, sc.content_r2_key, sc.content_preview, akb.source_reference,
           1 - (sc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'structured_entity_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.structured_entity_chunks sc ON sc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'structured_entity_chunks'
      AND sc.embedding_outdated = FALSE AND sc.entity_active = TRUE
      AND sc.content_r2_key IS NOT NULL
      AND (sc.expires_at IS NULL OR sc.expires_at > NOW())

    UNION ALL

    SELECT ia.id, ia.content_r2_key, ia.content_preview, akb.source_reference,
           1 - (ia.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'internal_admin_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.internal_admin_chunks ia ON ia.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'internal_admin_chunks' AND ia.embedding_outdated = FALSE
      AND ia.content_r2_key IS NOT NULL
    ) AS sub
    ORDER BY similarity_score DESC
    LIMIT p_limit;
$$;