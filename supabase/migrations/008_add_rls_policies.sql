-- Migration 008: Row Level Security (RLS) Policies
-- Ref: GDD Bab VI "Authentication & Authorization", Bab IV.2 Layer Akses

-- ============================================
-- POLICY HELPER: Get current user's access layer
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_access_layer()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT access_layer FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Own profile: full access
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR get_user_access_layer() >= 5);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Layer 5+ can view all profiles; Layer 4+ can view profiles in their lingkungan
CREATE POLICY "Sekretaris can view all profiles"
    ON public.profiles FOR SELECT
    USING (get_user_access_layer() >= 5);

CREATE POLICY "KL can view profiles in their lingkungan"
    ON public.profiles FOR SELECT
    USING (get_user_access_layer() >= 4 AND lingkungan_id IN (
        SELECT id FROM public.lingkungan WHERE ketua_lingkungan_id = auth.uid()
    ));

-- ============================================
-- DIGITAL VAULT POLICIES
-- ============================================
CREATE POLICY "Users can view own vault"
    ON public.digital_vault FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Sekretaris can view all vault"
    ON public.digital_vault FOR SELECT
    USING (get_user_access_layer() >= 5);

CREATE POLICY "Users can upload own vault"
    ON public.digital_vault FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Sekretaris can verify vault"
    ON public.digital_vault FOR UPDATE
    USING (get_user_access_layer() >= 5)
    WITH CHECK (get_user_access_layer() >= 5);

-- ============================================
-- FINANCIAL POLICIES (Layer 6+)
-- ============================================
CREATE POLICY "Bendahara can view rekening"
    ON public.rekenings FOR SELECT
    USING (get_user_access_layer() >= 6);

CREATE POLICY "Bendahara can view transactions"
    ON public.financial_transactions FOR SELECT
    USING (get_user_access_layer() >= 6);

CREATE POLICY "Bendahara can insert transactions"
    ON public.financial_transactions FOR INSERT
    WITH CHECK (get_user_access_layer() >= 6);

CREATE POLICY "Bendahara can view kolekte"
    ON public.kolekte_entries FOR SELECT
    USING (get_user_access_layer() >= 6);

CREATE POLICY "Bendahara can input kolekte"
    ON public.kolekte_entries FOR INSERT
    WITH CHECK (get_user_access_layer() >= 6);

CREATE POLICY "Bendahara can update own kolekte input"
    ON public.kolekte_entries FOR UPDATE
    USING (bendahara_a_id = auth.uid() OR bendahara_b_id = auth.uid())
    WITH CHECK (bendahara_a_id = auth.uid() OR bendahara_b_id = auth.uid());

CREATE POLICY "Multi-signature: approvers can see"
    ON public.multi_signature_approvals FOR SELECT
    USING (get_user_access_layer() >= 6);

CREATE POLICY "Multi-signature: insert own approval"
    ON public.multi_signature_approvals FOR INSERT
    WITH CHECK (approver_id = auth.uid());

-- ============================================
-- KEGIATAN POLICIES (Layer 5+ for review, Layer 7+ for CRUD)
-- ============================================
CREATE POLICY "Koordinator can insert kegiatan"
    ON public.kegiatan FOR INSERT
    WITH CHECK (get_user_access_layer() >= 7);

CREATE POLICY "Koordinator can view own kegiatan"
    ON public.kegiatan FOR SELECT
    USING (pengaju_id = auth.uid() OR get_user_access_layer() >= 5);

CREATE POLICY "Sekretaris+ can update kegiatan"
    ON public.kegiatan FOR UPDATE
    USING (get_user_access_layer() >= 5)
    WITH CHECK (get_user_access_layer() >= 5);

-- ============================================
-- LAPORAN POLICIES
-- ============================================
CREATE POLICY "Koordinator can insert laporan"
    ON public.laporan_seksi FOR INSERT
    WITH CHECK (pengisi_id = auth.uid());

CREATE POLICY "Users can view their laporan"
    ON public.laporan_seksi FOR SELECT
    USING (pengisi_id = auth.uid() OR get_user_access_layer() >= 5);

-- ============================================
-- SAKRAMEN POLICIES
-- ============================================
CREATE POLICY "Users can view own sakramen"
    ON public.sakramen_registrations FOR SELECT
    USING (user_id = auth.uid() OR get_user_access_layer() >= 5);

