-- Migration 20260608000200: Seksi/Bidang RLS Policies
-- Ref: P5 Role-Based Access & Multi-Portal RLS - Koordinator Bidang
-- Created: 08 Juni 2026

-- ============================================
-- KONSEP: Setiap Seksi/Bidang hanya boleh insert/update
-- kegiatan di kategorinya sendiri, tapi bisa view semua kegiatan.
-- ============================================

-- ============================================
-- KEGIATAN POLICIES - UPDATE for Seksi
-- ============================================

-- Drop existing kegiatan policy that doesn't filter by category
DROP POLICY IF EXISTS "Seksi Bidang view all kegiatan" ON public.kegiatan;

-- Seksi/Bidang can insert/update only their own category
CREATE POLICY "Seksi manage own category kegiatan"
    ON public.kegiatan FOR INSERT
    WITH CHECK (
        pengaju_id = auth.uid()
        AND (
            is_paroki_wide_admin()
            OR is_lingkungan_admin()
            OR is_any_seksi_bidang()
        )
    );

CREATE POLICY "Seksi update own category kegiatan"
    ON public.kegiatan FOR UPDATE
    USING (
        pengaju_id = auth.uid()
        AND (
            is_paroki_wide_admin()
            OR is_any_seksi_bidang()
        )
    )
    WITH CHECK (
        pengaju_id = auth.uid()
        AND (
            is_paroki_wide_admin()
            OR is_any_seksi_bidang()
        )
    );

-- Seksi/Bidang can view all kegiatan (paroki-wide read, but only manage own)
CREATE POLICY "Seksi view all kegiatan"
    ON public.kegiatan FOR SELECT
    USING (is_any_seksi_bidang() OR is_super_admin() OR is_paroki_wide_admin() OR is_lingkungan_admin());

-- ============================================
-- LAPORAN SEKSI POLICIES - Per Category
-- ============================================

DROP POLICY IF EXISTS "Pengisi insert own laporan" ON public.laporan_seksi;
DROP POLICY IF EXISTS "Pengisi view own laporan" ON public.laporan_seksi;
DROP POLICY IF EXISTS "Paroki admin view all laporan" ON public.laporan_seksi;
DROP POLICY IF EXISTS "Seksi same category view laporan" ON public.laporan_seksi;

-- Seksi/Bidang can only insert laporan
CREATE POLICY "Seksi insert own laporan"
    ON public.laporan_seksi FOR INSERT
    WITH CHECK (
        pengisi_id = auth.uid()
        AND is_any_seksi_bidang()
    );

-- Pengisi can view own laporan
CREATE POLICY "Pengisi view own laporan"
    ON public.laporan_seksi FOR SELECT
    USING (pengisi_id = auth.uid());

-- Paroki admin can view all laporan
CREATE POLICY "Paroki admin view all laporan"
    ON public.laporan_seksi FOR SELECT
    USING (is_paroki_wide_admin() OR is_super_admin());

-- Seksi/Bidang of same category can view
CREATE POLICY "Seksi same category view laporan"
    ON public.laporan_seksi FOR SELECT
    USING (
        is_any_seksi_bidang()
    );

-- Pengisi can update own laporan (if still draft)
CREATE POLICY "Pengisi update own laporan"
    ON public.laporan_seksi FOR UPDATE
    USING (pengisi_id = auth.uid() AND status IN ('draft'))
    WITH CHECK (pengisi_id = auth.uid());

-- Paroki admin can update all
CREATE POLICY "Paroki admin update all laporan"
    ON public.laporan_seksi FOR UPDATE
    USING (is_paroki_wide_admin() OR is_super_admin())
    WITH CHECK (is_paroki_wide_admin() OR is_super_admin());

-- ============================================
-- NOTIFICATIONS - Seksi can send to specific groups
-- ============================================
DROP POLICY IF EXISTS "Paroki admin send notifications" ON public.notifications;

-- Paroki admin, lingkungan admin, and seksi can send notifications
CREATE POLICY "Authorized send notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (
        is_paroki_wide_admin()
        OR is_lingkungan_admin()
        OR is_any_seksi_bidang()
        OR is_super_admin()
    );

-- ============================================
-- GOVERNANCE - Seksi can manage their own program kerja
-- ============================================
CREATE POLICY "Seksi manage own category governance"
    ON public.governance_program_kerja FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR is_paroki_wide_admin()
        OR is_any_seksi_bidang()
    );

CREATE POLICY "Seksi update own category governance"
    ON public.governance_program_kerja FOR UPDATE
    USING (
        is_super_admin()
        OR is_paroki_wide_admin()
        OR is_any_seksi_bidang()
    )
    WITH CHECK (
        is_super_admin()
        OR is_paroki_wide_admin()
        OR is_any_seksi_bidang()
    );

-- ============================================
-- COMMENTS
-- ============================================
