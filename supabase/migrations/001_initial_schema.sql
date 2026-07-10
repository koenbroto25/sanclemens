-- Migration 001: Initial Schema — Core Tables
-- Ref: GDD Bab IV.2 "Schema PUBLIC"

-- ============================================
-- 1. PARISH PROFILE
-- ============================================
CREATE TABLE public.parish_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_paroki TEXT NOT NULL DEFAULT 'Paroki Santo Klemens I',
    alamat TEXT,
    keuskupan TEXT DEFAULT 'Keuskupan Agung Samarinda',
    sk_nomor TEXT DEFAULT '175/A.VIII.8/X/2024',
    nomor_telepon TEXT,
    email_paroki TEXT,
    website TEXT,
    foto_gereja_url TEXT,
    sejarah_singkat TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. LINGKUNGAN & WILAYAH
-- ============================================
CREATE TABLE public.lingkungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    ketua_lingkungan_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wilayah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    koordinator_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. FAMILIES
-- ============================================
CREATE TABLE public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kk_gereja TEXT UNIQUE NOT NULL,
    nama_kepala TEXT NOT NULL,
    alamat TEXT,
    lingkungan_id UUID REFERENCES public.lingkungan(id),
    wilayah_id UUID REFERENCES public.wilayah(id),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    foto_rumah_url TEXT,
    status_aktif BOOLEAN DEFAULT TRUE,
    catatan_pastoral TEXT,
    qr_token TEXT,
    qr_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ROLES (Digital Roles)
-- ============================================
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    access_layer INTEGER NOT NULL CHECK (access_layer BETWEEN 0 AND 10),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (role_name, display_name, access_layer, description) VALUES
    ('super_admin', 'Super Admin', 10, 'Akses teknis penuh'),
    ('pastor', 'Pastor Paroki', 9, 'Dashboard pastoral penuh'),
    ('vikaris', 'Vikaris', 9, 'Asisten Pastor'),
    ('wakil_ketua', 'Wakil Ketua DPP', 8, 'Ketua DPP & Tim Audit'),
    ('tim_audit', 'Tim Audit', 8, 'Akses audit keuangan'),
    ('koordinator_bidang', 'Koordinator Bidang', 7, 'Program kerja & kegiatan'),
    ('sub_koordinator', 'Sub Koordinator', 7, 'Asisten koordinator bidang'),
    ('bendahara_ii', 'Bendahara II', 6, 'Keuangan RK-1 & RK-2'),
    ('bendahara_iii', 'Bendahara III', 6, 'Keuangan RK-3 (Fase 4)'),
    ('sekretaris', 'Sekretaris I/II', 5, 'Verifikasi & administrasi'),
    ('ketua_lingkungan', 'Ketua Lingkungan', 4, 'Verifikasi wilayah'),
    ('wali_digital', 'Wali Digital', 3, 'Proxy terbatas'),
    ('umat', 'Umat Terverifikasi', 2, 'Akses fitur pastoral dasar'),
    ('operator_ict', 'Operator ICT', 10, 'Dukungan teknis'),
    ('kurator_liturgis', 'Kurator Liturgis', 5, 'Konten liturgi'),
    ('mitra_eksternal', 'Mitra Eksternal', 0, 'App 2 — Ekonomi')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================
-- 5. PROFILES (ekstensi dari auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identitas
    full_name TEXT NOT NULL,
    baptism_name TEXT,
    nik TEXT,
    gender CHAR(1) CHECK (gender IN ('L','P')),
    date_of_birth DATE,
    place_of_birth TEXT,
    blood_type TEXT CHECK (blood_type IN ('A','B','AB','O')),
    photo_url TEXT,

    -- Kontak
    phone TEXT,
    email TEXT,

    -- Organisasi
    family_id UUID REFERENCES public.families(id),
    lingkungan_id UUID REFERENCES public.lingkungan(id),
    wilayah_id UUID REFERENCES public.wilayah(id),

    -- Akses & Status
    role TEXT DEFAULT 'umat' CHECK (role IN (
        'umat','pastor','vikaris','wali_digital',
        'ketua_lingkungan','sekretaris','bendahara_ii',
        'bendahara_iii','koordinator_bidang','sub_koordinator',
        'wakil_ketua','tim_audit','operator_ict','super_admin','kurator_liturgis'
    )),
    access_layer INTEGER DEFAULT 1 CHECK (access_layer BETWEEN 0 AND 10),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending','active','inactive','suspended'
    )),

    -- Pastoral
    komunitas_gereja TEXT[],
    minat_pelayanan TEXT[],
    catatan_pastoral TEXT,
    kondisi_kesehatan TEXT,
    is_lansia BOOLEAN DEFAULT FALSE,
    is_disabilitas BOOLEAN DEFAULT FALSE,
    tinggal_sendiri BOOLEAN DEFAULT FALSE,

    -- QR & Kartu Anggota
    qr_token TEXT,
    qr_expires_at TIMESTAMPTZ,

    -- Metadata
    fcm_token TEXT,
    last_morning_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-set is_lansia berdasarkan umur
CREATE OR REPLACE FUNCTION check_lansia()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        NEW.is_lansia := EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) >= 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_lansia BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION check_lansia();

-- ============================================
-- 6. USER ROLES (many-to-many)
-- ============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ============================================
-- 7. DIGITAL VAULT
-- ============================================
CREATE TABLE public.digital_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    doc_type TEXT NOT NULL CHECK (doc_type IN (
        'ktp','kk','akte_lahir','surat_baptis','surat_nikah_gereja',
        'surat_komuni','surat_krisma','surat_keterangan_belum_menikah',
        'surat_baptis_wali','sertifikat_baptis','sertifikat_pernikahan',
        'sertifikat_krisma','sertifikat_komuni','lainnya'
    )),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.parish_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lingkungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_vault ENABLE ROW LEVEL SECURITY;