-- Migration 002: Financial System — Dual-Ledger Engine
-- Ref: GDD Bab XI "Dual-Ledger Financial Engine"

-- ============================================
-- 1. REKENINGS (Chart of Accounts)
-- ============================================
CREATE TABLE public.rekenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    tipe TEXT NOT NULL CHECK (tipe IN ('rk_operasional','rk_sosial','rk_ekonomi','rk_lainnya')),
    ledger TEXT NOT NULL CHECK (ledger IN ('A','B')),
    saldo DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    aktif_di_fase INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.rekenings (kode, nama, deskripsi, tipe, ledger, aktif_di_fase) VALUES
    ('RK-1', 'RK-1 Operasional', 'Rekening Kas Operasional Paroki — Ledger A', 'rk_operasional', 'A', 0),
    ('RK-2', 'RK-2 Dana Sosial & Kasih', 'Rekening Dana Sosial dan Kasih — Ledger A', 'rk_sosial', 'A', 0),
    ('RK-3', 'RK-3 Ekonomi & Digital', 'Rekening Ekonomi dan Digital — Ledger B (aktif Fase 4)', 'rk_ekonomi', 'B', 4);

-- ============================================
-- 2. FINANCIAL TRANSACTIONS
-- ============================================
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rekening_id UUID NOT NULL REFERENCES public.rekenings(id),
    jenis TEXT NOT NULL CHECK (jenis IN ('masuk','keluar','transfer')),
    nominal DECIMAL(15,2) NOT NULL CHECK (nominal > 0),
    keterangan TEXT,
    kategori TEXT,
    input_by UUID NOT NULL REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','flagged')),
    flag_reason TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. KOLEKTE ENTRIES (Blind Dual-Entry)
-- ============================================
CREATE TABLE public.kolekte_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    misa_name TEXT NOT NULL,
    misa_date DATE NOT NULL,
    bendahara_a_id UUID NOT NULL REFERENCES public.profiles(id),
    bendahara_b_id UUID NOT NULL REFERENCES public.profiles(id),
    bendahara_a_input DECIMAL(15,2),
    bendahara_b_input DECIMAL(15,2),
    bendahara_a_submitted BOOLEAN DEFAULT FALSE,
    bendahara_b_submitted BOOLEAN DEFAULT FALSE,
    matched_amount DECIMAL(15,2),
    status TEXT DEFAULT 'blind' CHECK (status IN ('blind','matched','flagged','resolved')),
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. MULTI-SIGNATURE APPROVALS
-- ============================================
CREATE TABLE public.multi_signature_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaksi_id UUID NOT NULL REFERENCES public.financial_transactions(id),
    approver_id UUID NOT NULL REFERENCES public.profiles(id),
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    role_at_time TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.rekenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kolekte_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_signature_approvals ENABLE ROW LEVEL SECURITY;