CREATE POLICY "Users can register sakramen"
    ON public.sakramen_registrations FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- COMPANION POLICIES (STRICT — ONLY OWNER)
-- ============================================
CREATE POLICY "Only owner can view companion sessions"
    ON public.companion_sessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Only owner can view companion transcripts"
    ON public.companion_transcripts FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.companion_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their companion session"
    ON public.companion_sessions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- SURAT PASTORAL POLICIES (Sender & Recipient Only)
-- ============================================
CREATE POLICY "Only recipient and pastor can view surat"
    ON public.surat_pastoral FOR SELECT
    USING (user_id = auth.uid() OR pastor_id = auth.uid());

CREATE POLICY "Pastor can send surat"
    ON public.surat_pastoral FOR INSERT
    WITH CHECK (pastor_id = auth.uid());

-- ============================================
-- WDL POLICIES
-- ============================================
CREATE POLICY "WDL can view consent records"
    ON public.wdl_consent FOR SELECT
    USING (umat_id = auth.uid() OR wdl_profile_id = auth.uid());

CREATE POLICY "Umat can manage own consent"
    ON public.wdl_consent FOR INSERT
    WITH CHECK (umat_id = auth.uid());

CREATE POLICY "Umat can revoke own consent"
    ON public.wdl_consent FOR UPDATE
    USING (umat_id = auth.uid())
    WITH CHECK (umat_id = auth.uid());

-- ============================================
-- PASTORAL SOS POLICIES
-- ============================================
CREATE POLICY "Users can trigger SOS"
    ON public.pastoral_sos FOR INSERT
    WITH CHECK (triggered_by = auth.uid());

CREATE POLICY "Pastor+ can view all SOS"
    ON public.pastoral_sos FOR SELECT
    USING (get_user_access_layer() >= 9 OR triggered_by = auth.uid());

CREATE POLICY "Pastor can update SOS"
    ON public.pastoral_sos FOR UPDATE
    USING (get_user_access_layer() >= 9)
    WITH CHECK (get_user_access_layer() >= 9);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- GOVERNANCE POLICIES
-- ============================================
CREATE POLICY "Layer 7+ can view governance"
    ON public.governance_program_kerja FOR SELECT
    USING (get_user_access_layer() >= 7);

CREATE POLICY "Layer 7+ can manage governance"
    ON public.governance_program_kerja FOR INSERT
    WITH CHECK (get_user_access_layer() >= 7);

CREATE POLICY "Layer 8+ can view RKAP"
    ON public.governance_rkap FOR SELECT
    USING (get_user_access_layer() >= 8);

CREATE POLICY "Layer 8+ can view keputusan DPP"
    ON public.governance_keputusan_dpp FOR SELECT
    USING (get_user_access_layer() >= 8);

-- ============================================
-- WHISTLE-BLOWER POLICIES (Only Pastor Layer 9)
-- ============================================
CREATE POLICY "Only Pastor can view surat pastoral"
    ON public.surat_pastoral FOR SELECT
    USING (pastor_id = auth.uid() OR user_id = auth.uid());

-- ============================================
-- AUDIT LOGS POLICIES (Layer 8+)
-- ============================================
CREATE POLICY "Tim Audit can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (get_user_access_layer() >= 8);

CREATE POLICY "Tim Audit can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (get_user_access_layer() >= 8);

-- ============================================
-- WHISTLE-BLOWER TABLE
-- ============================================
CREATE TABLE public.whistleblower_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori TEXT NOT NULL CHECK (kategori IN ('keuangan','penyalahgunaan','pelanggaran_data','lainnya')),
    konten TEXT NOT NULL,  -- E2E encrypted
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','ditindaklanjuti','selesai')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.whistleblower_reports ENABLE ROW LEVEL SECURITY;

-- Only pastor (Layer 9) can view whistleblower reports
CREATE POLICY "Only Pastor can view whistleblower"
    ON public.whistleblower_reports FOR SELECT
    USING (get_user_access_layer() >= 9);

-- Anyone authenticated can submit
CREATE POLICY "Any user can submit whistleblower"
    ON public.whistleblower_reports FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- DANA KASIH POLICIES
-- ============================================
CREATE POLICY "Layer 2+ can view dana kasih"
    ON public.dana_kasih FOR SELECT
    USING (get_user_access_layer() >= 2);

CREATE POLICY "Layer 2+ can donate"
    ON public.dana_kasih_donors FOR INSERT
    WITH CHECK (get_user_access_layer() >= 2);