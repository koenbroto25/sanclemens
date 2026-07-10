-- FASE 4: EKONOMI INTERNAL
-- Migration 048: Tabel untuk Ojek Internal, Local Ads, RK-3
-- FASE 6: AI & MATCHING SOLIDARITAS
-- Tabel untuk Klemen Kerja, Matching, Donatur
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- FASE 4: EKONOMI INTERNAL
-- ═══════════════════════════════════════════════════════════

-- 1. OJEK INTERNAL (Sub-Fase 4.2)
CREATE TABLE IF NOT EXISTS public.ojek_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    lingkungan_id UUID NOT NULL REFERENCES public.lingkungan(id),
    kendaraan TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'aktif', 'nonaktif')),
    total_pengantaran INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ojek_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,  -- Akan di-refer ke public.orders(id) saat Fase 4 marketplace penuh
    driver_id UUID REFERENCES public.ojek_drivers(id),
    pemesan_id UUID NOT NULL REFERENCES public.profiles(id),
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    status TEXT DEFAULT 'menunggu_driver' CHECK (status IN ('menunggu_driver', 'driver_ditemukan', 'diambil', 'diantar', 'selesai', 'dibatalkan')),
    biaya_antar DECIMAL(12,2),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ojek_orders_status ON public.ojek_orders(status);
CREATE INDEX IF NOT EXISTS idx_ojek_orders_driver ON public.ojek_orders(driver_id);

-- 2. RK-3 TRANSACTIONS (Sub-Fase 4.5)
CREATE TABLE IF NOT EXISTS public.rk3_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipe TEXT NOT NULL CHECK (tipe IN ('pemasukan', 'pengeluaran', 'transfer')),
    sumber TEXT,
    nominal DECIMAL(12,2) NOT NULL,
    deskripsi TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'tersalurkan')),
    approved_by UUID[],
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rk3_tipe ON public.rk3_transactions(tipe);
CREATE INDEX IF NOT EXISTS idx_rk3_status ON public.rk3_transactions(status);

-- ═══════════════════════════════════════════════════════════
-- FASE 6: AI & MATCHING SOLIDARITAS
-- ═══════════════════════════════════════════════════════════

-- 3. LOWONGAN KERJA (Sub-Fase 6.1)
CREATE TABLE IF NOT EXISTS public.lowongan_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pemasang_id UUID NOT NULL REFERENCES public.profiles(id),
    jenis TEXT NOT NULL,
    deskripsi TEXT,
    lokasi TEXT,
    estimasi_gaji DECIMAL(12,2),
    durasi TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'terisi')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- 4. TENAGA KERJA (Sub-Fase 6.1)
CREATE TABLE IF NOT EXISTS public.tenaga_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    keahlian TEXT[] NOT NULL,
    pengalaman_tahun INTEGER,
    estimasi_upah DECIMAL(12,2),
    lokasi TEXT,
    tersedia BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0,
    total_ulasan INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LOWONGAN LAMARAN (Sub-Fase 6.1)
CREATE TABLE IF NOT EXISTS public.lowongan_lamaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lowongan_id UUID NOT NULL REFERENCES public.lowongan_kerja(id),
    pelamar_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT DEFAULT 'dikirim' CHECK (status IN ('dikirim', 'diterima', 'ditolak')),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lowongan_id, pelamar_id)
);

-- 6. DONATUR POTENSIAL (Sub-Fase 6.2)
CREATE TABLE IF NOT EXISTS public.donatur_potensial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    preferensi TEXT[] NOT NULL,
    is_anonim BOOLEAN DEFAULT TRUE,
    preferensi_lokasi TEXT CHECK (preferensi_lokasi IN ('lingkungan', 'wilayah', 'semua')),
    plafon_bulanan DECIMAL(12,2),
    is_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. UMAT NEEDS (Sub-Fase 6.2 - Intent Detection)
CREATE TABLE IF NOT EXISTS public.umat_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    tipe_kebutuhan TEXT NOT NULL CHECK (tipe_kebutuhan IN ('pekerjaan', 'sembako', 'uang', 'pakaian', 'pendampingan', 'lainnya')),
    deskripsi TEXT,
    mention_count INTEGER DEFAULT 1,
    confidence DECIMAL(3,2),
    status TEXT DEFAULT 'terdeteksi' CHECK (status IN ('terdeteksi', 'diverifikasi', 'terbantu', 'ditutup')),
    matched_donatur_id UUID REFERENCES public.donatur_potensial(id),
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ojek_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ojek_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rk3_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowongan_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenaga_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowongan_lamaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donatur_potensial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umat_needs ENABLE ROW LEVEL SECURITY;

-- Ojek: driver bisa lihat order, pemesan bisa lihat order sendiri
CREATE POLICY ojek_driver_select ON public.ojek_orders
    FOR SELECT USING (driver_id = auth.uid() OR pemesan_id = auth.uid());

-- RK-3: Bendahara III (Layer 6+) bisa akses
CREATE POLICY rk3_select ON public.rk3_transactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

-- Lowongan: publik untuk authenticated users
CREATE POLICY lowongan_select ON public.lowongan_kerja
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY lowongan_insert ON public.lowongan_kerja
    FOR INSERT WITH CHECK (auth.uid() = pemasang_id);

-- Tenaga Kerja: publik untuk authenticated users
CREATE POLICY tenaga_kerja_select ON public.tenaga_kerja
    FOR SELECT USING (auth.role() = 'authenticated');

-- Donatur: hanya admin/Komsos yang bisa lihat
CREATE POLICY donatur_select ON public.donatur_potensial
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

-- Umat Needs: user bisa lihat need sendiri, KL/Admin bisa lihat semua
CREATE POLICY umat_needs_select ON public.umat_needs
    FOR SELECT USING (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4)
    );