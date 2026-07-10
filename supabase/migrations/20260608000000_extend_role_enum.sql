-- Migration 20260608000000: Extend role enum and add helper functions
-- Ref: P5 Role-Based Access & Multi-Portal RLS
-- Created: 08 Juni 2026

-- ============================================
-- 1. EXTEND role CHECK CONSTRAINT on profiles
-- ============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (
    -- Original roles
    'umat','pastor','vikaris','wali_digital',
    'ketua_lingkungan','sekretaris','bendahara_ii',
    'bendahara_iii','koordinator_bidang','sub_koordinator',
    'wakil_ketua','tim_audit','operator_ict','super_admin','kurator_liturgis',
    -- New roles (Portal 1 & 2)
    'super_admin_dev',           -- Layer 10: God mode developer
    'admin_portal_1',            -- Layer 9: Content manager paroki
    'admin_portal_2',            -- Layer 4-6: Content manager lingkungan
    'wakil_ketua_lingkungan',    -- Layer 4: WKL
    'sekretaris_lingkungan',     -- Layer 4: Sekre Ling
    'bendahara_lingkungan',      -- Layer 4: Bende Ling
    'seksi_liturgi',             -- Layer 7: Koordinator Bidang Liturgi
    'seksi_pewartaan',           -- Layer 7: Koordinator Bidang Pewartaan
    'seksi_pendidikan_iman',     -- Layer 7: Koordinator Bidang Pendidikan
    'seksi_sosial_paroki',       -- Layer 7: Koordinator Bidang Sosial Paroki
    'seksi_sosial_lingkungan',   -- Layer 4: Seksi Sosial Lingkungan
    'seksi_dana_kasih',          -- Layer 7: Koordinator Bidang Dana Kasih
    'seksi_sarana'               -- Layer 7: Koordinator Bidang Sarana
));

-- ============================================
-- 2. HELPER FUNCTIONS
-- ============================================

-- Get current user's access layer
CREATE OR REPLACE FUNCTION public.get_user_access_layer()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT access_layer FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get current user's lingkungan_id
CREATE OR REPLACE FUNCTION public.get_user_lingkungan_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT lingkungan_id FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is Pastor or Vikaris (always true for them on all portals)
CREATE OR REPLACE FUNCTION public.is_pastor_or_vikaris()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('pastor', 'vikaris') FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is Super Admin (Developer)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('super_admin', 'super_admin_dev', 'operator_ict') FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a paroki-wide admin (Pastor, Vikaris, Wakil, Sekretaris, Bendahara, Tim Audit)
CREATE OR REPLACE FUNCTION public.is_paroki_wide_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN (
            'pastor', 'vikaris', 'super_admin', 'super_admin_dev', 'operator_ict',
            'wakil_ketua', 'tim_audit', 'sekretaris', 'bendahara_ii', 'bendahara_iii',
            'admin_portal_1', 'koordinator_bidang', 'sub_koordinator', 'kurator_liturgis'
        ) FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a lingkungan admin (KL, WKL, Sekre Ling, Bende Ling, Seksi Sosling)
CREATE OR REPLACE FUNCTION public.is_lingkungan_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN (
            'ketua_lingkungan', 'wakil_ketua_lingkungan', 'sekretaris_lingkungan',
            'bendahara_lingkungan', 'admin_portal_2', 'seksi_sosial_lingkungan'
        ) FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a specific seksi bidang
