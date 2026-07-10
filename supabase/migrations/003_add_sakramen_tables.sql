-- Migration 003: Sacrament Tables
-- Ref: GDD Bab IV.2 "Schema PUBLIC" — sacrament tables

-- ============================================
-- 1. SAKRAMEN REGISTRATIONS (generic workflow)
-- ============================================
CREATE TABLE public.sakramen_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    jenis TEXT NOT NULL CHECK (jenis IN ('baptis','perkawinan','pengurapan','komuni','krisma')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected','cancelled')),
    data_form JSONB,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. BAPTISM (Kanon 842-878)
-- ============================================
CREATE TABLE public.baptisms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    family_id UUID REFERENCES public.families(id),

    -- Data Sakramental (Kanon 877)
    child_name TEXT NOT NULL,
    child_baptism_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    place_of_birth TEXT NOT NULL,
    baptism_date DATE,
    baptism_church TEXT,
    minister_name TEXT,
    book_number TEXT,
    page_number TEXT,
    entry_number TEXT,

    -- Orang Tua
    father_name TEXT,
    father_religion TEXT,
    mother_name TEXT,
    mother_religion TEXT,
    parents_married_in_church BOOLEAN DEFAULT FALSE,

    -- Wali Baptis (Kanon 872-874)
    godparent1_name TEXT NOT NULL,
    godparent1_parish TEXT,
    godparent2_name TEXT,
    godparent2_parish TEXT,

    -- Workflow
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending','catechesis_review','admin_review',
        'kl_esign','liturgy_scheduled','completed','rejected','cancelled'
    )),
    workflow_stage TEXT,

    -- Approval trail
    catechesis_approved_by UUID REFERENCES public.profiles(id),
    catechesis_approved_at TIMESTAMPTZ,
    admin_approved_by UUID REFERENCES public.profiles(id),
    admin_approved_at TIMESTAMPTZ,
    kl_esignature TEXT,
    kl_esigned_at TIMESTAMPTZ,
    kl_id UUID REFERENCES public.profiles(id),

    -- Dokumen
    vault_document_ids UUID[],
    certificate_url TEXT,

    -- Metadata
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MARRIAGE (Kanon 1055-1165)
-- ============================================
CREATE TABLE public.marriages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groom_id UUID NOT NULL REFERENCES public.profiles(id),
    bride_id UUID NOT NULL REFERENCES public.profiles(id),
    marriage_type TEXT NOT NULL CHECK (marriage_type IN (
        'katolik_katolik','katolik_non_katolik','katolik_non_baptis'
    )),
    marriage_date DATE,
    marriage_church TEXT,
    minister_name TEXT,

    -- Kanonik
    dispensation_type TEXT,
    dispensation_granted BOOLEAN DEFAULT FALSE,
    dispensation_date DATE,
    announcement_dates DATE[],
    impediment_check BOOLEAN DEFAULT FALSE,

    -- Register (Kanon 1121)
    book_number TEXT,
    page_number TEXT,
    entry_number TEXT,
    notified_origin_parish BOOLEAN DEFAULT FALSE,

    -- Witness
    witness1_name TEXT,
    witness2_name TEXT,

    -- Workflow
    status TEXT DEFAULT 'pending',
    workflow_stage TEXT,

    -- Approval trail
    kl_groom_esign TEXT,
    kl_bride_esign TEXT,
    pastor_interview_date DATE,

    vault_document_ids UUID[],
    certificate_url TEXT,

    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ANOINTING (Pengurapan Orang Sakit — Kanon 998-1007)
-- ============================================
CREATE TABLE public.anointings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    minister_id UUID REFERENCES public.profiles(id),
    is_emergency BOOLEAN DEFAULT FALSE,
    -- sos_id added after pastoral_sos table is created (see migration 005)
    anointing_date DATE,
    location TEXT,
    condition TEXT,
    book_number TEXT,
    page_number TEXT,
    entry_number TEXT,
    status TEXT DEFAULT 'pending',
    certificate_url TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. E-SIGNATURES
-- ============================================
CREATE TABLE public.e_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.sakramen_registrations(id),
    signer_id UUID NOT NULL REFERENCES public.profiles(id),
    signer_role TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    signature_data TEXT,
    is_valid BOOLEAN DEFAULT TRUE
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.sakramen_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baptisms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anointings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_signatures ENABLE ROW LEVEL SECURITY;