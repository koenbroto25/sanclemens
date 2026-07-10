-- Migration 20260608000100: Role-Based RLS Policies (Portal 1 & 2)
-- Ref: P5 Role-Based Access & Multi-Portal RLS
-- Created: 08 Juni 2026

-- ============================================
-- 1. PROFILES POLICIES
-- ============================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Sekretaris can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "KL can view profiles in their lingkungan" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

-- Paroki-wide admin can view all profiles
CREATE POLICY "Paroki admin can view all profiles"
    ON public.profiles FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- Lingkungan admin can view profiles in their own lingkungan
CREATE POLICY "Lingkungan admin view own ling profiles"
    ON public.profiles FOR SELECT
    USING (
        is_lingkungan_admin()
        AND lingkungan_id = get_user_lingkungan_id()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Super admin can update any profile
CREATE POLICY "Super admin can update any profile"
    ON public.profiles FOR UPDATE
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================
-- 2. DIGITAL VAULT POLICIES (Portal 1: User & Sekretaris Ling/Paroki)
-- ============================================
DROP POLICY IF EXISTS "Users can view own vault" ON public.digital_vault;
DROP POLICY IF EXISTS "Sekretaris can view all vault" ON public.digital_vault;
DROP POLICY IF EXISTS "Users can upload own vault" ON public.digital_vault;
DROP POLICY IF EXISTS "Sekretaris can verify vault" ON public.digital_vault;

-- Owners can view their own vault documents
CREATE POLICY "Owner can view own vault"
    ON public.digital_vault FOR SELECT
    USING (owner_id = auth.uid());

-- Paroki-wide admin can view all vault
CREATE POLICY "Paroki admin view all vault"
    ON public.digital_vault FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- Lingkungan admin (Sekretaris Ling) can view vault of their lingkungan members
CREATE POLICY "Sekretaris Ling view own ling vault"
    ON public.digital_vault FOR SELECT
    USING (
        is_lingkungan_admin()
        AND owner_id IN (
            SELECT id FROM public.profiles
            WHERE lingkungan_id = get_user_lingkungan_id()
        )
    );

-- Owners can upload their own vault documents
CREATE POLICY "Owner can upload vault"
    ON public.digital_vault FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Paroki admin can verify vault
CREATE POLICY "Paroki admin verify vault"
    ON public.digital_vault FOR UPDATE
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- Lingkungan admin can verify vault of their lingkungan members
CREATE POLICY "Lingkungan admin verify own ling vault"
    ON public.digital_vault FOR UPDATE
    USING (
        is_lingkungan_admin()
        AND owner_id IN (
            SELECT id FROM public.profiles
            WHERE lingkungan_id = get_user_lingkungan_id()
        )
    )
    WITH CHECK (
        is_lingkungan_admin()
        AND owner_id IN (
            SELECT id FROM public.profiles
            WHERE lingkungan_id = get_user_lingkungan_id()
        )
    );

-- Owners can update their own vault
CREATE POLICY "Owner can update own vault"
    ON public.digital_vault FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- ============================================
-- 3. FINANCIAL POLICIES (Bendahara Ling vs Bendahara Paroki)
-- ============================================
DROP POLICY IF EXISTS "Bendahara can view rekening" ON public.rekenings;
DROP POLICY IF EXISTS "Bendahara can view transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Bendahara can insert transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Bendahara can view kolekte" ON public.kolekte_entries;
DROP POLICY IF EXISTS "Bendahara can input kolekte" ON public.kolekte_entries;
DROP POLICY IF EXISTS "Bendahara can update own kolekte input" ON public.kolekte_entries;
DROP POLICY IF EXISTS "Multi-signature: approvers can see" ON public.multi_signature_approvals;
DROP POLICY IF EXISTS "Multi-signature: insert own approval" ON public.multi_signature_approvals;

-- Paroki Bendahara can view all rekening
CREATE POLICY "Paroki Bendahara view all rekening"
    ON public.rekenings FOR SELECT
    USING (get_user_role() IN ('bendahara_ii', 'bendahara_iii', 'super_admin', 'super_admin_dev', 'wakil_ketua', 'tim_audit', 'pastor', 'vikaris'));

-- Lingkungan Bendahara can view rekening (no lingkungan filter on rekenings table)
CREATE POLICY "Lingkungan Bendahara view rekening"
    ON public.rekenings FOR SELECT
    USING (get_user_role() = 'bendahara_lingkungan');

-- Paroki Bendahara can manage all transactions
CREATE POLICY "Paroki Bendahara manage all transactions"
    ON public.financial_transactions FOR ALL
    USING (get_user_role() IN ('bendahara_ii', 'bendahara_iii', 'super_admin', 'super_admin_dev'))
    WITH CHECK (get_user_role() IN ('bendahara_ii', 'bendahara_iii', 'super_admin', 'super_admin_dev'));

-- Paroki Bendahara can manage all kolekte
CREATE POLICY "Paroki Bendahara manage all kolekte"
    ON public.kolekte_entries FOR ALL
    USING (get_user_role() IN ('bendahara_ii', 'bendahara_iii', 'super_admin', 'super_admin_dev'))
    WITH CHECK (get_user_role() IN ('bendahara_ii', 'bendahara_iii', 'super_admin', 'super_admin_dev'));

-- Lingkungan Bendahara can manage kolekte (no lingkungan filter on kolekte_entries)
CREATE POLICY "Lingkungan Bendahara manage kolekte"
    ON public.kolekte_entries FOR ALL
    USING (get_user_role() = 'bendahara_lingkungan')
    WITH CHECK (get_user_role() = 'bendahara_lingkungan');

-- Multi-signature approvers
CREATE POLICY "Approvers view multi-sig"
    ON public.multi_signature_approvals FOR SELECT
    USING (get_user_role() IN ('bendahara_ii', 'bendahara_iii', 'super_admin', 'super_admin_dev', 'wakil_ketua', 'pastor', 'vikaris'));

CREATE POLICY "Approvers insert multi-sig"
    ON public.multi_signature_approvals FOR INSERT
    WITH CHECK (approver_id = auth.uid() AND get_user_role() IN ('bendahara_ii', 'bendahara_iii', 'super_admin', 'super_admin_dev', 'wakil_ketua', 'pastor', 'vikaris'));

-- ============================================
-- 4. KEGIATAN POLICIES (Pengaju & Review)
-- ============================================
DROP POLICY IF EXISTS "Koordinator can insert kegiatan" ON public.kegiatan;
DROP POLICY IF EXISTS "Koordinator can view own kegiatan" ON public.kegiatan;
DROP POLICY IF EXISTS "Sekretaris+ can update kegiatan" ON public.kegiatan;

-- Anyone authenticated can insert kegiatan (with proper role)
CREATE POLICY "Authorized users insert kegiatan"
    ON public.kegiatan FOR INSERT
    WITH CHECK (
        pengaju_id = auth.uid()
        AND (is_paroki_wide_admin() OR is_lingkungan_admin() OR is_any_seksi_bidang())
    );

-- Pengaju can view own kegiatan
CREATE POLICY "Pengaju view own kegiatan"
    ON public.kegiatan FOR SELECT
    USING (pengaju_id = auth.uid());

-- Paroki admin can view all kegiatan
CREATE POLICY "Paroki admin view all kegiatan"
    ON public.kegiatan FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- Lingkungan admin can view kegiatan (no lingkungan filter on kegiatan table)
CREATE POLICY "Lingkungan admin view kegiatan"
    ON public.kegiatan FOR SELECT
    USING (is_lingkungan_admin());

-- Seksi/Bidang can view all kegiatan (paroki-wide read)
CREATE POLICY "Seksi Bidang view all kegiatan"
    ON public.kegiatan FOR SELECT
    USING (is_any_seksi_bidang() OR is_super_admin());

-- Pengaju can update own kegiatan
CREATE POLICY "Pengaju update own kegiatan"
    ON public.kegiatan FOR UPDATE
    USING (pengaju_id = auth.uid() AND status IN ('draft', 'pending'))
    WITH CHECK (pengaju_id = auth.uid());

-- Paroki admin can update kegiatan
CREATE POLICY "Paroki admin update kegiatan"
    ON public.kegiatan FOR UPDATE
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- ============================================
-- 5. LAPORAN POLICIES (Seksi/Bidang write, Admin read)
-- ============================================
DROP POLICY IF EXISTS "Koordinator can insert laporan" ON public.laporan_seksi;
DROP POLICY IF EXISTS "Users can view their laporan" ON public.laporan_seksi;

-- Seksi/Bidang can insert own laporan
CREATE POLICY "Pengisi insert own laporan"
    ON public.laporan_seksi FOR INSERT
    WITH CHECK (pengisi_id = auth.uid());

-- Pengisi can view own laporan
CREATE POLICY "Pengisi view own laporan"
    ON public.laporan_seksi FOR SELECT
    USING (pengisi_id = auth.uid());

-- Paroki admin can view all laporan
CREATE POLICY "Paroki admin view all laporan"
    ON public.laporan_seksi FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- Seksi/Bidang of same category can view (simplified - no kategori_seksi column)
CREATE POLICY "Seksi same category view laporan"
    ON public.laporan_seksi FOR SELECT
    USING (
        is_any_seksi_bidang()
        OR is_super_admin()
    );

-- ============================================
-- 6. SAKRAMEN POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own sakramen" ON public.sakramen_registrations;
DROP POLICY IF EXISTS "Users can register sakramen" ON public.sakramen_registrations;

-- Owner can view own
CREATE POLICY "Owner view own sakramen"
    ON public.sakramen_registrations FOR SELECT
    USING (user_id = auth.uid());

-- Paroki admin can view all
CREATE POLICY "Paroki admin view all sakramen"
    ON public.sakramen_registrations FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- Lingkungan admin can view sakramen of their ling
CREATE POLICY "Lingkungan admin view own ling sakramen"
    ON public.sakramen_registrations FOR SELECT
    USING (
        is_lingkungan_admin()
        AND user_id IN (
            SELECT id FROM public.profiles
            WHERE lingkungan_id = get_user_lingkungan_id()
        )
    );

-- Owner can register
CREATE POLICY "Owner register sakramen"
    ON public.sakramen_registrations FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Pastor/Vikaris can update status (approve)
CREATE POLICY "Pastor update sakramen status"
    ON public.sakramen_registrations FOR UPDATE
    USING (is_pastor_or_vikaris() OR is_super_admin())
    WITH CHECK (is_pastor_or_vikaris() OR is_super_admin());

-- ============================================
-- 7. PASTORAL SOS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can trigger SOS" ON public.pastoral_sos;
DROP POLICY IF EXISTS "Pastor+ can view all SOS" ON public.pastoral_sos;
DROP POLICY IF EXISTS "Pastor can update SOS" ON public.pastoral_sos;

-- Umat can trigger SOS
CREATE POLICY "Umat trigger SOS"
    ON public.pastoral_sos FOR INSERT
    WITH CHECK (triggered_by = auth.uid());

-- Triggered_by user can view own SOS
CREATE POLICY "Triggerer view own SOS"
    ON public.pastoral_sos FOR SELECT
    USING (triggered_by = auth.uid());

-- Pastor/Vikaris can view all SOS
CREATE POLICY "Pastor view all SOS"
    ON public.pastoral_sos FOR SELECT
    USING (is_pastor_or_vikaris() OR is_super_admin());

-- KL can view SOS in their ling
CREATE POLICY "KL view own ling SOS"
    ON public.pastoral_sos FOR SELECT
    USING (
        get_user_role() = 'ketua_lingkungan'
        AND triggered_by IN (
            SELECT id FROM public.profiles
            WHERE lingkungan_id = get_user_lingkungan_id()
        )
    );

-- Pastor/Vikaris can update SOS
CREATE POLICY "Pastor update SOS"
    ON public.pastoral_sos FOR UPDATE
    USING (is_pastor_or_vikaris() OR is_super_admin())
    WITH CHECK (is_pastor_or_vikaris() OR is_super_admin());

-- KL can update SOS of their ling
CREATE POLICY "KL update own ling SOS"
    ON public.pastoral_sos FOR UPDATE
    USING (
        get_user_role() = 'ketua_lingkungan'
        AND triggered_by IN (
            SELECT id FROM public.profiles
            WHERE lingkungan_id = get_user_lingkungan_id()
        )
    )
    WITH CHECK (
        get_user_role() = 'ketua_lingkungan'
        AND triggered_by IN (
            SELECT id FROM public.profiles
            WHERE lingkungan_id = get_user_lingkungan_id()
        )
    );

-- ============================================
-- 8. NOTIFICATIONS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications (mark read)" ON public.notifications;

-- User view own notifications
CREATE POLICY "User view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

-- Paroki admin can send notifications
CREATE POLICY "Paroki admin send notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin() OR is_lingkungan_admin());

-- User update own (mark read)
CREATE POLICY "User update own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 9. GOVERNANCE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Layer 7+ can view governance" ON public.governance_program_kerja;
DROP POLICY IF EXISTS "Layer 7+ can manage governance" ON public.governance_program_kerja;
DROP POLICY IF EXISTS "Layer 8+ can view RKAP" ON public.governance_rkap;
DROP POLICY IF EXISTS "Layer 8+ can view keputusan DPP" ON public.governance_keputusan_dpp;

-- Layer 7+ can view & manage governance
CREATE POLICY "Paroki admin manage governance"
    ON public.governance_program_kerja FOR ALL
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- Layer 8+ can view RKAP
CREATE POLICY "Layer 8+ view RKAP"
    ON public.governance_rkap FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin() OR get_user_access_layer() >= 8);

