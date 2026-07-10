-- FASE 3: SOLIDARITAS & KEUANGAN
-- Migration 047: Tabel untuk Dana Kasih Escrow, Audit, Dana Duka, Whistle-Blower, Template Laporan
-- ============================================================

-- 1. ANOMALY FLAGS (Sub-Fase 3.3 - Audit)
CREATE TABLE IF NOT EXISTS public.anomaly_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL CHECK (severity IN ('kritis', 'sedang', 'peringatan')),
    tipe_anomali TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    reference_id UUID,
    reference_table TEXT,
    status TEXT DEFAULT 'terbuka' CHECK (status IN ('terbuka', 'investigasi', 'selesai', 'false_positive')),
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON public.anomaly_flags(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_status ON public.anomaly_flags(status);

-- 2. DANA DUKA PENCAIRAN (Sub-Fase 3.4)
-- (dana_duka_iuran sudah ada di migration sebelumnya)
CREATE TABLE IF NOT EXISTS public.dana_duka_pencairan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_berduka_id UUID NOT NULL REFERENCES public.families(id),
    lingkungan_id UUID NOT NULL REFERENCES public.lingkungan(id),
    nominal DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'diajukan' CHECK (status IN ('diajukan', 'disetujui', 'tersalurkan', 'ditolak')),
    diajukan_oleh UUID REFERENCES public.profiles(id),
    disetujui_oleh UUID REFERENCES public.profiles(id),
    diarsip_oleh UUID REFERENCES public.profiles(id),
    tanggal_meninggal DATE,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dana_duka_status ON public.dana_duka_pencairan(status);
CREATE INDEX IF NOT EXISTS idx_dana_duka_lingkungan ON public.dana_duka_pencairan(lingkungan_id);

-- 3. WHISTLE-BLOWER REPORTS (Sub-Fase 3.6)
DROP TABLE IF EXISTS public.whistleblower_reports CASCADE;
CREATE TABLE public.whistleblower_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori TEXT NOT NULL CHECK (kategori IN ('keuangan', 'penyalahgunaan', 'lainnya')),
    encrypted_content TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    encryption_tag TEXT NOT NULL,
    status TEXT DEFAULT 'baru' CHECK (status IN ('baru', 'ditinjau', 'ditindaklanjuti', 'selesai', 'tidak_valid')),
    pastor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Template Laporan (metadata tabel untuk 6 template)
DROP TABLE IF EXISTS public.laporan_templates CASCADE;
CREATE TABLE public.laporan_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 6 template standar
INSERT INTO public.laporan_templates (kode, nama, deskripsi, fields) VALUES
    ('KPD', 'Laporan Kegiatan Umum', 'Template untuk KPD dengan rincian anggaran', '["peserta_aktual", "ringkasan", "realisasi_anggaran", "foto_min_2", "bukti_pengeluaran", "evaluasi"]'),
    ('KTPD', 'Laporan Kegiatan Ringkas', 'Template untuk KTPD tanpa rincian anggaran', '["peserta", "ringkasan_max_300", "foto_min_1", "evaluasi"]'),
    ('LITURGI', 'Laporan Liturgi & Jadwal Petugas', 'Template untuk kegiatan liturgi', '["jenis_misa", "petugas_hadir", "petugas_tidak_hadir", "pengganti", "catatan_khusus"]'),
    ('SOSIAL', 'Laporan Kegiatan Sosial (Anonim)', 'Template untuk kegiatan sosial', '["jenis_bantuan", "penerima_anonim", "foto_bukti", "narasi_dampak"]'),
    ('IMAN', 'Laporan Pembinaan Iman & Katekese', 'Template untuk pembinaan iman', '["jenis_pembinaan", "sesi_ke", "materi", "fasilitator", "peserta", "foto", "ringkasan_materi"]'),
    ('BULANAN', 'Laporan Periodik Bulanan', 'Template untuk laporan periodik', '["total_kegiatan", "anggaran_vs_realisasi", "highlight", "kendala", "rencana_bulan_depan"]')
ON CONFLICT (kode) DO NOTHING;

-- RLS Policies
ALTER TABLE public.anomaly_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dana_duka_pencairan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whistleblower_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_templates ENABLE ROW LEVEL SECURITY;

-- Anomaly Flags: Tim Audit (Layer 8+) bisa lihat
CREATE POLICY anomaly_select ON public.anomaly_flags
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 8)
    );

-- Dana Duka: Bendahara II, KL, Sekretaris I bisa akses
CREATE POLICY dana_duka_select ON public.dana_duka_pencairan
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

-- Whistle-Blower: Hanya Pastor (Layer 9+) yang bisa SELECT
CREATE POLICY pastor_view_whistleblower ON public.whistleblower_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 9)
    );
-- Semua user (Layer 2+) bisa INSERT
CREATE POLICY all_insert_whistleblower ON public.whistleblower_reports
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 2)
    );

-- Template laporan: semua terautentikasi bisa lihat
CREATE POLICY template_select ON public.laporan_templates
    FOR SELECT USING (auth.role() = 'authenticated');