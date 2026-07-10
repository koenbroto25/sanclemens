-- Migration 007: Dana Kasih, Marketplace & Aset
-- Ref: GDD Bab XI "Dual-Ledger Financial Engine", Bab IV.2

-- ============================================
-- 1. DANA KASIH
-- ============================================
CREATE TABLE public.dana_kasih (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis TEXT NOT NULL CHECK (jenis IN ('personal','komunitas')),
    judul TEXT NOT NULL,
    deskripsi TEXT,

    -- Target & Progress
    target_amount DECIMAL(12,2),
    collected_amount DECIMAL(12,2) DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft','aktif','verifikasi_seksos','cair','selesai','batal'
    )),

    -- Penerima (privat)
    is_anonymous_receiver BOOLEAN DEFAULT FALSE,
    receiver_umat_id UUID REFERENCES public.profiles(id),
    receiver_account_info TEXT,

    -- Batas bantuan
    max_amount DECIMAL(12,2) DEFAULT 5000000,
    requires_pastor_approval BOOLEAN DEFAULT FALSE,

    -- Verifikasi Seksos
    verified_by_seksos UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    verification_photo_urls TEXT[],

    -- Escrow (Xendit)
    xendit_invoice_id TEXT,
    xendit_va_number TEXT,

    -- Pencairan
    disbursed_amount DECIMAL(12,2),
    disbursed_at TIMESTAMPTZ,
    disbursed_by UUID REFERENCES public.profiles(id),
    disbursed_approved_by UUID REFERENCES public.profiles(id),
    disbursement_proof_url TEXT,

    -- Laporan publik (anonim)
    impact_narrative TEXT,
    impact_photo_urls TEXT[],

    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. DANA KASIH DONORS
-- ============================================
CREATE TABLE public.dana_kasih_donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dana_kasih_id UUID NOT NULL REFERENCES public.dana_kasih(id),
    donor_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT,
    xendit_payment_id TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MARKETPLACE PRODUCTS (Fase 4)
-- ============================================
CREATE TABLE public.marketplace_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    penjual_id UUID NOT NULL REFERENCES public.profiles(id),
    nama TEXT NOT NULL,
    deskripsi TEXT,
    harga DECIMAL(12,2) NOT NULL,
    stok INTEGER DEFAULT 0,
    kategori TEXT,
    foto_urls TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','inactive','archived')),
    endorsed_by UUID REFERENCES public.profiles(id),
    endorsed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. MARKETPLACE ORDERS (Fase 4)
-- ============================================
CREATE TABLE public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pembeli_id UUID NOT NULL REFERENCES public.profiles(id),
    produk_id UUID NOT NULL REFERENCES public.marketplace_products(id),
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    total DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending','paid','processed','shipped','delivered','cancelled','refunded'
    )),
    xendit_payment_id TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ASET PAROKI
-- ============================================
CREATE TABLE public.aset_paroki (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL CHECK (jenis IN (
        'tanah_bangunan','kendaraan','peralatan_liturgi',
        'peralatan_kantor_it','aset_digital'
    )),
    deskripsi TEXT,
    nilai_perolehan DECIMAL(15,2),
    tanggal_perolehan DATE,
    masa_berlaku DATE,
    status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','rusak','dihibahkan','dijual')),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.dana_kasih ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dana_kasih_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aset_paroki ENABLE ROW LEVEL SECURITY;