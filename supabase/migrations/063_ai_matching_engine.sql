-- Migration: AI Schema - Matching Engine (Bot 7 Klemen Kerja)
-- Created: 19 June 2026
-- Purpose: AI-powered job matching, worker matching, and assistance matching

-- Table: public.lowongan_kerja (Job Postings)
-- Handle existing table from partial migration
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lowongan_kerja') THEN
        -- Table exists, add missing columns
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS lingkungan_id UUID REFERENCES public.lingkungan(id);
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS estimasi_gaji TEXT;
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS durasi TEXT CHECK (durasi IN ('harian','mingguan','bulanan','tetap','proyek'));
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS priority_boost BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days';
    ELSE
        -- Create new table
        CREATE TABLE public.lowongan_kerja (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pemasang_id UUID NOT NULL REFERENCES public.profiles(id),
            jenis_pekerjaan TEXT NOT NULL,
            deskripsi TEXT NOT NULL,
            lokasi TEXT NOT NULL,
            lingkungan_id UUID REFERENCES public.lingkungan(id),
            estimasi_gaji TEXT,
            durasi TEXT CHECK (durasi IN ('harian','mingguan','bulanan','tetap','proyek')),
            status TEXT DEFAULT 'open' CHECK (status IN ('open','matched','filled','closed','expired')),
            is_verified BOOLEAN DEFAULT FALSE,
            tags TEXT[] DEFAULT '{}',
            priority_boost BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lowongan_kerja_status ON lowongan_kerja(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_lowongan_kerja_lingkungan ON lowongan_kerja(lingkungan_id);
CREATE INDEX IF NOT EXISTS idx_lowongan_kerja_tags ON lowongan_kerja USING GIN(tags);

-- Table: public.tenaga_kerja (Worker Profiles)
CREATE TABLE IF NOT EXISTS public.tenaga_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    keahlian TEXT[] NOT NULL,
    pengalaman_tahun INTEGER DEFAULT 0,
    preferensi_lokasi TEXT[] DEFAULT '{}',
    preferensi_durasi TEXT[] DEFAULT '{}',
    estimasi_upah TEXT,
    tersedia BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_jobs_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenaga_kerja_tersedia ON tenaga_kerja(tersedia);
CREATE INDEX IF NOT EXISTS idx_tenaga_kerja_keahlian ON tenaga_kerja USING GIN(keahlian);
CREATE INDEX IF NOT EXISTS idx_tenaga_kerja_user ON tenaga_kerja(profile_id);

-- Table: public.lowongan_lamaran (Job Applications)
CREATE TABLE IF NOT EXISTS public.lowongan_lamaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lowongan_id UUID NOT NULL REFERENCES public.lowongan_kerja(id) ON DELETE CASCADE,
    pelamar_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'melamar' CHECK (status IN ('melamar','diterima','ditolak','batal','interview')),
    catatan_pelamar TEXT,
    employer_notes TEXT,
    match_score DECIMAL(4,3),           -- AI match score at time of application
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lowongan_id, pelamar_id)
);

CREATE INDEX IF NOT EXISTS idx_lamaran_lowongan ON lowongan_lamaran(lowongan_id);
CREATE INDEX IF NOT EXISTS idx_lamaran_pelamar ON lowongan_lamaran(pelamar_id);
CREATE INDEX IF NOT EXISTS idx_lamaran_status ON lowongan_lamaran(status);

-- Table: public.donatur_potensial (Potential Donors)
CREATE TABLE IF NOT EXISTS public.donatur_potensial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    preferensi TEXT[] NOT NULL,         -- ['sembako','medis','pendidikan','perumahan']
    preferensi_anonim BOOLEAN DEFAULT TRUE,
    preferensi_lokasi TEXT[] DEFAULT '{}',
    max_per_bulan DECIMAL(12,2),
    total_donasi_30d DECIMAL(12,2) DEFAULT 0,
    last_donated_at TIMESTAMPTZ,
    is_aktif BOOLEAN DEFAULT TRUE,
    is_emergency_donor BOOLEAN DEFAULT FALSE,  -- Untuk donasi darurat
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donatur_aktif ON donatur_potensial(is_aktif, preferensi);
CREATE INDEX IF NOT EXISTS idx_donatur_user ON donatur_potensial(profile_id);

-- Table: public.umat_needs (Extended from v4 with new fields)
-- Add new columns if not exists
ALTER TABLE IF EXISTS public.umat_needs ADD COLUMN IF NOT EXISTS
    intent_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.umat_needs ADD COLUMN IF NOT EXISTS
    last_ai_interaction TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.umat_needs ADD COLUMN IF NOT EXISTS
    matched_jobs_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.umat_needs ADD COLUMN IF NOT EXISTS
    matched_assistance_count INTEGER DEFAULT 0;

-- RLS Policies
ALTER TABLE public.lowongan_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenaga_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowongan_lamaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donatur_potensial ENABLE ROW LEVEL SECURITY;

-- Lowongan kerja: authenticated users can read open jobs, owner can manage
CREATE POLICY lowongan_read_all ON public.lowongan_kerja
    FOR SELECT TO authenticated USING (status != 'draft');

CREATE POLICY lowongan_write_own ON public.lowongan_kerja
    FOR INSERT TO authenticated WITH CHECK (pemasang_id = auth.uid());

CREATE POLICY lowongan_update_own ON public.lowongan_kerja
    FOR UPDATE TO authenticated USING (pemasang_id = auth.uid());

-- Tenaga kerja: authenticated users can read all, owner can manage
CREATE POLICY tenaga_read_all ON public.tenaga_kerja
    FOR SELECT TO authenticated USING (true);

CREATE POLICY tenaga_write_own ON public.tenaga_kerja
    FOR ALL TO authenticated USING (profile_id = auth.uid());

-- Lamaran: applicants can read own applications, employers can read their job applications
CREATE POLICY lamaran_read_applicant ON public.lowongan_lamaran
    FOR SELECT TO authenticated USING (pelamar_id = auth.uid());

CREATE POLICY lamaran_read_employer ON public.lowongan_lamaran
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.lowongan_kerja WHERE id = lowongan_id AND pemasang_id = auth.uid())
    );

CREATE POLICY lamaran_insert_applicant ON public.lowongan_lamaran
    FOR INSERT TO authenticated WITH CHECK (pelamar_id = auth.uid());

-- Donatur: only owner can read own profile
CREATE POLICY donatur_read_own ON public.donatur_potensial
    FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY donatur_write_own ON public.donatur_potensial
    FOR ALL TO authenticated USING (profile_id = auth.uid());

-- Matching engine service role can read all for matching purposes
-- This will be handled by service_role key in backend

-- Comments
COMMENT ON TABLE public.lowongan_kerja IS 'Job postings for Klemen Kerja matching engine';
COMMENT ON TABLE public.tenaga_kerja IS 'Worker profiles with skills and availability';
COMMENT ON TABLE public.lowongan_lamaran IS 'Job applications tracking match scores and status';
COMMENT ON TABLE public.donatur_potensial IS 'Potential donors with preferences for assistance matching';
COMMENT ON TABLE public.umat_needs IS 'Extended with intent detection and matching tracking for v5';