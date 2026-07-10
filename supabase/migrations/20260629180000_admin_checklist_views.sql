-- ============================================================
-- MIGRATION: 20260629180000_admin_checklist_views.sql
-- Admin views untuk monitoring QA & Chunks upload
-- ============================================================

-- ============================================================
-- VIEW: Content Checklist Summary
-- ============================================================

CREATE OR REPLACE VIEW admin_content_checklist AS
SELECT 
    'prayers_collection' as table_name,
    COUNT(*) as total_uploaded,
    SUM(CASE WHEN approved_at IS NOT NULL THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as has_embedding,
    MAX(created_at) as last_uploaded,
    MIN(created_at) as first_uploaded
FROM public.prayers_collection

UNION ALL

SELECT 
    'qa_pairs' as table_name,
    COUNT(*) as total_uploaded,
    SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as has_embedding,
    MAX(created_at) as last_uploaded,
    MIN(created_at) as first_uploaded
FROM public.qa_pairs
WHERE domain = 'catechism_module';

-- ============================================================
-- VIEW: Bot Content Summary
-- ============================================================

CREATE OR REPLACE VIEW admin_bot_content_summary AS
SELECT 
    bot_access[1] as bot_name,
    domain,
    COUNT(*) as total_qa,
    SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as approved_qa,
    SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as embedded_qa,
    MAX(created_at) as last_upload
FROM qa_pairs
GROUP BY bot_access[1], domain
ORDER BY bot_name, domain;

-- ============================================================
-- VIEW: Chunks Checklist
-- ============================================================

CREATE OR REPLACE VIEW admin_chunks_checklist AS
SELECT 
    akb.content_type,
    akb.domain,
    akb.document_code,
    COUNT(*) as total_chunks,
    MAX(akb.created_at) as last_created
FROM ai_knowledge_base akb
GROUP BY akb.content_type, akb.domain, akb.document_code
ORDER BY akb.domain, akb.content_type;

-- ============================================================
-- VIEW: Orphan QA (belum linked ke ai_knowledge_base)
-- ============================================================

CREATE OR REPLACE VIEW admin_orphan_qa AS
SELECT 
    qp.id as qa_id,
    qp.question_variations[1] as sample_question,
    qp.domain,
    qp.bot_access[1] as bot_name,
    qp.created_at,
    CASE 
        WHEN akb.id IS NULL THEN 'ORPHAN - No knowledge base entry'
        ELSE 'OK'
    END as status
FROM qa_pairs qp
LEFT JOIN ai_knowledge_base akb 
    ON akb.document_code = qp.id::text
WHERE qp.domain = 'catechism_module';

-- ============================================================
-- VIEW: Upload Progress Summary
-- ============================================================

CREATE OR REPLACE VIEW admin_upload_progress AS
SELECT 
    (SELECT COUNT(*) FROM prayers_collection) as total_prayers,
    (SELECT COUNT(*) FROM qa_pairs WHERE domain = 'catechism_module') as total_qa,
    (SELECT COUNT(*) FROM qa_pairs WHERE is_approved = true) as approved_qa,
    (SELECT COUNT(*) FROM qa_pairs WHERE embedding IS NOT NULL) as embedded_qa;

-- ============================================================
-- GRANTS: Super admin only
-- ============================================================

-- Service role bisa akses untuk API
GRANT SELECT ON admin_content_checklist TO service_role;
GRANT SELECT ON admin_bot_content_summary TO service_role;
GRANT SELECT ON admin_chunks_checklist TO service_role;
GRANT SELECT ON admin_orphan_qa TO service_role;
GRANT SELECT ON admin_upload_progress TO service_role;