-- Layer 8+ can manage RKAP
CREATE POLICY "Layer 8+ manage RKAP"
    ON public.governance_rkap FOR ALL
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- Layer 8+ can view keputusan DPP
CREATE POLICY "Layer 8+ view keputusan DPP"
    ON public.governance_keputusan_dpp FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- ============================================
-- 10. AUDIT LOGS POLICIES (Tim Audit Only)
-- ============================================
DROP POLICY IF EXISTS "Tim Audit can view audit logs" ON public.audit_logs;
-- DROP POLICY IF EXISTS "Tim Audit can view activity logs" ON public.activitylogs;

-- Layer 8+ can view audit logs
CREATE POLICY "Layer 8+ view audit logs"
    ON public.audit_logs FOR SELECT
    USING (get_user_access_layer() >= 8 OR is_super_admin());

-- Layer 8+ can view activity logs (if table exists)
-- Layer 8+ can view activity logs (table does not exist, skipped)
-- CREATE POLICY "Layer 8+ view activity logs"
--     ON public.activitylogs FOR SELECT
--     USING (get_user_access_layer() >= 8 OR is_super_admin());
-- ============================================
-- 11. WHISTLEBLOWER POLICIES
-- ============================================
DROP POLICY IF EXISTS "Only Pastor can view whistleblower" ON public.whistleblower_reports;
DROP POLICY IF EXISTS "Any user can submit whistleblower" ON public.whistleblower_reports;

