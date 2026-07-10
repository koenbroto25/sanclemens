-- Fase 8: Content Management untuk Admin Paroki
-- Tabel: warta_paroki, kegiatan_paroki, jadwal_misa
-- Integrasi: Homepage publik mengambil data dari sini (bukan hardcoded)

-- 1. WARTA PAROKI
CREATE TABLE IF NOT EXISTS public.warta_paroki (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    excerpt TEXT,
    konten JSONB,               -- Rich content untuk detail page
    tanggal DATE DEFAULT CURRENT_DATE,
    kategori TEXT CHECK (kategori IN ('liturgi', 'kegiatan', 'sosial', 'umum')) DEFAULT 'umum',
    gambar_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warta_paroki_published ON warta_paroki(is_published, tanggal DESC);

-- 2. KEGIATAN PAROKI
CREATE TABLE IF NOT EXISTS public.kegiatan_paroki (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    deskripsi TEXT,
    tanggal DATE NOT NULL,
    jam_mulai TIME,
    jam_selesai TIME,
    lokasi TEXT,
    kategori TEXT CHECK (kategori IN ('ibadah', 'sosial', 'pendidikan', 'pemuda', 'umum')) DEFAULT 'umum',
    gambar_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kegiatan_paroki_published ON kegiatan_paroki(is_published, tanggal ASC);

-- 3. JADWAL MISA
CREATE TABLE IF NOT EXISTS public.jadwal_misa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hari TEXT NOT NULL CHECK (hari IN ('senin','selasa','rabu','kamis','jumat','sabtu','minggu')),
    label TEXT,                  -- 'Hari Ini', 'Misa Khusus', dll
    jam TIME NOT NULL,
    nama_misa TEXT NOT NULL,     
    lokasi TEXT DEFAULT 'Gereja Utama',
    tipe TEXT DEFAULT 'harian' CHECK (tipe IN ('harian', 'hari_besar', 'khusus')),
    tanggal_spesifik DATE,       -- Untuk hari besar / misa khusus
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jadwal_misa_aktif ON jadwal_misa(is_active, hari, jam);

-- Default seed jadwal misa mingguan
INSERT INTO public.jadwal_misa (hari, jam, nama_misa, lokasi, tipe) VALUES
    ('senin', '06:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('senin', '18:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('selasa', '06:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('selasa', '18:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('rabu', '06:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('rabu', '18:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('kamis', '06:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('kamis', '18:00', 'Novena Kristus Raja', 'Gereja Utama', 'harian'),
    ('jumat', '06:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('jumat', '18:00', 'Misa Jumat Pertama', 'Gereja Utama', 'khusus'),
    ('sabtu', '06:00', 'Misa Harian', 'Gereja Utama', 'harian'),
    ('sabtu', '18:00', 'Misa Vigili Minggu', 'Gereja Utama', 'harian'),
    ('minggu', '06:00', 'Misa Pagi', 'Gereja Utama', 'harian'),
    ('minggu', '08:30', 'Misa Umat', 'Gereja Utama', 'harian'),
    ('minggu', '17:00', 'Misa Sore', 'Gereja Utama', 'harian')
ON CONFLICT DO NOTHING;

-- 4. RLS POLICIES
ALTER TABLE public.warta_paroki ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_paroki ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_misa ENABLE ROW LEVEL SECURITY;

-- Public read untuk yang published
CREATE POLICY "Public read published warta" ON public.warta_paroki
    FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public read published kegiatan" ON public.kegiatan_paroki
    FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public read active jadwal" ON public.jadwal_misa
    FOR SELECT USING (is_active = TRUE);

-- Admin (Layer 5+) CRUD
CREATE POLICY "Admin full warta" ON public.warta_paroki
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND access_layer >= 5)
    );
CREATE POLICY "Admin full kegiatan" ON public.kegiatan_paroki
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND access_layer >= 5)
    );
CREATE POLICY "Admin full jadwal" ON public.jadwal_misa
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

-- Service role full access
CREATE POLICY "Service role warta" ON public.warta_paroki FOR ALL TO service_role USING (true);
CREATE POLICY "Service role kegiatan" ON public.kegiatan_paroki FOR ALL TO service_role USING (true);
CREATE POLICY "Service role jadwal" ON public.jadwal_misa FOR ALL TO service_role USING (true);

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_warta_updated_at BEFORE UPDATE ON public.warta_paroki
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_kegiatan_updated_at BEFORE UPDATE ON public.kegiatan_paroki
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_jadwal_updated_at BEFORE UPDATE ON public.jadwal_misa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();