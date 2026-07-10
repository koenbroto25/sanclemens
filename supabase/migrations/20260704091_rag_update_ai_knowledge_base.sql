-- Migration: Update ai_knowledge_base Schema â€” Add content_type & qa_pair_id
-- Created: 04 July 2026
-- Purpose: Add missing columns to ai_knowledge_base for v6 RAG architecture
-- Also add NOT VALID constraint for data integrity after backfill
-- Reference: rag_ai_r2_72.md Â§4, Â§11

SET search_path = public, extensions;

-- ============================================================
-- 1. ADD MISSING COLUMNS TO ai_knowledge_base
-- ============================================================
-- content_type: 'qa_pair' | 'rag_chunk' â€” untuk membedakan sumber retrieval
-- qa_pair_id: FK ke qa_pairs â€” untuk Q&A entries (NULL untuk rag_chunk entries)
ALTER TABLE public.ai_knowledge_base
    ADD COLUMN IF NOT EXISTS content_type TEXT,
    ADD COLUMN IF NOT EXISTS qa_pair_id  UUID;

COMMENT ON COLUMN public.ai_knowledge_base.content_type IS 'qa_pair | rag_chunk â€” tipe konten untuk routing retrieval';
COMMENT ON COLUMN public.ai_knowledge_base.qa_pair_id IS 'FK ke qa_pairs.id â€” hanya diisi untuk content_type=qa_pair';
COMMENT ON COLUMN public.ai_knowledge_base.chunk_id IS 'FK ke tabel chunk (theological_chunks.id dll) â€” hanya diisi untuk content_type=rag_chunk';

-- Index untuk mempercepat lookup
CREATE INDEX IF NOT EXISTS idx_akb_content_type ON public.ai_knowledge_base (content_type);
CREATE INDEX IF NOT EXISTS idx_akb_qa_pair_id ON public.ai_knowledge_base (qa_pair_id);
CREATE INDEX IF NOT EXISTS idx_akb_chunk_id ON public.ai_knowledge_base (chunk_id);

-- ============================================================
-- 2. ADD CONSTRAINT FOR qa_pairs (NOT VALID â€” validasi setelah backfill)
-- ============================================================
-- Mengikuti pola Â§11.3.5 rag_ai_r2_72.md: NOT VALID dulu, validasi setelah backfill
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_answer_r2_key_present'
    ) THEN
        ALTER TABLE public.qa_pairs
            ADD CONSTRAINT chk_answer_r2_key_present
            CHECK (answer_r2_key IS NOT NULL) NOT VALID;
    END IF;
END
$$;

COMMENT ON CONSTRAINT chk_answer_r2_key_present ON public.qa_pairs IS 'Memastikan answer_r2_key selalu terisi â€” NOT VALID sampai backfill selesai. Jalankan VALIDATE CONSTRAINT setelah backfill.';

-- ============================================================
-- 3. VALIDATE script untuk dijalankan setelah backfill selesai
-- ============================================================
-- Jalankan ini SETELAH migrate_content_to_r2.py selesai dan terverifikasi 100%:
-- ALTER TABLE public.qa_pairs VALIDATE CONSTRAINT chk_answer_r2_key_present;