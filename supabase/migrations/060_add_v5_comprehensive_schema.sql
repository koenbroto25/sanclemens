-- ============================================
-- PHASE 1: COMPREHENSIVE SCHEMA v5.3
-- Migration 060 - 25 Juni 2026
-- ============================================

-- Extend Tabel profiles dengan kolom baru
-- ============================================

-- Identitas Dasar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nik TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nama_baptis TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tempat_lahir TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_perkawinan TEXT CHECK (status_perkawinan IN ('belum_kawin', 'kawin', 'cerai'));

-- Kontak & Alamat
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alamat_lengkap TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rt TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rw TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kelurahan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kecamatan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kota TEXT DEFAULT 'BALIKPAPAN';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provinsi TEXT DEFAULT 'KALIMANTAN TIMUR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS koordinat_lat DECIMAL(10,8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS koordinat_lng DECIMAL(11,8);

-- Pendidikan & Pekerjaan
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pendidikan_terakhir TEXT CHECK (pendidikan_terakhir IN ('SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'S3'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pekerjaan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instansi_pekerjaan TEXT;

-- Digital Presence
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foto_profil_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_address TEXT DEFAULT 'netral' CHECK (preferred_address IN ('bapak','ibu','mas','mbak','kak','nama_langsung','netral'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bot_verbosity TEXT DEFAULT 'normal' CHECK (bot_verbosity IN ('ringkas','normal','detail'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_portal TEXT CHECK (last_active_portal IN ('paroki','lingkungan','marketplace'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_bot_interaction TIMESTAMPTZ;

-- AI & Matching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_companion_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_matching_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emotional_signal_last_session TEXT DEFAULT 'neutral' CHECK (emotional_signal_last_session IN ('neutral','positive','distress_mild','distress_moderate','emergency'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emotional_signal_updated_at TIMESTAMPTZ;

-- Emergency Contact
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Audit
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_nik ON public.profiles(nik);
CREATE INDEX IF NOT EXISTS idx_profiles_lingkungan ON public.profiles(lingkungan_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- TABEL BARU: keluarga (KK)
-- ============================================

CREATE TABLE IF NOT EXISTS public.keluarga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_kk TEXT UNIQUE NOT NULL,
    kepala_keluarga_id UUID REFERENCES public.profiles(id),
    alamat_lengkap TEXT,
    rt TEXT,
    rw TEXT,
    kelurahan TEXT,
    kecamatan TEXT,
    kota TEXT DEFAULT 'BALIKPAPAN',
    provinsi TEXT DEFAULT 'KALIMANTAN TIMUR',
    lingkungan_id UUID REFERENCES public.lingkungan(id),
    status_ekonomi TEXT CHECK (status_ekonomi IN ('prasejahtera', 'sejahtera', 'mampu', 'kurang_mampu', 'tidak_mampu')),
    penghasilan_total_perbulan NUMERIC,
    jumlah_anggota INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keluarga_no_kk ON public.keluarga(no_kk);
CREATE INDEX IF NOT EXISTS idx_keluarga_lingkungan ON public.keluarga(lingkungan_id);

-- ============================================
-- TABEL BARU: anggota_keluarga
-- ============================================

CREATE TABLE IF NOT EXISTS public.anggota_keluarga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID REFERENCES public.keluarga(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    hubungan_keluarga TEXT CHECK (hubungan_keluarga IN ('kepala', 'istri', 'anak', 'ortu', 'famili_lain')),
    urutan_anak INTEGER,
    status_perkawinan_dalam_keluarga TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(keluarga_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_anggota_keluarga ON public.anggota_keluarga(keluarga_id);
CREATE INDEX IF NOT EXISTS idx_anggota_profile ON public.anggota_keluarga(profile_id);

-- ============================================
-- TABEL BARU: sakramen_user
-- ============================================

CREATE TABLE IF NOT EXISTS public.sakramen_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    jenis_sakramen TEXT CHECK (jenis_sakramen IN ('baptis', 'eftar', 'koma', 'penguatan', 'matrimonium', 'ordo', 'batu_kepala')),
    tanggal_sakramen DATE,
    tempat_sakramen TEXT,
    nama_orang_tua_baptis TEXT,
    nama_penterjemah TEXT,
    nama_prelat TEXT,
    sertifikat_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_sakramen_user ON public.sakramen_user(user_id);
CREATE INDEX IF NOT EXISTS idx_sakramen_jenis ON public.sakramen_user(jenis_sakramen);

-- ============================================
-- TABEL BARU: usaha_umat (Business Directory)
-- ============================================

CREATE TABLE IF NOT EXISTS public.usaha_umat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nama_usaha TEXT NOT NULL,
    kategori_usaha TEXT NOT NULL CHECK (kategori_usaha IN ('supplier_sembako', 'bengkel', 'kuliner', 'pertanian', 'jasa_kurir', 'tukang', 'teknisi', 'edukasi', 'kesehatan', 'legal', 'keuangan', 'teknologi', 'kreatif', 'lainnya')),
    deskripsi TEXT,
    logo_url TEXT,
    alamat_usaha TEXT,
    koordinat_lat DECIMAL(10,8),
    koordinat_lng DECIMAL(11,8),
    no_wa TEXT,
    jam_operasional TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    can_deliver BOOLEAN DEFAULT FALSE,
    service_radius_km INTEGER DEFAULT 5,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_transaksi INTEGER DEFAULT 0,
    is_charity_friendly BOOLEAN DEFAULT FALSE,
    charity_discount_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usaha_user ON public.usaha_umat(user_id);
CREATE INDEX IF NOT EXISTS idx_usaha_kategori ON public.usaha_umat(kategori_usaha);
CREATE INDEX IF NOT EXISTS idx_usaha_aktif ON public.usaha_umat(is_active);

-- ============================================
-- TABEL BARU: charity_services (Volunteer Jasa)
-- ============================================

CREATE TABLE IF NOT EXISTS public.charity_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kategori_jasa TEXT NOT NULL CHECK (kategori_jasa IN ('kesehatan', 'pendidikan', 'konseling', 'hukum', 'teknisi', 'spiritual', 'administrasi', 'transportasi', 'lainnya')),
    deskripsi_jasa TEXT NOT NULL,
    spesialisasi TEXT[],
    syarat_penerima TEXT,
    cara_kontak TEXT,
    waktu_tersedia TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    max_recipients_perbulan INTEGER DEFAULT 10,
    current_recipients INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charity_user ON public.charity_services(user_id);
CREATE INDEX IF NOT EXISTS idx_charity_kategori ON public.charity_services(kategori_jasa);
CREATE INDEX IF NOT EXISTS idx_charity_aktif ON public.charity_services(is_active);

-- ============================================
-- TABEL BARU: charity_requests
-- ============================================

CREATE TABLE IF NOT EXISTS public.charity_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    recipient_id UUID REFERENCES public.profiles(id),
    kategori_bantuan TEXT NOT NULL CHECK (kategori_bantuan IN ('medis', 'pendidikan', 'material', 'spiritual', 'transportasi', 'teknisi', 'legal', 'lainnya')),
    deskripsi TEXT NOT NULL,
    urgency_level TEXT CHECK (urgency_level IN ('rendah', 'sedang', 'tinggi', 'darurat')),
    koordinat_lat DECIMAL(10,8),
    koordinat_lng DECIMAL(11,8),
    needed_by_date DATE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled')),
    matched_volunteer_id UUID REFERENCES public.profiles(id),
    matched_service_id UUID REFERENCES public.charity_services(id),
    matched_at TIMESTAMPTZ,
    notified_volunteers JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charity_req_requester ON public.charity_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_charity_req_status ON public.charity_requests(status);
CREATE INDEX IF NOT EXISTS idx_charity_req_kategori ON public.charity_requests(kategori_bantuan);

-- ============================================
-- TABEL BARU: user_skills
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    category TEXT,
    skill_level TEXT CHECK (skill_level IN ('pemula', 'menengah', 'ahli', 'ahli_bersertifikat')),
    experience_years INTEGER,
    description TEXT,
    portfolio_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON public.user_skills(category);

-- ============================================
-- TABEL: umat_needs (already exists, add missing columns)
-- ============================================

-- Add columns if missing
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS need_type TEXT CHECK (need_type IN ('material', 'pekerjaan', 'pendidikan', 'kesehatan', 'psikologis', 'spiritual', 'barang', 'jasa'));
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS urgency_level TEXT CHECK (urgency_level IN ('rendah', 'sedang', 'tinggi', 'darurat'));
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS is_gakin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS gakin_verified_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS gakin_verified_at TIMESTAMPTZ;
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fulfilled', 'closed'));
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS matched_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ;
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS ai_recommended_match_score DECIMAL(3,2);
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS ai_notes TEXT;
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.umat_needs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes only if table has the required columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'umat_needs' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_umat_needs_user ON public.umat_needs(user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'umat_needs' AND column_name = 'need_type') THEN
        CREATE INDEX IF NOT EXISTS idx_umat_needs_type ON public.umat_needs(need_type);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'umat_needs' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_umat_needs_status ON public.umat_needs(status);
    END IF;
END $$;

-- ============================================
-- TABEL BARU: user_ai_settings
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    openrouter_api_key TEXT,
    gemini_api_key TEXT,
    is_using_own_api BOOLEAN DEFAULT FALSE,
    ai_companion_enabled BOOLEAN DEFAULT TRUE,
    ai_matching_enabled BOOLEAN DEFAULT TRUE,
    ai_personalization_level TEXT CHECK (ai_personalization_level IN ('minimal', 'moderate', 'full')),
    show_business_to_others BOOLEAN DEFAULT TRUE,
    show_skills_to_others BOOLEAN DEFAULT TRUE,
    allow_charity_matching BOOLEAN DEFAULT TRUE,
    show_location_for_matching BOOLEAN DEFAULT FALSE,
    notify_job_matches BOOLEAN DEFAULT TRUE,
    notify_charity_requests BOOLEAN DEFAULT TRUE,
    notify_sos_alerts BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_settings_user ON public.user_ai_settings(user_id);

-- ============================================
-- TABEL BARU: sos_abuse_tracker
-- ============================================

CREATE TABLE IF NOT EXISTS public.sos_abuse_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    trigger_count_30d INTEGER DEFAULT 0,
    last_trigger_at TIMESTAMPTZ,
    restriction_level INTEGER DEFAULT 0 CHECK (restriction_level IN (0, 1, 2, 3)),
    restriction_until TIMESTAMPTZ,
    restriction_reason TEXT,
    flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_abuse_user ON public.sos_abuse_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_abuse_restriction ON public.sos_abuse_tracker(restriction_level);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.keluarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota_keluarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sakramen_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usaha_umat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umat_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_abuse_tracker ENABLE ROW LEVEL SECURITY;

-- Policies untuk keluarga
CREATE POLICY "Users can manage own keluarga" ON public.keluarga FOR ALL USING (
    kepala_keluarga_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.anggota_keluarga WHERE keluarga_id = id AND profile_id = auth.uid())
);

-- Policies untuk anggota_keluarga
CREATE POLICY "Users can view own keluarga members" ON public.anggota_keluarga FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.keluarga WHERE id = keluarga_id AND kepala_keluarga_id = auth.uid())
);
CREATE POLICY "Users can insert own keluarga members" ON public.anggota_keluarga FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.keluarga WHERE id = keluarga_id AND kepala_keluarga_id = auth.uid())
);

-- Policies untuk sakramen_user
CREATE POLICY "Users can view own sakramen" ON public.sakramen_user FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sakramen" ON public.sakramen_user FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all sakramen" ON public.sakramen_user FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'pastor', 'ketua_lingkungan'))
);

-- Policies untuk usaha_umat
CREATE POLICY "Users can manage own usaha" ON public.usaha_umat FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Public can view active usaha" ON public.usaha_umat FOR SELECT USING (is_active = TRUE);

-- Policies untuk charity_services
CREATE POLICY "Users can manage own charity" ON public.charity_services FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Public can view verified charity" ON public.charity_services FOR SELECT USING (is_verified = TRUE AND is_active = TRUE);

-- Policies untuk charity_requests
CREATE POLICY "Public can view charity requests" ON public.charity_requests FOR SELECT USING (TRUE);
CREATE POLICY "Users can create charity requests" ON public.charity_requests FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can update own requests" ON public.charity_requests FOR UPDATE USING (requester_id = auth.uid() OR matched_volunteer_id = auth.uid());

-- Policies untuk user_skills
CREATE POLICY "Users can manage own skills" ON public.user_skills FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Public can view skills" ON public.user_skills FOR SELECT USING (TRUE);

-- Policies untuk umat_needs
CREATE POLICY "Users can manage own needs" ON public.umat_needs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all needs" ON public.umat_needs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'pastor', 'ketua_lingkungan'))
);

-- Policies untuk user_ai_settings
CREATE POLICY "Users can manage own settings" ON public.user_ai_settings FOR ALL USING (user_id = auth.uid());

-- Policies untuk sos_abuse_tracker
CREATE POLICY "Users can view own SOS status" ON public.sos_abuse_tracker FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all SOS status" ON public.sos_abuse_tracker FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'pastor', 'ketua_lingkungan'))
);

-- ============================================
-- LOG MIGRATION (optional, ignore if table doesn't exist)
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_migration_log') THEN
        INSERT INTO public._migration_log (phase, description, executed_at, success)
        VALUES ('phase_1', 'add_v5_comprehensive_schema', NOW(), TRUE);
    END IF;
END $$;