CREATE OR REPLACE FUNCTION public.is_seksi_bidang(sekre_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = seksi_name FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is any Seksi/Bidang
CREATE OR REPLACE FUNCTION public.is_any_seksi_bidang()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN (
            'seksi_liturgi', 'seksi_pewartaan', 'seksi_pendidikan_iman',
            'seksi_sosial_paroki', 'seksi_dana_kasih', 'seksi_sarana'
        ) FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin portal 1
CREATE OR REPLACE FUNCTION public.is_admin_portal_1()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN (
            'admin_portal_1', 'super_admin', 'super_admin_dev', 'operator_ict',
            'pastor', 'vikaris', 'wakil_ketua', 'tim_audit', 'sekretaris',
            'bendahara_ii', 'bendahara_iii', 'koordinator_bidang', 'sub_koordinator',
            'kurator_liturgis'
        ) FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin portal 2 (for their own lingkungan)
CREATE OR REPLACE FUNCTION public.is_admin_portal_2()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN (
            'admin_portal_2', 'ketua_lingkungan', 'wakil_ketua_lingkungan',
            'sekretaris_lingkungan', 'bendahara_lingkungan', 'seksi_sosial_lingkungan'
        ) FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 3. UPDATE ROLES TABLE (display metadata)
-- ============================================
INSERT INTO public.roles (role_name, display_name, access_layer, description) VALUES
    ('super_admin_dev', 'Super Admin (Developer)', 10, 'God mode untuk perbaikan teknis'),
    ('admin_portal_1', 'Admin Portal 1', 9, 'Pengisian data Paroki'),
    ('admin_portal_2', 'Admin Portal 2', 6, 'Pengisian data Lingkungan'),
    ('wakil_ketua_lingkungan', 'Wakil Ketua Lingkungan', 4, 'Wakil KL lingkungannya'),
    ('sekretaris_lingkungan', 'Sekretaris Lingkungan', 4, 'Sekretaris di lingkungannya'),
    ('bendahara_lingkungan', 'Bendahara Lingkungan', 4, 'Bendahara di lingkungannya'),
    ('seksi_liturgi', 'Seksi Liturgi', 7, 'Koordinator Bidang Liturgi'),
    ('seksi_pewartaan', 'Seksi Pewartaan', 7, 'Koordinator Bidang Pewartaan'),
    ('seksi_pendidikan_iman', 'Seksi Pendidikan Iman', 7, 'Koordinator Bidang Pendidikan'),
    ('seksi_sosial_paroki', 'Seksi Sosial Paroki', 7, 'Koordinator Bidang Sosial Paroki'),
    ('seksi_sosial_lingkungan', 'Seksi Sosial Lingkungan', 4, 'Koordinator Sosial di lingkungannya'),
    ('seksi_dana_kasih', 'Seksi Dana Kasih', 7, 'Koordinator Bidang Dana Kasih'),
    ('seksi_sarana', 'Seksi Sarana & Prasarana', 7, 'Koordinator Bidang Sarana')
ON CONFLICT (role_name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    access_layer = EXCLUDED.access_layer,
    description = EXCLUDED.description;

-- ============================================
-- 4. COMMENTS
-- ============================================
COMMENT ON FUNCTION public.get_user_access_layer() IS 'Returns access_layer of currently authenticated user';
COMMENT ON FUNCTION public.get_user_lingkungan_id() IS 'Returns lingkungan_id of currently authenticated user (NULL if not in any lingkungan)';
COMMENT ON FUNCTION public.get_user_role() IS 'Returns role of currently authenticated user';
COMMENT ON FUNCTION public.is_pastor_or_vikaris() IS 'Returns true if user is Pastor or Vikaris (god role, never changes)';
COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if user is Super Admin/Developer/Operator ICT';
COMMENT ON FUNCTION public.is_paroki_wide_admin() IS 'Returns true if user has paroki-wide access (Pastor, Vikaris, Wakil, Tim Audit, dll)';
COMMENT ON FUNCTION public.is_lingkungan_admin() IS 'Returns true if user is KL/WKL/Sekre Ling/Bende Ling/Seksi Sosling (limited to their own lingkungan)';
COMMENT ON FUNCTION public.is_seksi_bidang(TEXT) IS 'Returns true if user has the specified seksi_bidang role';
COMMENT ON FUNCTION public.is_any_seksi_bidang() IS 'Returns true if user is any Seksi/Bidang (paroki-wide)';
COMMENT ON FUNCTION public.is_admin_portal_1() IS 'Returns true if user can manage Portal 1 (Paroki content)';
COMMENT ON FUNCTION public.is_admin_portal_2() IS 'Returns true if user can manage Portal 2 (Lingkungan content) for their own lingkungan';