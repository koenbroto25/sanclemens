-- FASE 2: INKLUSIVITAS & ROHANI
-- Migration 046: Tabel untuk fitur Surat Pastoral, Cek Lansia, KPD/KTPD
-- ============================================================

-- 1. SURAT PASTORAL (Sub-Fase 2.3)
-- Drop existing table if it exists with wrong structure, then recreate
DROP TABLE IF EXISTS public.surat_pastoral CASCADE;
CREATE TABLE public.surat_pastoral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id),
    subject TEXT NOT NULL,
    encrypted_content TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    encryption_tag TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'archived')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surat_pastoral_sender ON public.surat_pastoral(sender_id);
CREATE INDEX IF NOT EXISTS idx_surat_pastoral_recipient ON public.surat_pastoral(recipient_id);
CREATE INDEX IF NOT EXISTS idx_surat_pastoral_status ON public.surat_pastoral(status);

-- 2. MORNING CHECK LOGS (Sub-Fase 2.4)
CREATE TABLE IF NOT EXISTS public.morning_check_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lansia_id UUID NOT NULL REFERENCES public.profiles(id),
    checker_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('aman', 'butuh_bantuan', 'tidak_respons')),
    catatan TEXT,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lansia_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_morning_check_date ON public.morning_check_logs(check_date);
CREATE INDEX IF NOT EXISTS idx_morning_check_status ON public.morning_check_logs(status);

-- Tambah kolom untuk cek lansia di tabel profiles (jika belum ada)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_lansia BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_morning_check TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tinggal_sendiri BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wdl_proxy_id UUID REFERENCES public.profiles(id);

-- 3. KEGIATAN APPROVALS (Sub-Fase 2.5 - KPD/KTPD)
-- Tambah kolom baru di tabel kegiatan (jika belum ada)
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS tipe TEXT CHECK (tipe IN ('kpd', 'ktpd'));
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS anggaran_per_pos JSONB;
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS status_lpj TEXT DEFAULT 'belum' CHECK (status_lpj IN ('belum', 'terkirim', 'terlambat'));
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS lpj_deadline TIMESTAMPTZ;

-- Tabel approval kegiatan
CREATE TABLE IF NOT EXISTS public.kegiatan_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kegiatan_id UUID NOT NULL REFERENCES public.kegiatan(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public.profiles(id),
    step INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
    catatan TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kegiatan_id, step)
);

-- RLS Policies
ALTER TABLE public.surat_pastoral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morning_check_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_approvals ENABLE ROW LEVEL SECURITY;

-- Surat Pastoral: Pastor bisa lihat yg dia kirim, umat bisa lihat yg diterima
CREATE POLICY pastor_view_sent ON public.surat_pastoral
    FOR SELECT USING (sender_id = auth.uid());
CREATE POLICY umat_view_received ON public.surat_pastoral
    FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY pastor_insert ON public.surat_pastoral
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 9)
    );

-- Morning Check: lansia dan WDL bisa insert/select
CREATE POLICY morning_check_select ON public.morning_check_logs
    FOR SELECT USING (
        lansia_id = auth.uid() OR 
        checker_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4)
    );
CREATE POLICY morning_check_insert ON public.morning_check_logs
    FOR INSERT WITH CHECK (
        lansia_id = auth.uid() OR 
        checker_id = auth.uid()
    );

-- Kegiatan Approvals: approver bisa lihat dan update
CREATE POLICY kegiatan_approval_select ON public.kegiatan_approvals
    FOR SELECT USING (approver_id = auth.uid());
CREATE POLICY kegiatan_approval_insert ON public.kegiatan_approvals
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );