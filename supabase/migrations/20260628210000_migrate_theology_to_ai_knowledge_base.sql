CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
SET search_path = public, extensions;

-- ============================================================
-- MIGRATION: Migrate data from theology_references to ai_knowledge_base
-- VERSI: 1.0
-- TANGGAL: 28 Juni 2026
-- DESKRIPSI: Copy data teologi yang sudah ada ke ai_knowledge_base
-- dengan metadata tambahan untuk dynamic filtering
-- ============================================================

-- ============================================================
-- 1. CREATE SEARCH FUNCTION: search_knowledge_base
-- ============================================================
CREATE OR REPLACE FUNCTION search_knowledge_base(
    query_embedding extensions.vector(768),
    p_domain TEXT,
    p_bot_access TEXT[],
    p_max_access_level INTEGER,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    content TEXT,
    source_reference TEXT,
    score FLOAT,
    domain TEXT,
    document_code TEXT,
    chunk_quality_score INTEGER,
    question_type_classification TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        akb.content_for_rag,
        akb.source_reference,
        1 - (akb.content_embedding <=> query_embedding) as score,
        akb.domain,
        akb.document_code,
        akb.chunk_quality_score,
        akb.question_type_classification
    FROM public.ai_knowledge_base akb
    WHERE akb.domain = p_domain
      AND akb.bot_access @> p_bot_access
      AND akb.access_level_min <= p_max_access_level
      AND akb.status = 'approved'
    ORDER BY akb.content_embedding <=> query_embedding
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- 2. MULTI-DOMAIN SEARCH FUNCTION
-- Untuk cross-domain RAG queries
-- ============================================================
CREATE OR REPLACE FUNCTION search_knowledge_base_multi_domain(
    query_embedding extensions.vector(768),
    p_domains TEXT[],
    p_bot_access TEXT[],
    p_max_access_level INTEGER,
    p_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
    content TEXT,
    source_reference TEXT,
    score FLOAT,
    domain TEXT,
    document_code TEXT,
    chunk_quality_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        akb.content_for_rag,
        akb.source_reference,
        1 - (akb.content_embedding <=> query_embedding) as score,
        akb.domain,
        akb.document_code,
        akb.chunk_quality_score
    FROM public.ai_knowledge_base akb
    WHERE akb.domain = ANY(p_domains)
      AND akb.bot_access @> p_bot_access
      AND akb.access_level_min <= p_max_access_level
      AND akb.status = 'approved'
    ORDER BY akb.content_embedding <=> query_embedding
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- 3. MIGRATE DATA: theology_references â†’ ai_knowledge_base
-- ============================================================

-- Hanya insert data yang memiliki embedding (tidak null)
INSERT INTO public.ai_knowledge_base (
    chunk_index,
    document_code,
    document_type,
    content_for_rag,
    content_embedding,
    domain,
    bot_access,
    access_level_min,
    question_type_classification,
    source_reference,
    source_url,
    nama_dokumen,
    penulis,
    kategori,
    theology_topic,
    chunk_quality_score,
    status,
    created_at
)
SELECT 
    tr.chunk_index,
    tr.document_code,
    -- document_type berdasarkan kategori
    CASE 
        WHEN tr.kategori IN ('kitab_suci', 'katekismus', 'hukum_kanonik', 'hukum_gereja', 'konsili_vatikan_ii', 'ensiklik', 'bapa_gereja') THEN 'theology'
        WHEN tr.kategori = 'katekismus' THEN 'catechism_module'
        ELSE 'theology'
    END as document_type,
    -- Gunakan teks jika ada, fallback ke content_text
    tr.content_text as content_for_rag,
    -- Gunakan embedding jika ada, fallback ke content_embedding
    tr.content_embedding as content_embedding,
    -- Domain: semua teologi
    'theology' as domain,
    -- Bot access berdasarkan kategori dokumen
    CASE 
        WHEN tr.kategori IN ('kitab_suci', 'katekismus', 'konsili_vatikan_ii') 
            THEN ARRAY['Bot 8 Learn Catholic', 'Bot 3 Companion Rohani', 'Klemen Penjaga Pintu']
        WHEN tr.kategori IN ('ensiklik', 'bapa_gereja') 
            THEN ARRAY['Bot 8 Learn Catholic', 'Bot 3 Companion Rohani']
        WHEN tr.kategori IN ('hukum_kanonik', 'hukum_gereja') 
            THEN ARRAY['Bot 8 Learn Catholic', 'Bot 3 Companion Rohani', 'Bot 2 CS Sekretariat']
        ELSE ARRAY['Bot 8 Learn Catholic', 'Bot 3 Companion Rohani']
    END as bot_access,
    -- Access level: 0 untuk semua teologi (ringkasan publik)
    -- Untuk detail mendalam, access_level 2 (umat terdaftar)
    0 as access_level_min,
    -- Question type berdasarkan kategori
    CASE 
        WHEN tr.kategori = 'kitab_suci' THEN 'dogmatic_explanation'
        WHEN tr.kategori = 'katekismus' THEN 'dogmatic_explanation'
        WHEN tr.kategori IN ('hukum_kanonik', 'hukum_gereja') THEN 'canon_law_explanation'
        WHEN tr.kategori = 'konsili_vatikan_ii' THEN 'council_explanation'
        WHEN tr.kategori = 'ensiklik' THEN 'encyclical_explanation'
        WHEN tr.kategori = 'bapa_gereja' THEN 'patristic_explanation'
        ELSE 'theology_query'
    END as question_type_classification,
    -- Generate source_reference dari document_code + chunk_index
    CASE 
        WHEN tr.document_code LIKE 'ALKITAB%' THEN 'Alkitab (chunk ' || tr.chunk_index::text || ')'
        WHEN tr.document_code LIKE 'Catechism%' THEN 'KGK (chunk ' || tr.chunk_index::text || ')'
        WHEN tr.document_code = 'Kitab_Hukum_Kanonik' THEN 'KHK (chunk ' || tr.chunk_index::text || ')'
        WHEN tr.document_code = 'Compendium_of_the_Catechism' THEN 'KGK Kompendium (chunk ' || tr.chunk_index::text || ')'
        ELSE tr.document_code || ' (chunk ' || tr.chunk_index::text || ')'
    END as source_reference,
    tr.source_url,
    NULL::TEXT as nama_dokumen,
    NULL::TEXT as penulis,
    tr.kategori,
    tr.theology_topic,
    -- Default chunk quality score
    5 as chunk_quality_score,
    -- Status approved karena sudah melalui pipeline cleaning
    'approved' as status,
    NOW() as created_at
FROM public.theology_references tr
WHERE tr.content_embedding IS NOT NULL
  AND tr.content_text IS NOT NULL
  AND tr.chunk_index IS NOT NULL;

-- ============================================================
-- 4. VERIFIKASI HASIL MIGRASI
-- ============================================================
-- Hitung jumlah data yang berhasil dimigrasi
DO $$
DECLARE
    source_count INTEGER;
    dest_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count FROM public.theology_references 
    WHERE content_embedding IS NOT NULL
      AND content_text IS NOT NULL
      AND chunk_index IS NOT NULL;
    
    SELECT COUNT(*) INTO dest_count FROM public.ai_knowledge_base;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRASI DATA THEOLOGY KE AI_KNOWLEDGE_BASE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Sumber (theology_references): % rows', source_count;
    RAISE NOTICE 'Tujuan (ai_knowledge_base): % rows', dest_count;
    RAISE NOTICE '============================================';
    
    IF source_count = dest_count THEN
        RAISE NOTICE 'âœ… MIGRASI BERHASIL: Semua data berhasil dipindahkan';
    ELSE
        RAISE WARNING 'âš ï¸ JUMLAH DATA TIDAK SAMA: Source=% Destination=%', source_count, dest_count;
    END IF;
END;
$$;
