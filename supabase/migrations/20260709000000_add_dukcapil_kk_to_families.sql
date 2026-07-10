-- ============================================================================
-- Create families table and add dukcapil_kk_number for KK Digital implementation
-- Created: 2026-07-09
-- Description: Membuat tabel families sebagai representasi KK Gereja,
--              menambahkan kolom dukcapil_kk_number yang diekstrak dari OCR scan,
--              dan menetapkan RLS policies.
-- ============================================================================
-- 1. Create public.families table (KK Gereja)
CREATE TABLE IF NOT EXISTS public.families (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_kk_gereja     TEXT UNIQUE NOT NULL,
  dukcapil_kk_number  TEXT UNIQUE, -- Kolom untuk menautkan dengan KK Dukcapil asli yang diekstrak OCR
  nama_kepala         TEXT NOT NULL,
  alamat              TEXT,
  lingkungan_id       UUID REFERENCES public.lingkungan(id),
  wilayah_id          UUID REFERENCES public.wilayah(id),
  lat                 NUMERIC(10,8),
  lng                 NUMERIC(11,8),
  foto_rumah_url      TEXT,
  status_aktif        BOOLEAN DEFAULT TRUE,
  catatan_pastoral    TEXT,
  qr_token            TEXT,
  qr_expires_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Ensure column exists even if table was created previously without it
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'families' AND column_name = 'dukcapil_kk_number'
  ) THEN
    ALTER TABLE public.families ADD COLUMN dukcapil_kk_number TEXT;
    ALTER TABLE public.families ADD CONSTRAINT families_dukcapil_kk_number_key UNIQUE (dukcapil_kk_number);
  END IF;
END $$;

COMMENT ON TABLE public.families IS
  'Tabel untuk Kartu Keluarga Gereja (KK Digital) yang berisi data keluarga Katolik diparoki, termasuk nomor KK Gereja dan tautan ke Nomor KK Dukcapil.';
COMMENT ON COLUMN public.families.nomor_kk_gereja IS
  'ID KK Digital Gereja dengan format {4_digit_akhir_dukcapil_OR_fallback}-{5_random_digits}.';
COMMENT ON COLUMN public.families.dukcapil_kk_number IS
  'Nomor KK Dukcapil asli yang diekstrak dari scan OCR. Digunakan sebagai kunci untuk mencari/menautkan keluarga, serta menjadi basis 4 digit awal nomor KK Digital Gereja.';

-- 2. Add index for faster lookups by dukcapil_kk_number
CREATE INDEX IF NOT EXISTS idx_families_dukcapil_kk ON public.families USING btree (dukcapil_kk_number);

-- 3. Enable RLS and add policies for public.families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Owner (kepala keluarga) can select/update their family data
DROP POLICY IF EXISTS families_owner_all ON public.families;
CREATE POLICY families_owner_all ON public.families
  FOR ALL USING (id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

-- Admins with access_layer >= 4 can view all families
DROP POLICY IF EXISTS families_admin_select ON public.families;
CREATE POLICY families_admin_select ON public.families
  FOR SELECT USING (public.is_paroki_wide_admin() OR public.is_super_admin() OR public.is_lingkungan_admin());

-- Admins with access_layer >= 4 can insert/update/delete all families
DROP POLICY IF EXISTS families_admin_all ON public.families;
CREATE POLICY families_admin_all ON public.families
  FOR ALL USING (public.is_paroki_wide_admin() OR public.is_super_admin()) WITH CHECK (public.is_paroki_wide_admin() OR public.is_super_admin());

-- Lingkungan admin can manage families in their assigned lingkungan
DROP POLICY IF EXISTS families_lingkungan_admin_all ON public.families;
CREATE POLICY families_lingkungan_admin_all ON public.families
  FOR ALL USING (
    (public.is_lingkungan_admin() AND lingkungan_id IN (SELECT lingkungan_id FROM public.profiles WHERE id = auth.uid()))
  ) WITH CHECK (
    (public.is_lingkungan_admin() AND lingkungan_id IN (SELECT lingkungan_id FROM public.profiles WHERE id = auth.uid()))
  );