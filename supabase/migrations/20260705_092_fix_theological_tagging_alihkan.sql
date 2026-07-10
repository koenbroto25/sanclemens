-- Migration: Fix Theological Tagging Trigger — "Alihkan, Bukan Blokir"
-- Created: 05 July 2026
-- Purpose: Ubah trigger enforce_theological_tagging dari RAISE EXCEPTION (blokir)
--          ke pattern "alihkan" (set is_approved=FALSE + tagging_status=pending)
-- Reference: qna_r2_final.md §7.3, rag_data_governance_master.md §3.6

SET search_path = public, extensions;

-- ============================================================
-- 1. Drop trigger lama (yang menggunakan RAISE EXCEPTION)
-- ============================================================
DROP TRIGGER IF EXISTS trg_enforce_theological_tagging ON public.qa_pairs;

-- ============================================================
-- 2. Drop function lama
-- ============================================================
DROP FUNCTION IF EXISTS enforce_theological_tagging();

-- ============================================================
-- 3. Buat function baru dengan logic "alihkan, bukan blokir"
-- ============================================================
-- Prinsip: transaksi tetap sukses, tapi trigger mengubah nilai yang mau disimpan
-- - is_approved dipaksa FALSE
-- - tagging_status di-set 'pending_theological_tagging'
-- - Tidak memblokir INSERT/UPDATE, hanya memodifikasi data sebelum tersimpan

CREATE OR REPLACE FUNCTION enforce_theological_tagging()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Hanya berlaku untuk domain theology dan catechism_module
  IF NEW.domain IN ('theology', 'catechism_module') THEN
    
    -- Cek apakah is_approved = TRUE tapi belum lengkap tagging
    IF NEW.is_approved = TRUE 
       AND (NEW.category_code IS NULL OR NEW.authority_level IS NULL) THEN
      
      -- ALIHKAN: set is_approved = FALSE (bukan blokir dengan exception)
      NEW.is_approved := FALSE;
      
      -- Set tagging_status ke pending (jika masih NULL atau bukan verified)
      -- Hanya set kalau belum ada status yang valid
      IF NEW.tagging_status IS NULL OR NEW.tagging_status NOT IN ('verified', 'pending_theological_tagging') THEN
        NEW.tagging_status := 'pending_theological_tagging';
      END IF;
      
      -- Log untuk audit (opsional, bisa dihapus kalau tidak dibutuhkan)
      -- RAISE NOTICE 'QA % dialihkan ke pending_theological_tagging (category_code/authority_level belum lengkap)', NEW.id;
    
    -- Kalau category_code dan authority_level sudah ada, pastikan tagging_status sesuai
    ELSIF NEW.category_code IS NOT NULL AND NEW.authority_level IS NOT NULL THEN
      
      -- Jika sudah lengkap tapi masih pending, auto-verify (bisa di-approve)
      IF NEW.tagging_status = 'pending_theological_tagging' AND NEW.is_approved = TRUE THEN
        NEW.tagging_status := 'verified';
      END IF;
    END IF;
  END IF;
  
  -- Untuk domain non-teologis, pastikan tagging_status = NULL
  IF NEW.domain NOT IN ('theology', 'catechism_module') AND NEW.tagging_status IS NOT NULL THEN
    NEW.tagging_status := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. Buat trigger baru dengan logic yang diperbaiki
-- ============================================================
-- BEFORE INSERT OR UPDATE OF is_approved — menangkap dua jalur:
-- (a) insert langsung is_approved = TRUE (auto-publish admin)
-- (b) update is_approved FALSE→TRUE dari alur approval HIL biasa

CREATE TRIGGER trg_enforce_theological_tagging
  BEFORE INSERT OR UPDATE OF is_approved ON public.qa_pairs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_theological_tagging();

-- ============================================================
-- 5. Update default nilai tagging_status di existing rows
-- ============================================================
-- Migration 088 menyetel DEFAULT 'untagged', seharusnya DEFAULT NULL
-- Update semua row yang masih 'untagged' menjadi NULL (karena bukan domain teologis atau belum dicek)

UPDATE public.qa_pairs
SET tagging_status = NULL
WHERE tagging_status = 'untagged'
  AND domain NOT IN ('theology', 'catechism_module');

UPDATE public.qa_pairs
SET tagging_status = 'pending_theological_tagging'
WHERE tagging_status = 'untagged'
  AND domain IN ('theology', 'catechism_module')
  AND (category_code IS NULL OR authority_level IS NULL);

-- Jika sudah lengkap category_code + authority_level, set verified
UPDATE public.qa_pairs
SET tagging_status = 'verified'
WHERE tagging_status = 'untagged'
  AND domain IN ('theology', 'catechism_module')
  AND category_code IS NOT NULL
  AND authority_level IS NOT NULL;

-- ============================================================
-- 6. Index untuk dashboard "Perlu Tag Otoritas"
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_qa_pairs_pending_tagging
    ON public.qa_pairs USING btree (updated_at)
    WHERE tagging_status = 'pending_theological_tagging';

-- ============================================================
-- 7. Comment pada trigger
-- ============================================================
COMMENT ON TRIGGER trg_enforce_theological_tagging ON public.qa_pairs IS 
  'Memastikan QA domain theology/catechism_module tidak bisa di-approve tanpa otoritas — dialihkan ke pending, bukan diblokir. Referensi: qna_r2_final.md §7.3';