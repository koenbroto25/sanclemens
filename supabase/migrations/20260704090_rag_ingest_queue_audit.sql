-- Migration: RAG Ingest Queue & Audit Infrastructure
-- Created: 04 July 2026
-- Purpose: Create ai_ingest_queue for pipeline staging and r2_audit_cursor for orphan detection
-- Reference: rag_ai_r2_72.md Ã‚Â§9.3, Ã‚Â§16.2, Ã‚Â§16.4-16.5; section5_new.md Ã‚Â§5.0a-5.0b

SET search_path = public, extensions;

-- ============================================================
-- 1. ai_ingest_queue Ã¢â‚¬â€ Pipeline staging & antrian kerja
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_ingest_queue (
    id                  UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    source_table        TEXT NOT NULL,
    source_id           TEXT NOT NULL,
    operation           TEXT DEFAULT 'insert',
    status              TEXT DEFAULT 'pending',
    pipeline_stage      TEXT DEFAULT 'queued',
    retry_count         INTEGER DEFAULT 0,
    failed_stage        TEXT,
    last_error          TEXT,
    staged_embedding    VECTOR(768),
    staged_r2_key       TEXT,
    staged_preview      TEXT,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive: pastikan semua kolom ada walau tabel sudah pernah dibuat sebelumnya
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS operation TEXT DEFAULT 'insert';
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'queued';
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS failed_stage TEXT;
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS staged_embedding VECTOR(768);
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS staged_r2_key TEXT;
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS staged_preview TEXT;
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE public.ai_ingest_queue ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE public.ai_ingest_queue IS 'Antrian serah-terima antar tahap pipeline ingest (Tahap 0-5) Ã¢â‚¬â€ lihat section5_new.md Ã‚Â§5.0b';
COMMENT ON COLUMN public.ai_ingest_queue.source_table IS 'Nama tabel sumber (mis. saints_manual_import, warta_paroki, dll)';
COMMENT ON COLUMN public.ai_ingest_queue.source_id IS 'ID baris di tabel sumber Ã¢â‚¬â€ untuk idempotency';
COMMENT ON COLUMN public.ai_ingest_queue.pipeline_stage IS 'queued Ã¢â€ â€™ embedding_done Ã¢â€ â€™ r2_done Ã¢â€ â€™ chunk_done Ã¢â€ â€™ akb_done Ã¢â€ â€™ verified_approved';
COMMENT ON COLUMN public.ai_ingest_queue.status IS 'pending|processing|done|failed';
COMMENT ON COLUMN public.ai_ingest_queue.staged_embedding IS 'Hasil embedding dari Tahap 1, staging sementara sebelum Tahap 3';

-- Queue progress index
CREATE INDEX IF NOT EXISTS idx_ai_ingest_queue_stage_status 
    ON public.ai_ingest_queue (pipeline_stage, status);
CREATE INDEX IF NOT EXISTS idx_ai_ingest_queue_created 
    ON public.ai_ingest_queue (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_ingest_queue_source 
    ON public.ai_ingest_queue (source_table, source_id);

-- ============================================================
-- 2. r2_audit_cursor Ã¢â‚¬â€ Tracking posisi audit orphan R2
-- ============================================================
CREATE TABLE IF NOT EXISTS public.r2_audit_cursor (
    source_table    TEXT PRIMARY KEY,
    last_audited_id UUID,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.r2_audit_cursor IS 'Cursor posisi terakhir audit orphan R2 per tabel Ã¢â‚¬â€ menjamin coverage penuh bergilir';

-- ============================================================
-- 3. Generic Trigger Function Ã¢â‚¬â€ Auto-enqueue for Postgres tables
-- ============================================================
-- Untuk tabel-tabel yang terdaftar di pipeline (warta_paroki, kegiatan_paroki, dll),
-- trigger ini otomatis memasukkan baris baru/update ke ai_ingest_queue.

CREATE OR REPLACE FUNCTION auto_enqueue_to_ingest()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.ai_ingest_queue (
        source_table,
        source_id,
        operation,
        status,
        pipeline_stage
    ) VALUES (
        TG_TABLE_NAME,
        NEW.id::TEXT,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'insert'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            ELSE 'insert'
        END,
        'pending',
        'queued'
    )
    ON CONFLICT ON CONSTRAINT ai_ingest_queue_source_unique 
    DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Note: Unique constraint untuk idempotency perlu ditambahkan terpisah
-- karena composite UNIQUE tidak bisa dibuat dengan ON CONFLICT di trigger function
-- tanpa constraint yang sesuai.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_ingest_queue_source_unique'
    ) THEN
        ALTER TABLE public.ai_ingest_queue
            ADD CONSTRAINT ai_ingest_queue_source_unique
            UNIQUE (source_table, source_id, operation, status);
    END IF;
END
$$;

COMMENT ON CONSTRAINT ai_ingest_queue_source_unique ON public.ai_ingest_queue IS 'Mencegah duplikasi baris antrian untuk source yang sama Ã¢â‚¬â€ idempotency Ã‚Â§16.4';

-- ============================================================
-- 4. Maintenance: Cleanup old queue entries
-- ============================================================
-- Hapus item yang sudah selesai (status=done) lebih dari 7 hari
CREATE OR REPLACE FUNCTION cleanup_old_ingest_queue()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.ai_ingest_queue
    WHERE status = 'done'
      AND updated_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION cleanup_old_ingest_queue IS 'Hapus item antrian yang sudah selesai >7 hari Ã¢â‚¬â€ panggil via cron bulanan';
