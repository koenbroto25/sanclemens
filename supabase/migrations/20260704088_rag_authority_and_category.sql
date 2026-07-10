-- Migration: RAG Authority Level & Category Code Columns
-- Created: 04 July 2026
-- Purpose: Add category_code, authority_level to theological_chunks and qa_pairs
-- Also add pillar & source_types to theological_chunks for catechism module support
-- Reference: rag_ai_r2_72.md §4.1, §4.2, §5.2, §15.5

SET search_path = public, extensions;

-- ============================================================
-- 1. ADD CATEGORY COLUMNS TO theological_chunks
-- ============================================================
ALTER TABLE public.theological_chunks
    ADD COLUMN IF NOT EXISTS category_code    TEXT,
    ADD COLUMN IF NOT EXISTS authority_level   TEXT,
    ADD COLUMN IF NOT EXISTS pillar            TEXT,
    ADD COLUMN IF NOT EXISTS source_types      TEXT[];

COMMENT ON COLUMN public.theological_chunks.category_code IS '1-9 sesuai taksonomi otoritas teologis (§15.5 rag_ai_r2_72.md): 1=Kitab Suci, 2=Hukum Kanonik, 3=Konsili, 4=Dokumen Kepausan, 5=Kuria Roma, 6=KGK, 7a=Patristik/Skolastik, 7b=Spiritualitas, 8=Liturgi/Devosi, 9=Katekese Modul';
COMMENT ON COLUMN public.theological_chunks.authority_level IS 'highest|high|medium|reference|devotional — untuk soft-boost saat retrieval (§5.2)';
COMMENT ON COLUMN public.theological_chunks.pillar IS 'Khusus category_code=9: 00_pengantar_umum, 01_credo, 02_liturgi_sakramen, 03_moral, 04_doa, 05_asg, 06_mariologi';
COMMENT ON COLUMN public.theological_chunks.source_types IS 'Khusus category_code=9: sumber rujukan modul — kitab_suci, magisterium, tradisi_suci, hukum_kanonik, hagiografi';

-- ============================================================
-- 2. ADD CATEGORY COLUMNS TO qa_pairs (Gating Otoritas Teologis)
-- ============================================================
-- Kolom ini hanya diisi untuk domain theology/catechism_module
-- Ditegakkan oleh trigger enforce_theological_tagging() — lihat qna_r2_final.md §7
ALTER TABLE public.qa_pairs
    ADD COLUMN IF NOT EXISTS category_code    TEXT,
    ADD COLUMN IF NOT EXISTS authority_level   TEXT,
    ADD COLUMN IF NOT EXISTS tagging_status    TEXT DEFAULT 'untagged';

COMMENT ON COLUMN public.qa_pairs.category_code IS '1-9, hanya untuk domain theology/catechism_module — referensi kategori theological_chunks';
COMMENT ON COLUMN public.qa_pairs.authority_level IS 'highest|high|medium|reference|devotional — untuk Authority-Tier Prompt Injection';
COMMENT ON COLUMN public.qa_pairs.tagging_status IS 'untagged|tagged|verified — status tagging otoritas oleh Ahli Teologi';

