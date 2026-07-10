-- Migration 010: Add full SOS features and RLS
-- Ref: GDD Bab IV.2, UF Bagian 3, masterplan.md Sub-Fase 1.3
-- This migration adds tables for SOS prayer guides, notification logs, and escalation timers.

-- ============================================
-- 1. sos_prayer_guides
-- ============================================
CREATE TABLE public.sos_prayer_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_type TEXT NOT NULL CHECK (sos_type IN (
        'pengurapan', 'konseling_darurat', 'konsultasi_pastoral', 
        'kematian_darurat', 'lainnya'
    )),
    language TEXT DEFAULT 'id' NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial SOS prayer guides (Bahasa Indonesia)
INSERT INTO public.sos_prayer_guides (sos_type, content) VALUES
    ('pengurapan', E'Tuhan, dalam kesakitan dan keprihatinan ini, kami memohon kekuatan-Mu. Bantulah kami (dan orang yang kami cintai) untuk tetap teguh dalam iman, percaya bahwa Engkau selalu menyertai. Kami serahkan jiwa dan raga ini ke dalam tangan-Mu yang penuh kasih. Semoga Engkau menganugerahkan pengampunan, kekuatan, dan penghiburan ilahi. Amin.'),
    ('konseling_darurat', E'Ya Bapa yang Maha Pengasih, dalam kebingungan dan kecemasan ini, kami datang kepada-Mu. Berikanlah kami ketenangan hati, terang pikiran, dan bimbingan Roh Kudus agar kami dapat menemukan jalan keluar dari kesulitan ini. Tuntunlah hamba-Mu yang akan mendampingi kami. Amin.'),
    ('konsultasi_pastoral', E'Allah sumber kebijaksanaan, kami bersyukur atas bimbingan-Mu. Dalam kebutuhan akan nasihat pastoral, kami mohon terang-Mu menyertai pembicaraan kami. Bukalah hati dan pikiran kami agar dapat memahami kehendak-Mu. Amin.'),
    ('kematian_darurat', E'Tuhan, pangku kami dalam duka ini. Kami memohon belas kasih-Mu bagi jiwa yang telah Engkau panggil pulang. Berikanlah penghiburan bagi keluarga yang berduka, dan kuatkanlah iman kami akan kebangkitan. Semoga nama-Mu dimuliakan kini dan sepanjang masa. Amin.'),
    ('lainnya', E'Ya Allah yang tak terbatas kasih-Mu, dalam situasi darurat yang tidak terduga ini, kami berseru kepada-Mu. Berikanlah kekuatan, kebijaksanaan, dan perlindungan. Semoga hamba-Mu yang akan datang membawa bantuan dan harapan. Amin.');

-- ============================================
-- 2. sos_notification_log
-- ============================================
CREATE TABLE public.sos_notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES public.pastoral_sos(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('fcm', 'whatsapp', 'email', 'in_app', 'escalation')),
    target_user_id UUID REFERENCES public.profiles(id),
    target_role TEXT, -- e.g., 'pastor', 'vikaris', 'ketua_lingkungan', 'ketua_dpp'
    target_phone TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'acknowledged')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. sos_escalation_timers
-- ============================================
CREATE TABLE public.sos_escalation_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES public.pastoral_sos(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4), -- 1=Pastor, 2=Vikaris, 3=WK1, 4=Keuskupan
    scheduled_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    escalated_to_user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Update pastoral_sos table (add missing columns from plan)
-- ============================================
ALTER TABLE public.pastoral_sos
    ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS anointing_id UUID REFERENCES public.anointings(id); -- assuming anointing_id is handled in phase 2 migration
    -- NOTE: 'jenis_kedaruratan', 'deskripsi', 'kontak_keluarga', 'foto_bukti_url', 'assigned_to', 'response_notes'
    -- are already added in 009_add_fase1_tables.sql


-- ============================================
-- 5. RLS Policies for new tables
-- ============================================

-- sos_prayer_guides: Anyone can view
ALTER TABLE public.sos_prayer_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view SOS prayer guides"
    ON public.sos_prayer_guides FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Super Admin can manage SOS prayer guides"
    ON public.sos_prayer_guides FOR ALL
    USING (get_user_access_layer() >= 10)
    WITH CHECK (get_user_access_layer() >= 10);

-- sos_notification_log: Pastor+ can view
ALTER TABLE public.sos_notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastor+ can view SOS notification logs"
    ON public.sos_notification_log FOR SELECT
    USING (get_user_access_layer() >= 9 OR target_user_id = auth.uid());

CREATE POLICY "Service Role can insert SOS notification logs"
    ON public.sos_notification_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role'); -- Only backend service should insert

-- sos_escalation_timers: Pastor+ can view and manage
ALTER TABLE public.sos_escalation_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastor+ can view SOS escalation timers"
    ON public.sos_escalation_timers FOR SELECT
    USING (get_user_access_layer() >= 9 OR escalated_to_user_id = auth.uid());

CREATE POLICY "Service Role can manage SOS escalation timers"
    ON public.sos_escalation_timers FOR ALL
    USING (auth.role() = 'service_role');