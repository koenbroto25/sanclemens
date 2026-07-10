-- Migration: Create RAG Retrieval Functions
-- Created: 29 June 2026
-- Purpose: Implement search_direct_qa() and search_rag_chunks() SQL functions for the AI RAG system.

SET search_path = public, extensions;

-- ============================================================
-- 1. FUNCTION: search_direct_qa() — Q&A Langsung (Prioritas #1)
-- ============================================================
CREATE OR REPLACE FUNCTION search_direct_qa(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 5
)
RETURNS TABLE (
    entry_id                    UUID,
    answer_text                 TEXT,
    source_reference            TEXT,
    similarity_score            FLOAT,
    chunk_quality_score         INTEGER,
    question_type_classification TEXT
)
LANGUAGE sql STABLE AS $$
    SELECT
        akb.id, akb.answer_text, akb.source_reference,
        1 - (akb.embedding <=> p_query_embedding) AS similarity_score,
        akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    WHERE akb.domain           = p_domain
      AND akb.bot_access       @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level
      AND akb.status           = 'approved'
      AND akb.answer_text      IS NOT NULL
      AND akb.chunk_table_ref  IS NULL
      AND akb.embedding        IS NOT NULL
    ORDER BY akb.embedding <=> p_query_embedding
    LIMIT p_limit;
$$;

-- ============================================================
-- 2. FUNCTION: search_rag_chunks() — RAG dari 4 Tabel Chunk (Prioritas #2)
-- ============================================================
CREATE OR REPLACE FUNCTION search_rag_chunks(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 20
)
RETURNS TABLE (
    chunk_id UUID, content_for_rag TEXT, source_reference TEXT,
    similarity_score FLOAT, domain TEXT, chunk_table TEXT,
    chunk_quality_score INTEGER, question_type_classification TEXT
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
      AND akb.chunk_table_ref = 'theological_chunks' AND tc.embedding_outdated = FALSE

    UNION ALL

    SELECT oc.id, oc.content_for_rag, akb.source_reference,
           1 - (oc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'operational_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.operational_chunks oc ON oc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'operational_chunks' AND oc.embedding_outdated = FALSE
      AND (oc.expires_at IS NULL OR oc.expires_at > NOW())

    UNION ALL

    SELECT sc.id, sc.content_for_rag, akb.source_reference,
           1 - (sc.content_embedding <=> p_query_embedding) AS similarity_score, akb.domain,
           'structured_entity_chunks'::TEXT AS chunk_table, akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.structured_entity_chunks sc ON sc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'structured_entity_chunks'
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
      AND akb.chunk_table_ref = 'internal_admin_chunks' AND ia.embedding_outdated = FALSE
    ) AS sub
    ORDER BY similarity_score DESC
    LIMIT p_limit;
$$;