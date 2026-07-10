-- ============================================================================
-- PIDU & Digital Document System — Migration
-- Created: 2026-07-07
-- Deskripsi: Implementasi Paroki ID Digital Umat (PIDU) + ekosistem dokumen
--            digital dinamis dengan auto-link, jejak digital, dan kontrol Super Admin.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND public.profiles
--    - pidu_id (Identitas Digital Umat)
--    - kolom nomor dokumen + link dokumen (diisi otomatis oleh sistem)
--    - KTP Digital & KK Katolik link
--    (Kolom boolean sakramen_* tetap ada sebagai flag cepat, namun nomor &
--     link dokumen disimpan terpisah untuk auto-link & akses cepat.)
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pidu_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS nomor_ktp_digital TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS link_ktp_digital TEXT,
  ADD COLUMN IF NOT EXISTS nomor_kk_katolik TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS link_kk_katolik TEXT,
  ADD COLUMN IF NOT EXISTS nomor_sertifikat_baptis TEXT,
  ADD COLUMN IF NOT EXISTS link_sertifikat_baptis TEXT,
  ADD COLUMN IF NOT EXISTS nomor_sertifikat_komuni TEXT,
  ADD COLUMN IF NOT EXISTS link_sertifikat_komuni TEXT,
  ADD COLUMN IF NOT EXISTS nomor_sertifikat_krisma TEXT,
  ADD COLUMN IF NOT EXISTS link_sertifikat_krisma TEXT,
  ADD COLUMN IF NOT EXISTS nomor_sertifikat_perkawinan TEXT,
  ADD COLUMN IF NOT EXISTS link_sertifikat_perkawinan TEXT;

-- Index untuk pencarian cepat PIDU
CREATE INDEX IF NOT EXISTS idx_profiles_pidu_id ON public.profiles USING btree (pidu_id);

-- ----------------------------------------------------------------------------
-- 2. public.document_types_registry
--    Registry jenis dokumen — dikelola penuh oleh Super Admin.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_types_registry (
  document_type_code        TEXT PRIMARY KEY,
  document_name             TEXT NOT NULL,
  default_prefix            TEXT NOT NULL,
  description               TEXT,
  numbering_pattern         JSONB NOT NULL DEFAULT '{"include_pidu":true,"year":true,"counter":true,"env_code":false,"separator":"-"}'::jsonb,
  template_id               UUID,
  required_roles_to_generate TEXT[] NOT NULL DEFAULT '{super_admin}'::TEXT[],
  is_user_claimable         BOOLEAN NOT NULL DEFAULT false,
  is_pidu_linked            BOOLEAN NOT NULL DEFAULT true,
  auto_link_profile_columns TEXT[],
  number_to_profile_column_name TEXT,
  link_to_profile_column_name  TEXT,
  visibility_roles          TEXT[] NOT NULL DEFAULT '{umat}'::TEXT[],
  encryption_required       BOOLEAN NOT NULL DEFAULT false,
  audit_log_enabled         BOOLEAN NOT NULL DEFAULT true,
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. public.document_templates
--    Template PDF/HTML untuk generate dokumen.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'pdf'::TEXT,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. public.document_counters
--    Counter per kombinasi (type_code, year, env_code) untuk penomoran unik.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_counters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_code TEXT NOT NULL REFERENCES public.document_types_registry(document_type_code),
  year          INTEGER NOT NULL,
  env_code      TEXT,
  counter       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (document_type_code, year, env_code)
);

