-- ============================================
-- MIGRATION 078: Add Detailed Umat Data
-- Tanggal: 26 Juni 2026
-- Ref: data_umat.txt & AI Matching Engine needs
-- ============================================

-- Extend public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status_perkawinan TEXT CHECK (status_perkawinan IN ('belum_kawin', 'kawin', 'cerai', 'janda_duda')),
ADD COLUMN IF NOT EXISTS keterampilan TEXT[],
ADD COLUMN IF NOT EXISTS kondisi_tubuh TEXT,
ADD COLUMN IF NOT EXISTS status_aktivitas_sosial TEXT,
ADD COLUMN IF NOT EXISTS updated_by_text TEXT,
ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.status_perkawinan IS 'Status perkawinan umat.';
COMMENT ON COLUMN public.profiles.keterampilan IS 'Daftar keterampilan yang dimiliki umat.';
COMMENT ON COLUMN public.profiles.kondisi_tubuh IS 'Kondisi fisik atau kesehatan umum umat.';
COMMENT ON COLUMN public.profiles.status_aktivitas_sosial IS 'Status keaktifan umat dalam kegiatan sosial gereja.';
COMMENT ON COLUMN public.profiles.updated_by_text IS 'Nama/ID pihak yang terakhir mengupdate data profil (dari sumber eksternal seperti CSV).';
COMMENT ON COLUMN public.profiles.medical_history IS 'Riwayat medis terstruktur umat (array JSONB) untuk fitur SOS dan charity kesehatan.';

-- Extend public.keluarga table
ALTER TABLE public.keluarga
ADD COLUMN IF NOT EXISTS google_map_url TEXT,
ADD COLUMN IF NOT EXISTS last_update_by_text TEXT,
ADD COLUMN IF NOT EXISTS last_update_date TIMESTAMPTZ;

COMMENT ON COLUMN public.keluarga.google_map_url IS 'URL Google Maps untuk alamat keluarga.';
COMMENT ON COLUMN public.keluarga.last_update_by_text IS 'Nama/ID pihak yang terakhir mengupdate data keluarga (dari sumber eksternal seperti CSV).';
COMMENT ON COLUMN public.keluarga.last_update_date IS 'Tanggal terakhir data keluarga diupdate (dari sumber eksternal seperti CSV).';

-- Create table public.umat_details (for extended profile data)
CREATE TABLE IF NOT EXISTS public.umat_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    economic_details JSONB DEFAULT '{}'::jsonb,
    -- Example structure for economic_details:
    -- {
    --   "penghasilan_per_bulan": 2500000,
    --   "sumber_penghasilan": ["Buruh Harian", "Bantuan Sosial"],
    --   "jumlah_tanggungan": 5,
    --   "memiliki_hutang": true,
    --   "jumlah_hutang": 1000000,
    --   "kebutuhan_pokok": ["Beras", "Obat-obatan"],
    --   "is_gakin_verified": true,
    --   "last_gakin_verification": "2024-01-10"
    -- }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.umat_details IS 'Data detail tambahan umat (ekonomi, dll) untuk memisahkan data inti dari detail kompleks.';
COMMENT ON COLUMN public.umat_details.economic_details IS 'Detail kondisi ekonomi umat, termasuk data GAKIN.';

-- Create table public.sakramen_records
CREATE TABLE IF NOT EXISTS public.sakramen_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sacrament_type TEXT NOT NULL CHECK (sacrament_type IN (
        'baptis',
        'komuni_pertama',
        'penguatan',
        'perkawinan',
        'perminyakan_orang_sakit',
        ' Kristen'
    )),
    date_received DATE,
    paroki_received TEXT,
    keuskupan_received TEXT,
    minister TEXT,
    sponsors TEXT[],
    book_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.sakramen_records IS 'Riwayat penerimaan sakramen oleh umat.';
COMMENT ON COLUMN public.sakramen_records.sacrament_type IS 'Jenis sakramen yang diterima.';
COMMENT ON COLUMN public.sakramen_records.date_received IS 'Tanggal penerimaan sakramen.';
COMMENT ON COLUMN public.sakramen_records.paroki_received IS 'Paroki tempat menerima sakramen.';
COMMENT ON COLUMN public.sakramen_records.keuskupan_received IS 'Keuskupan tempat menerima sakramen.';
COMMENT ON COLUMN public.sakramen_records.minister IS 'Yang memberi sakramen (misal: Pastor, Romo).';
COMMENT ON COLUMN public.sakramen_records.sponsors IS 'Daftar wali/saksi sakramen.';
COMMENT ON COLUMN public.sakramen_records.book_number IS 'Nomor buku sakramen.';
COMMENT ON COLUMN public.sakramen_records.notes IS 'Catatan tambahan.';

-- Add indexes for new columns and tables
CREATE INDEX IF NOT EXISTS idx_profiles_status_perkawinan ON public.profiles(status_perkawinan);
CREATE INDEX IF NOT EXISTS idx_profiles_keterampilan ON public.profiles USING GIN(keterampilan);
CREATE INDEX IF NOT EXISTS idx_profiles_kondisi_tubuh ON public.profiles(kondisi_tubuh);
CREATE INDEX IF NOT EXISTS idx_profiles_status_aktivitas_sosial ON public.profiles(status_aktivitas_sosial);
CREATE INDEX IF NOT EXISTS idx_profiles_medical_history ON public.profiles USING GIN(medical_history);

CREATE INDEX IF NOT EXISTS idx_keluarga_last_update_date ON public.keluarga(last_update_date DESC);
CREATE INDEX IF NOT EXISTS idx_keluarga_google_map_url ON public.keluarga(google_map_url);

CREATE INDEX IF NOT EXISTS idx_umat_details_user_id ON public.umat_details(user_id);
CREATE INDEX IF NOT EXISTS idx_umat_details_economic_details ON public.umat_details USING GIN(economic_details);

CREATE INDEX IF NOT EXISTS idx_sakramen_records_user_id ON public.sakramen_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sakramen_records_type ON public.sakramen_records(sacrament_type);
CREATE INDEX IF NOT EXISTS idx_sakramen_records_date ON public.sakramen_records(date_received);

-- RLS Policies
ALTER TABLE public.umat_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own details" ON public.umat_details FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own details" ON public.umat_details FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own details" ON public.umat_details FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can view all umat_details" ON public.umat_details FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4)
);

ALTER TABLE public.sakramen_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sakramen" ON public.sakramen_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own sakramen" ON public.sakramen_records FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin can view all sakramen" ON public.sakramen_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4)
);

-- ============================================
-- SELESAI
-- ============================================