-- Pastor/Vikaris/Super Admin can view whistleblower
CREATE POLICY "Pastor view whistleblower"
    ON public.whistleblower_reports FOR SELECT
    USING (is_pastor_or_vikaris() OR is_super_admin());

-- Any user can submit
CREATE POLICY "Any user submit whistleblower"
    ON public.whistleblower_reports FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 12. DANA KASIH POLICIES
-- ============================================
DROP POLICY IF EXISTS "Layer 2+ can view dana kasih" ON public.dana_kasih;
DROP POLICY IF EXISTS "Layer 2+ can donate" ON public.dana_kasih_donors;

-- All Layer 2+ can view dana kasih
CREATE POLICY "View dana kasih"
    ON public.dana_kasih FOR SELECT
    USING (get_user_access_layer() >= 2 OR is_super_admin());

-- Donors can donate
CREATE POLICY "Donate"
    ON public.dana_kasih_donors FOR INSERT
    WITH CHECK (donor_id = auth.uid() AND get_user_access_layer() >= 2);

-- ============================================
-- 13. FAMILIES POLICIES (Isolasi per lingkungan)
-- ============================================

-- Paroki admin can view all families
CREATE POLICY "Paroki admin view all families"
    ON public.families FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- Lingkungan admin can view families in their lingkungan
