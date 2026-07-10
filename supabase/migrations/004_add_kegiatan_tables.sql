-- Migration 004: Kegiatan, LPJ, and Laporan Tables
-- Ref: GDD Bab IX "Modul Kegiatan & Anggaran", Bab IV.2

-- ============================================
-- 1. LAPORAN TEMPLATES (must be created first)
-- ============================================
CREATE TABLE public.laporan_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    template_type TEXT NOT NULL,
    struktur JSONB NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 6 default templates
INSERT INTO public.laporan_templates (nama, template_type, struktur, created_by) VALUES
    ('Laporan Kegiatan Umum (KPD)', 'kegiatan_umum_kpd', '{"sections": ["peserta_aktual", "ringkasan", "realisasi_anggaran", "foto_min_2", "bukti_pengeluaran", "evaluasi"]}', NULL),
    ('Laporan Kegiatan Ringkas (KTPD)', 'kegiatan_ringkas_ktpd', '{"sections": ["peserta", "ringkasan_max_300", "foto_min_1", "evaluasi_singkat"]}', NULL),
    ('Laporan Liturgi & Jadwal Petugas', 'liturgi_petugas', '{"sections": ["jenis_misa", "petugas_hadir", "pengganti", "catatan_khusus"]}', NULL),
    ('Laporan Kegiatan Sosial (Anonim)', 'sosial_bantuan', '{"sections": ["jenis_bantuan", "penerima_anonim", "foto_bukti", "narasi_dampak"]}', NULL),
    ('Laporan Pembinaan Iman & Katekese', 'pembinaan_katekese', '{"sections": ["jenis_pembinaan", "sesi_ke", "materi", "fasilitator", "peserta", "foto", "ringkasan_materi"]}', NULL),
    ('Laporan Periodik Bulanan', 'periodik_bulanan', '{"sections": ["total_kegiatan", "anggaran_vs_realisasi", "highlight", "kendala", "rencana_bulan_depan"]}', NULL);

-- ============================================
-- 2. KEGIATAN (KPD & KTPD)
-- ============================================
CREATE TABLE public.kegiatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identitas kegiatan
    judul TEXT NOT NULL,
    tujuan_pastoral TEXT NOT NULL,
    deskripsi TEXT,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE,
    lokasi TEXT,
    estimasi_peserta INTEGER,
    pic_id UUID REFERENCES public.profiles(id),

    -- Bidang & pengaju
    bidang TEXT NOT NULL CHECK (bidang IN (
        'kerygma','liturgia','koinonia','diakonia','martyria','lintas_bidang'
    )),
    sub_bidang TEXT,
    pengaju_id UUID NOT NULL REFERENCES public.profiles(id),

    -- Jenis kegiatan
    jenis TEXT NOT NULL CHECK (jenis IN ('KPD','KTPD')),

    -- Anggaran (hanya untuk KPD)
    sumber_rekening TEXT CHECK (sumber_rekening IN ('RK1','RK2')),
    total_anggaran DECIMAL(12,2),
    anggaran_detail JSONB,
    is_rkap BOOLEAN DEFAULT FALSE,
    is_adhoc BOOLEAN DEFAULT FALSE,
    adhoc_justification TEXT,

    -- Dana mandiri (KTPD)
    sumber_dana_mandiri TEXT,

    -- Workflow status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft','submitted','review_sekretaris',
        'review_wakil_ketua','review_pastor',
        'disetujui','ditolak','dana_dicairkan',
        'selesai','lpj_terlambat'
    )),

    -- Approval trail
    submitted_at TIMESTAMPTZ,
    sekretaris_review_by UUID REFERENCES public.profiles(id),
    sekretaris_review_at TIMESTAMPTZ,
    sekretaris_notes TEXT,

    wakil_ketua_review_by UUID REFERENCES public.profiles(id),
    wakil_ketua_review_at TIMESTAMPTZ,
    wakil_ketua_notes TEXT,

    pastor_review_by UUID REFERENCES public.profiles(id),
    pastor_review_at TIMESTAMPTZ,
    pastor_notes TEXT,

    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Pencairan
    disbursement_scheduled_date DATE,
    disbursed_amount DECIMAL(12,2),
    disbursed_at TIMESTAMPTZ,
    disbursement_transaction_id UUID REFERENCES public.financial_transactions(id),

    -- LPJ
    lpj_due_date DATE,
    lpj_submitted_at TIMESTAMPTZ,
    lpj_id UUID,

    -- Dokumen
    attachment_urls TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. LAPORAN SEKSI (LPJ)
-- ============================================
CREATE TABLE public.laporan_seksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referensi kegiatan
    kegiatan_id UUID REFERENCES public.kegiatan(id),

    -- Identitas laporan
    judul TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN (
        'kegiatan_umum_kpd','kegiatan_ringkas_ktpd',
        'liturgi_petugas','sosial_bantuan',
        'pembinaan_katekese','periodik_bulanan','kustom'
    )),
    template_id UUID REFERENCES public.laporan_templates(id),

    -- Isi laporan (dinamis sesuai template)
    isi_laporan JSONB NOT NULL,
    ringkasan TEXT,

    -- Dokumen pendukung
    foto_urls TEXT[],
    bukti_pengeluaran_urls TEXT[],

    -- Peserta
    peserta_aktual INTEGER,
    daftar_hadir_ids UUID[],

    -- Evaluasi
    evaluasi TEXT,
    tindak_lanjut TEXT,

    -- Metadata
    pengisi_id UUID NOT NULL REFERENCES public.profiles(id),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','late','blocked')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. KEAKTIFAN
-- ============================================
CREATE TABLE public.keaktifan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    umat_id UUID NOT NULL REFERENCES public.profiles(id),
    jenis TEXT NOT NULL CHECK (jenis IN (
        'lingkungan','omk','koor','lektor','mazmur',
        'misdinar','sosial','pelayanan','bia','bir',
        'kerasulan_keluarga','kelompok_kategorial','lainnya'
    )),
    tanggal DATE NOT NULL,
    keterangan TEXT,
    input_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.laporan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_seksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keaktifan ENABLE ROW LEVEL SECURITY;