-- ----------------------------------------------------------------------------
-- 5. public.documents  (Core Digital Vault record)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id         TEXT UNIQUE NOT NULL,
  legacy_document_id  TEXT,
  pidu_owner_id       UUID REFERENCES public.profiles(id),
  document_type_code  TEXT NOT NULL REFERENCES public.document_types_registry(document_type_code),
  parent_document_id  UUID REFERENCES public.documents(id),
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status = ANY (ARRAY[
                          'draft','pending_user_verification','pending_official_approval',
                          'issued','revoked','pending_scan'
                        ])),
  pdf_url             TEXT,
  qr_code_url         TEXT,
  digital_signature   TEXT,
  issued_by           UUID REFERENCES public.profiles(id),
  verified_by         UUID REFERENCES public.profiles(id),
  approved_by         UUID REFERENCES public.profiles(id),
  issued_at           TIMESTAMPTZ,
  user_verified_at    TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  template_data       JSONB,
  encryption_meta     JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_pidu ON public.documents USING btree (pidu_owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_legacy ON public.documents USING btree (legacy_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents USING btree (document_type_code);

-- ----------------------------------------------------------------------------
-- 6. Seed document_types_registry dengan jenis dokumen awal
--    (Super Admin dapat menambah/edit via UI tanpa ubah kode)
-- ----------------------------------------------------------------------------

INSERT INTO public.document_types_registry
  (document_type_code, document_name, default_prefix, required_roles_to_generate,
   is_user_claimable, is_pidu_linked, number_to_profile_column_name, link_to_profile_column_name,
   visibility_roles, encryption_required)
VALUES
  ('KTPD',  'KTP Digital',        'KTPD-',  '{super_admin,sekretaris}'::TEXT[], false, true,
   'nomor_ktp_digital',  'link_ktp_digital',  '{umat,sekretaris,super_admin}'::TEXT[], false),
  ('KK',    'KK Katolik',         'KK-',    '{super_admin,sekretaris}'::TEXT[], false, true,
   'nomor_kk_katolik',   'link_kk_katolik',   '{umat,sekretaris,super_admin}'::TEXT[], false),
  ('BAPTIS','Sertifikat Baptis',  'BAPTIS-','{pastor,sekretaris}'::TEXT[],        false, true,
   'nomor_sertifikat_baptis',  'link_sertifikat_baptis',  '{umat,pastor,sekretaris,super_admin}'::TEXT[], false),
  ('KOMUNI','Sertifikat Komuni',  'KOMUNI-','{pastor,sekretaris}'::TEXT[],        false, true,
   'nomor_sertifikat_komuni', 'link_sertifikat_komuni', '{umat,pastor,sekretaris,super_admin}'::TEXT[], false),
  ('KRISMA','Sertifikat Krisma',  'KRISMA-','{pastor,sekretaris}'::TEXT[],        false, true,
   'nomor_sertifikat_krisma', 'link_sertifikat_krisma', '{umat,pastor,sekretaris,super_admin}'::TEXT[], false),
  ('NIKAH', 'Sertifikat Perkawinan','NIKAH-','{pastor}'::TEXT[],                  false, true,
   'nomor_sertifikat_perkawinan','link_sertifikat_perkawinan','{umat,pastor,super_admin}'::TEXT[], false)
ON CONFLICT (document_type_code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Trigger: update updated_at pada tabel dokumen
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_document_updated_at();

-- ----------------------------------------------------------------------------
-- 8. Helper: generate document_id berikutnya (dipakai API generate)
--    Mengembalikan document_id unik berdasar pola registry + counter.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.next_document_id(
  p_type_code TEXT,
  p_pidu TEXT DEFAULT NULL,
  p_env_code TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_pattern   JSONB;
  v_prefix    TEXT;
  v_year      INT := EXTRACT(YEAR FROM now());
  v_counter   INT;
  v_result    TEXT;
  v_sep       TEXT := '-';
BEGIN
  SELECT numbering_pattern, default_prefix
    INTO v_pattern, v_prefix
  FROM public.document_types_registry
  WHERE document_type_code = p_type_code;

  IF v_pattern ? 'separator' THEN
    v_sep := v_pattern->>'separator';
  END IF;

  -- increment counter (upsert)
  INSERT INTO public.document_counters (document_type_code, year, env_code, counter)
  VALUES (p_type_code, v_year, p_env_code, 1)
  ON CONFLICT (document_type_code, year, env_code)
  DO UPDATE SET counter = public.document_counters.counter + 1
  RETURNING counter INTO v_counter;

  v_result := v_prefix;
  IF (v_pattern->>'include_pidu') = 'true' AND p_pidu IS NOT NULL THEN
    v_result := v_result || p_pidu || v_sep;
  END IF;
  IF (v_pattern->>'year') = 'true' THEN
    v_result := v_result || v_year::TEXT || v_sep;
  END IF;
  v_result := v_result || lpad(v_counter::TEXT, 5, '0');
  IF (v_pattern->>'env_code') = 'true' AND p_env_code IS NOT NULL THEN
    v_result := v_result || v_sep || p_env_code;
  END IF;

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. Helper: auto-link dokumen ke profil user (isi nomor + link)
--    Dipanggil saat dokumen issued atau saat user input nomor manual.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auto_link_document_to_profile(
  p_document_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_rec       RECORD;
  v_num_col   TEXT;
  v_link_col  TEXT;
  v_sql       TEXT;
BEGIN
  SELECT d.pidu_owner_id, d.pdf_url, r.number_to_profile_column_name, r.link_to_profile_column_name
    INTO v_rec
  FROM public.documents d
  JOIN public.document_types_registry r ON r.document_type_code = d.document_type_code
  WHERE d.document_id = p_document_id;

  IF v_rec.pidu_owner_id IS NULL OR v_rec.number_to_profile_column_name IS NULL THEN
    RETURN;
  END IF;

  v_sql := format(
    'UPDATE public.profiles SET %I = $1, %I = $2 WHERE id = $3',
    v_rec.number_to_profile_column_name, v_rec.link_to_profile_column_name
  );
  EXECUTE v_sql USING p_document_id, v_rec.pdf_url, v_rec.pidu_owner_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. RLS — dokumen hanya bisa dilihat oleh pemilik atau role yang diizinkan
-- ----------------------------------------------------------------------------

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;

-- Pemilik dokumen bisa lihat dokumennya
DROP POLICY IF EXISTS documents_owner_select ON public.documents;
CREATE POLICY documents_owner_select ON public.documents
  FOR SELECT USING (pidu_owner_id = auth.uid());

-- Super admin & paroki-wide admin akses penuh
DROP POLICY IF EXISTS documents_admin_all ON public.documents;
CREATE POLICY documents_admin_all ON public.documents
  FOR ALL USING (public.is_paroki_wide_admin() OR public.is_super_admin());

-- Registry bisa dibaca semua user login, tulis hanya super admin
DROP POLICY IF EXISTS dtr_select ON public.document_types_registry;
CREATE POLICY dtr_select ON public.document_types_registry
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS dtr_admin_write ON public.document_types_registry;
CREATE POLICY dtr_admin_write ON public.document_types_registry
  FOR ALL USING (public.is_super_admin());

-- Templates: baca user login, tulis super admin
DROP POLICY IF EXISTS dt_select ON public.document_templates;
CREATE POLICY dt_select ON public.document_templates
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS dt_admin_write ON public.document_templates;
CREATE POLICY dt_admin_write ON public.document_templates
  FOR ALL USING (public.is_super_admin());

-- Counters: baca user login, tulis super admin / service role
DROP POLICY IF EXISTS dc_select ON public.document_counters;
CREATE POLICY dc_select ON public.document_counters
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS dc_admin_write ON public.document_counters;
CREATE POLICY dc_admin_write ON public.document_counters
  FOR ALL USING (public.is_super_admin() OR auth.role() = 'service_role');

COMMENT ON TABLE public.documents IS
  'Core Digital Vault: setiap dokumen digital (KTP, KK, sertifikat, surat) tersimpan di sini. pidu_owner_id menautkan ke profil umat. legacy_document_id untuk dokumen fisik lama yang didigitalisasi.';
COMMENT ON TABLE public.document_types_registry IS
  'Registry jenis dokumen — dikelola Super Admin via UI. Menentukan pola penomoran, template, role yang boleh generate, dan kolom profil untuk auto-link nomor & link dokumen.';
