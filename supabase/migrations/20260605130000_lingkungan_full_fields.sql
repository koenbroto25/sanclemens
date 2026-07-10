-- Migration 013: Add full Lingkungan fields
-- Ref: masterplan.md Sub-Fase 0.4 + 1.4
-- Tambah field is_stasi, wilayah_id, alamat, ketua_lingkungan_id, statistik
-- Data UPDATED: 5 Juni 2026 — 17 Lingkungan + Stasi real Paroki Santo Klemens Sepinggan

-- ============================================
-- 1. ADD is_stasi COLUMN
-- ============================================
ALTER TABLE public.lingkungan
ADD COLUMN IF NOT EXISTS is_stasi BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.lingkungan.is_stasi IS 'TRUE jika stasi (homili/baptis di luar gereja utama), FALSE jika lingkungan';

-- ============================================
-- 2. ADD wilayah_id COLUMN (direct relation)
-- ============================================
ALTER TABLE public.lingkungan
ADD COLUMN IF NOT EXISTS wilayah_id UUID REFERENCES public.wilayah(id);

CREATE INDEX IF NOT EXISTS idx_lingkungan_wilayah ON public.lingkungan(wilayah_id);

-- ============================================
-- 3. ADD alamat & koordinat (for Pintu 2)
-- ============================================
ALTER TABLE public.lingkungan
ADD COLUMN IF NOT EXISTS alamat TEXT,
ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8);

-- ============================================
-- 4. ADD statistik (denormalized for performance)
-- ============================================
ALTER TABLE public.lingkungan
ADD COLUMN IF NOT EXISTS total_kk INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_umat INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- ============================================
-- 5. ADD status_aktif (soft-delete)
-- ============================================
ALTER TABLE public.lingkungan
ADD COLUMN IF NOT EXISTS status_aktif BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.lingkungan.status_aktif IS 'FALSE = soft-deleted, tidak muncul di pilihan';

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lingkungan_is_stasi ON public.lingkungan(is_stasi) WHERE is_stasi = TRUE;
CREATE INDEX IF NOT EXISTS idx_lingkungan_status_aktif ON public.lingkungan(status_aktif) WHERE status_aktif = TRUE;