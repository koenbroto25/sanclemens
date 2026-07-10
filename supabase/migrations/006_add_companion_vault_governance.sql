-- Migration 006: Companion, WDL, Governance, and Vault Extensions
-- Ref: GDD Bab XII "AI Companion Backend", AISPEC Bab II.2

-- ============================================
-- 1. COMPANION SESSIONS
-- ============================================
CREATE TABLE public.companion_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    mode TEXT NOT NULL CHECK (mode IN (
        'pendengar','penuntun_doa','penjelajah_iman',
        'pendamping_krisis','pengingat_ibadah','deteksi_kerentanan'
    )),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','selesai','expired')),
    metadata JSONB
);

-- ============================================
-- 2. COMPANION TRANSCRIPTS (E2E Encrypted)
-- ============================================
CREATE TABLE public.companion_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.companion_sessions(id),
    pesan TEXT NOT NULL,  -- E2E encrypted
    role TEXT NOT NULL CHECK (role IN ('user','ai')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- ============================================
-- 3. SURAT PASTORAL (Encrypted)
-- ============================================
CREATE TABLE public.surat_pastoral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pastor_id UUID NOT NULL REFERENCES public.profiles(id),
    konten TEXT NOT NULL,  -- E2E encrypted
    judul TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. WDL CONSENT
-- ============================================
CREATE TABLE public.wdl_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    umat_id UUID NOT NULL REFERENCES public.profiles(id),
    wdl_profile_id UUID NOT NULL REFERENCES public.profiles(id),
    scope TEXT[] NOT NULL,
    consent_doc_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.profiles(id),
    revoked_reason TEXT,
    abuse_report_at TIMESTAMPTZ,
    abuse_report_notes TEXT
);

CREATE TABLE public.wdl_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL REFERENCES public.wdl_consent(id),
    wdl_id UUID NOT NULL REFERENCES public.profiles(id),
    umat_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- ============================================
-- 5. GOVERNANCE — Program Kerja
-- ============================================
CREATE TABLE public.governance_program_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidang_id UUID,
    nama TEXT NOT NULL,
    pic_id UUID REFERENCES public.profiles(id),
    timeline JSONB,
    anggaran DECIMAL(15,2),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','completed','cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. GOVERNANCE — RKAP
-- ============================================
CREATE TABLE public.governance_rkap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun INTEGER NOT NULL,
    versi INTEGER NOT NULL DEFAULT 1,
    data JSONB NOT NULL,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tahun, versi)
);

-- ============================================
-- 7. GOVERNANCE — Keputusan DPP (IMMUTABLE)
-- ============================================
CREATE TABLE public.governance_keputusan_dpp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    topik TEXT NOT NULL,
    bidang TEXT,
    keputusan TEXT NOT NULL,
    immutable BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. GOVERNANCE — Notulen
-- ============================================
CREATE TABLE public.governance_notulen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    peserta TEXT[],
    agenda TEXT NOT NULL,
    notulen TEXT NOT NULL,
    action_items JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. GOVERNANCE — KPI
-- ============================================
CREATE TABLE public.governance_kpi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidang_id UUID,
    tahun INTEGER NOT NULL,
    triwulan INTEGER NOT NULL CHECK (triwulan BETWEEN 1 AND 4),
    indikator TEXT NOT NULL,
    target TEXT,
    aktual TEXT,
    status TEXT CHECK (status IN ('on_track','need_attention','behind','completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. GOVERNANCE — Evaluasi
-- ============================================
CREATE TABLE public.governance_evaluasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidang_id UUID,
    triwulan INTEGER NOT NULL CHECK (triwulan BETWEEN 1 AND 4),
    isi TEXT NOT NULL,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.companion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_pastoral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wdl_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wdl_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_program_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_rkap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_keputusan_dpp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_notulen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_evaluasi ENABLE ROW LEVEL SECURITY;