-- Migration: Add WDL, Vault OCR, and Bot Conversations tables
-- Ref: GDD BAB IV.2 (digital_vault, wdl_consent, bot_conversations), BAB IV.4 (RLS Policies)

-- ============================================
-- 1. MODIFIED digital_vault (add OCR column)
-- ============================================
ALTER TABLE public.digital_vault
ADD COLUMN IF NOT EXISTS ocr_extracted_data JSONB,
ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.digital_vault.ocr_extracted_data IS 'Hasil OCR scan dokumen (JSONB)';
COMMENT ON COLUMN public.digital_vault.ocr_processed_at IS 'Timestamp kapan OCR diproses';

-- ============================================
-- 2. CREATE wdl_consent TABLE
-- Ref: GDD BAB IV.2
-- ============================================
CREATE TABLE IF NOT EXISTS public.wdl_consent (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    umat_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wdl_profile_id    UUID NOT NULL REFERENCES public.profiles(id),

    -- Scope akses granular (diperluas v3.1)
    scope             TEXT[] NOT NULL,
    -- Daftar scope valid:
    -- 'read_profile'           → baca profil dasar
    -- 'write_kasih'            → ajukan/terima bantuan atas nama
    -- 'write_sakramen_daftar'  → daftar sakramen atas nama
    -- 'read_vault_metadata'    → lihat daftar dokumen (bukan isi file)
    -- 'write_vault'            → upload dokumen ke Vault atas nama
    -- 'manage_morning_check'   → konfirmasi cek pagi atas nama lansia
    -- 'receive_notifications'  → terima notifikasi yang ditujukan untuk umat

    -- Bukti consent (scan surat persetujuan fisik)
    consent_doc_url   TEXT NOT NULL,

    -- Lifecycle
    is_active         BOOLEAN DEFAULT TRUE,
    granted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at        TIMESTAMPTZ NOT NULL,   -- WAJIB, maks 6 bulan dari granted_at
    revoked_at        TIMESTAMPTZ,
    revoked_by        UUID REFERENCES public.profiles(id),
    revoked_reason    TEXT,

    -- Abuse tracking
    abuse_report_at   TIMESTAMPTZ,
    abuse_report_notes TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.wdl_consent IS 'Tabel persetujuan Wali Digital Lingkungan (WDL) untuk mengakses data umat.';
COMMENT ON COLUMN public.wdl_consent.scope IS 'Array scope akses granular yang diizinkan oleh umat kepada WDL.';

-- ============================================
-- 3. CREATE wdl_access_log TABLE
-- Ref: GDD BAB IV.2
-- ============================================
CREATE TABLE IF NOT EXISTS public.wdl_access_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id      UUID NOT NULL REFERENCES public.wdl_consent(id),
    wdl_id          UUID NOT NULL REFERENCES public.profiles(id),
    umat_id         UUID NOT NULL REFERENCES public.profiles(id),
    action          TEXT NOT NULL,
    performed_at    TIMESTAMPTZ DEFAULT NOW(),
    ip_address      INET,
    user_agent      TEXT
);

COMMENT ON TABLE public.wdl_access_log IS 'Log aktivitas Wali Digital Lingkungan (WDL) saat mengakses data umat.';

-- ============================================
-- 4. CREATE bot_conversations TABLE
-- Ref: GDD BAB IV.2
-- ============================================
CREATE TABLE IF NOT EXISTS public.bot_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_type        TEXT NOT NULL CHECK (bot_type IN (
        'info_publik',    -- Layer 0: FAQ publik di website
        'pendaftaran',    -- Layer 1-2: bantu registrasi & kelengkapan
        'lingkungan'      -- Layer 4: koordinasi KL
    )),
    session_id      TEXT NOT NULL,
    user_id         UUID REFERENCES public.profiles(id),  -- NULL untuk info_publik
    platform        TEXT CHECK (platform IN ('web','whatsapp','mobile_app')),
    messages        JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{role: 'user'|'bot', content: '...', timestamp: '...'}]
    intent_resolved  BOOLEAN DEFAULT FALSE,
    final_intent     TEXT,
    escalated_to_human BOOLEAN DEFAULT FALSE,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

COMMENT ON TABLE public.bot_conversations IS 'Menyimpan riwayat percakapan dengan bot asisten.';

-- ============================================
-- 5. ENABLE RLS for new tables
-- ============================================
ALTER TABLE public.wdl_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wdl_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES for new tables (Ref: GDD BAB IV.4)
-- ============================================

-- wdl_consent: Owner bisa lihat, WDL bisa lihat consent yang diberikan ke dia
CREATE POLICY wdl_consent_owner_select ON public.wdl_consent
    FOR SELECT USING (
        umat_id = auth.uid()
        OR wdl_profile_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer >= 5)
    );
CREATE POLICY wdl_consent_owner_insert ON public.wdl_consent
    FOR INSERT WITH CHECK (umat_id = auth.uid());
CREATE POLICY wdl_consent_owner_update ON public.wdl_consent
    FOR UPDATE USING (umat_id = auth.uid());
CREATE POLICY wdl_consent_admin_all ON public.wdl_consent
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer >= 5)); -- Sekretaris dan di atasnya

-- wdl_access_log: Tim Audit dan WDL bisa lihat log
CREATE POLICY wdl_access_log_select ON public.wdl_access_log
    FOR SELECT USING (
        wdl_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer >= 8)
    );
CREATE POLICY wdl_access_log_insert ON public.wdl_access_log
    FOR INSERT WITH CHECK (wdl_id = auth.uid());

-- bot_conversations: Admin bisa baca semua, user bisa baca miliknya
CREATE POLICY bot_conv_owner_select ON public.bot_conversations
    FOR SELECT USING (
        user_id = auth.uid()
        OR (user_id IS NULL AND bot_type = 'info_publik') -- public bot can be read by anyone if no user_id
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer = 10) -- Super Admin
    );
CREATE POLICY bot_conv_insert ON public.bot_conversations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR (user_id IS NULL AND bot_type = 'info_publik')
    );