-- ============================================================================
-- Registration Extras — AI Matching data + verification flags
-- Created: 2026-07-10
-- Deskripsi: Tabel user_ai_matching_data untuk fitur AI Matching (Klemen Kerja)
--            dan kolom status verifikasi di profiles.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND public.profiles dengan flag verifikasi
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_personal_data_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_family_data_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_personal_verified
  ON public.profiles USING btree (is_personal_data_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_family_verified
  ON public.profiles USING btree (is_family_data_verified);

-- ----------------------------------------------------------------------------
-- 2. public.user_ai_matching_data
--    Data AI Matching per umat (job/bisnis/keahlian) untuk Bot 7 Klemen Kerja.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ai_matching_data (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pekerjaan              TEXT,
  bidang_industri        TEXT[],
  keahlian               TEXT[],
  minat_pelayanan        TEXT[],
  link_portofolio        TEXT,
  ketersediaan_charity   BOOLEAN DEFAULT FALSE,
  preferensi_lokasi      TEXT,
  business_category      TEXT,
  has_delivery           BOOLEAN DEFAULT FALSE,
  charity_discount       BOOLEAN DEFAULT FALSE,
  user_location          JSONB, -- { lat: number; lng: number }
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_matching_user ON public.user_ai_matching_data USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_matching_keahlian ON public.user_ai_matching_data USING gin (keahlian);
CREATE INDEX IF NOT EXISTS idx_ai_matching_industri ON public.user_ai_matching_data USING gin (bidang_industri);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_ai_matching_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_matching_updated_at ON public.user_ai_matching_data;
CREATE TRIGGER trg_ai_matching_updated_at
  BEFORE UPDATE ON public.user_ai_matching_data
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_matching_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_ai_matching_data ENABLE ROW LEVEL SECURITY;

-- Pemilik data bisa CRUD datanya sendiri
DROP POLICY IF EXISTS ai_matching_owner_all ON public.user_ai_matching_data;
CREATE POLICY ai_matching_owner_all ON public.user_ai_matching_data
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin paroki-wide & super admin bisa melihat semua (untuk matching)
DROP POLICY IF EXISTS ai_matching_admin_select ON public.user_ai_matching_data;
CREATE POLICY ai_matching_admin_select ON public.user_ai_matching_data
  FOR SELECT USING (public.is_paroki_wide_admin() OR public.is_super_admin());

COMMENT ON TABLE public.user_ai_matching_data IS
  'Data AI Matching per umat: pekerjaan, keahlian, minat pelayanan, info bisnis, dan preferensi charity. Dipakai Bot 7 Klemen Kerja untuk job/charity/business matching.';