CREATE POLICY "Lingkungan admin view own ling families"
    ON public.families FOR SELECT
    USING (
        is_lingkungan_admin()
        AND lingkungan_id = get_user_lingkungan_id()
    );

-- ============================================
-- 14. LINGKUNGAN POLICIES
-- ============================================

-- All authenticated users can view lingkungan (needed for Pintu 2 routing)
CREATE POLICY "View lingkungan"
    ON public.lingkungan FOR SELECT
    USING (auth.role() = 'authenticated' OR is_super_admin());

-- Only paroki admin can manage lingkungan
CREATE POLICY "Paroki admin manage lingkungan"
    ON public.lingkungan FOR ALL
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- ============================================
-- 15. WILAYAH POLICIES
-- ============================================
CREATE POLICY "View wilayah"
    ON public.wilayah FOR SELECT
    USING (auth.role() = 'authenticated' OR is_super_admin());

CREATE POLICY "Paroki admin manage wilayah"
    ON public.wilayah FOR ALL
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- ============================================
-- 16. SURAT PASTORAL POLICIES
-- ============================================
DROP POLICY IF EXISTS "Only recipient and pastor can view surat" ON public.surat_pastoral;
DROP POLICY IF EXISTS "Pastor can send surat" ON public.surat_pastoral;
DROP POLICY IF EXISTS "Only Pastor can view surat pastoral" ON public.surat_pastoral;