-- ============================================================
-- 3. UPDATE search_direct_qa() — Return category_code & authority_level
-- ============================================================
DROP FUNCTION IF EXISTS search_direct_qa(VECTOR(768), TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION search_direct_qa(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 5
)
RETURNS TABLE (
    entry_id                       UUID,
    answer_r2_key                  TEXT,
    answer_preview                 TEXT,
    source_reference               TEXT,
    similarity_score               FLOAT,
    chunk_quality_score            INTEGER,
    question_type_classification   TEXT,
    category_code                  TEXT,
    authority_level                TEXT,
    is_approved                    BOOLEAN
)
LANGUAGE sql STABLE AS $$
    SELECT
        akb.id,
        qp.answer_r2_key,
        qp.answer_preview,
        akb.source_reference,
        1 - (qp.embedding <=> p_query_embedding) AS similarity_score,
        akb.chunk_quality_score,
        akb.question_type_classification,
        qp.category_code,
        qp.authority_level,
        qp.is_approved
    FROM public.ai_knowledge_base akb
    JOIN public.qa_pairs qp ON qp.id = akb.qa_pair_id
    WHERE akb.domain           = p_domain
      AND akb.bot_access       @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level
      AND akb.status           = 'approved'
      AND qp.answer_r2_key     IS NOT NULL
      AND akb.chunk_table_ref  IS NULL
      AND qp.embedding         IS NOT NULL
      AND qp.embedding_outdated = FALSE
    ORDER BY qp.is_approved DESC, qp.embedding <=> p_query_embedding
    LIMIT p_limit;
$$;

-- ============================================================
-- 4. UPDATE search_rag_chunks() — With boosted_score for authority_level
-- ============================================================
DROP FUNCTION IF EXISTS search_rag_chunks(VECTOR(768), TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION search_rag_chunks(
    p_query_embedding   VECTOR(768),
    p_domain            TEXT,
    p_bot_access        TEXT,
    p_user_access_level INTEGER,
    p_limit             INTEGER DEFAULT 20
)
RETURNS TABLE (
    chunk_id                     UUID,
    content_r2_key                TEXT,
    content_preview               TEXT,
    source_reference              TEXT,
    similarity_score               FLOAT,
    boosted_score                  FLOAT,
    authority_level                TEXT,
    domain                        TEXT,
    chunk_table                   TEXT,
    chunk_quality_score           INTEGER,
    question_type_classification  TEXT
)
LANGUAGE sql STABLE AS $$
    SELECT * FROM (
    -- theological_chunks — dengan soft-boost authority_level
    SELECT
        tc.id, tc.content_r2_key, tc.content_preview, akb.source_reference,
        (1 - (tc.content_embedding <=> p_query_embedding)) AS similarity_score,
        (1 - (tc.content_embedding <=> p_query_embedding)) *
            (CASE tc.authority_level
                WHEN 'highest'    THEN 1.15
                WHEN 'high'       THEN 1.08
                WHEN 'medium'     THEN 1.00
                WHEN 'reference'  THEN 0.95
                WHEN 'devotional' THEN 0.90
                ELSE 1.00
            END) AS boosted_score,
        tc.authority_level,
        akb.domain, 'theological_chunks'::TEXT AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.theological_chunks tc ON tc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'theological_chunks' AND tc.embedding_outdated = FALSE
      AND tc.content_r2_key IS NOT NULL

    UNION ALL

    -- operational_chunks — tanpa boost
    SELECT
        oc.id, oc.content_r2_key, oc.content_preview, akb.source_reference,
        (1 - (oc.content_embedding <=> p_query_embedding)) AS similarity_score,
        (1 - (oc.content_embedding <=> p_query_embedding)) AS boosted_score,
        NULL::TEXT AS authority_level,
        akb.domain, 'operational_chunks'::TEXT AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.operational_chunks oc ON oc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'operational_chunks' AND oc.embedding_outdated = FALSE
      AND oc.content_r2_key IS NOT NULL
      AND (oc.expires_at IS NULL OR oc.expires_at > NOW())

    UNION ALL

    -- structured_entity_chunks — tanpa boost
    SELECT
        sc.id, sc.content_r2_key, sc.content_preview, akb.source_reference,
        (1 - (sc.content_embedding <=> p_query_embedding)) AS similarity_score,
        (1 - (sc.content_embedding <=> p_query_embedding)) AS boosted_score,
        NULL::TEXT AS authority_level,
        akb.domain, 'structured_entity_chunks'::TEXT AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.structured_entity_chunks sc ON sc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'structured_entity_chunks'
      AND sc.embedding_outdated = FALSE AND sc.entity_active = TRUE
      AND sc.content_r2_key IS NOT NULL
      AND (sc.expires_at IS NULL OR sc.expires_at > NOW())

    UNION ALL

    -- internal_admin_chunks — tanpa boost
    SELECT
        ia.id, ia.content_r2_key, ia.content_preview, akb.source_reference,
        (1 - (ia.content_embedding <=> p_query_embedding)) AS similarity_score,
        (1 - (ia.content_embedding <=> p_query_embedding)) AS boosted_score,
        NULL::TEXT AS authority_level,
        akb.domain, 'internal_admin_chunks'::TEXT AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM public.ai_knowledge_base akb
    JOIN public.internal_admin_chunks ia ON ia.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'internal_admin_chunks' AND ia.embedding_outdated = FALSE
      AND ia.content_r2_key IS NOT NULL
    ) AS sub
    ORDER BY boosted_score DESC
    LIMIT p_limit;
$$;

-- ============================================================
-- 5. CREATE enforce_theological_tagging TRIGGER for qa_pairs
-- ============================================================
-- Mencegah qa_pairs domain theology/catechism_module di-approve tanpa tagging otoritas
-- Definisi sesuai qna_r2_final.md §7.3

CREATE OR REPLACE FUNCTION enforce_theological_tagging()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Hanya berlaku untuk domain theology dan catechism_module
    IF NEW.domain IN ('theology', 'catechism_module') THEN
        -- Cegah is_approved = TRUE jika tagging_status bukan 'verified'
        IF NEW.is_approved = TRUE AND (NEW.tagging_status IS DISTINCT FROM 'verified') THEN
            RAISE EXCEPTION 'QA domain % tidak bisa di-approve tanpa tagging_status = ''verified''. Tagging_status saat ini: %',
                NEW.domain, COALESCE(NEW.tagging_status, 'NULL');
        END IF;

        -- Cegah category_code NULL saat is_approved
        IF NEW.is_approved = TRUE AND NEW.category_code IS NULL THEN
            RAISE EXCEPTION 'QA domain % tidak bisa di-approve tanpa category_code', NEW.domain;
        END IF;

        -- Cegah authority_level NULL saat is_approved
        IF NEW.is_approved = TRUE AND NEW.authority_level IS NULL THEN
            RAISE EXCEPTION 'QA domain % tidak bisa di-approve tanpa authority_level', NEW.domain;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_enforce_theological_tagging ON public.qa_pairs;

CREATE TRIGGER trg_enforce_theological_tagging
    BEFORE INSERT OR UPDATE ON public.qa_pairs
    FOR EACH ROW
    EXECUTE FUNCTION enforce_theological_tagging();

COMMENT ON TRIGGER trg_enforce_theological_tagging ON public.qa_pairs IS 'Memastikan QA domain theology/catechism_module tidak bisa di-approve tanpa otoritas — lihat qna_r2_final.md §7';