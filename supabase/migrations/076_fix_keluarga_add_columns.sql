-- ============================================
-- MIGRATION 076: Fix keluarga table - add nama_kepala_keluarga
-- ============================================

-- Tambah kolom nama_kepala_keluarga untuk display
ALTER TABLE public.keluarga ADD COLUMN IF NOT EXISTS
    nama_kepala_keluarga TEXT;

COMMENT ON COLUMN public.keluarga.nama_kepala_keluarga IS 'Display name kepala keluarga (denormalized dari CSV)';

-- Index untuk lookup
CREATE INDEX IF NOT EXISTS idx_keluarga_nama_kepala ON public.keluarga(nama_kepala_keluarga);