-- Recipient and Pastor can view surat
CREATE POLICY "Surat view by recipient/pastor"
    ON public.surat_pastoral FOR SELECT
    USING (recipient_id = auth.uid() OR sender_id = auth.uid() OR is_super_admin());

-- Pastor can send
CREATE POLICY "Pastor send surat"
    ON public.surat_pastoral FOR INSERT
    WITH CHECK (sender_id = auth.uid() AND is_pastor_or_vikaris());

-- ============================================
-- 17. WDL POLICIES
-- ============================================
DROP POLICY IF EXISTS "WDL can view consent records" ON public.wdl_consent;
DROP POLICY IF EXISTS "Umat can manage own consent" ON public.wdl_consent;
DROP POLICY IF EXISTS "Umat can revoke own consent" ON public.wdl_consent;

-- WDL and umat can view consent
CREATE POLICY "WDL/umat view consent"
    ON public.wdl_consent FOR SELECT
    USING (umat_id = auth.uid() OR wdl_profile_id = auth.uid() OR is_super_admin());

-- Umat can grant consent
CREATE POLICY "Umat grant consent"
    ON public.wdl_consent FOR INSERT
    WITH CHECK (umat_id = auth.uid());

-- Umat can revoke
CREATE POLICY "Umat revoke consent"
    ON public.wdl_consent FOR UPDATE
    USING (umat_id = auth.uid())
    WITH CHECK (umat_id = auth.uid());

-- WDL can view access log
CREATE POLICY "WDL view access log"
    ON public.wdl_access_log FOR SELECT
    USING (umat_id = auth.uid() OR wdl_id = auth.uid() OR is_super_admin());

-- ============================================
-- 18. COMPANION POLICIES (STRICT - ONLY OWNER)
-- ============================================
DROP POLICY IF EXISTS "Only owner can view companion sessions" ON public.companion_sessions;
DROP POLICY IF EXISTS "Only owner can view companion transcripts" ON public.companion_sessions;
DROP POLICY IF EXISTS "Users can create their companion session" ON public.companion_sessions;

-- Only owner can view their own sessions
CREATE POLICY "Owner view own companion sessions"
    ON public.companion_sessions FOR SELECT
    USING (user_id = auth.uid() OR is_super_admin());

-- Only owner can view their own transcripts
CREATE POLICY "Owner view own companion transcripts"
    ON public.companion_transcripts FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.companion_sessions WHERE user_id = auth.uid()
        )
        OR is_super_admin()
    );

-- Owner can create their own session
CREATE POLICY "Owner create companion session"
    ON public.companion_sessions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 19. PARISH PROFILE POLICIES
-- ============================================
CREATE POLICY "View parish profile"
    ON public.parish_profile FOR SELECT
    USING (auth.role() = 'authenticated' OR is_super_admin());

CREATE POLICY "Paroki admin manage parish profile"
    ON public.parish_profile FOR ALL
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- ============================================
-- 20. ROLES & USER_ROLES POLICIES
-- ============================================
CREATE POLICY "View roles"
    ON public.roles FOR SELECT
    USING (auth.role() = 'authenticated' OR is_super_admin());

CREATE POLICY "Super admin manage roles"
    ON public.roles FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

CREATE POLICY "View user_roles"
    ON public.user_roles FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_paroki_wide_admin()
        OR is_super_admin()
    );

CREATE POLICY "Super admin manage user_roles"
    ON public.user_roles FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());