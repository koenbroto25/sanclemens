-- Migration 054: Update v5 Roles - Add marketplace roles and extend check constraint
-- Ref: GDD v5 Bab 2.2 "Daftar Peran Utama"
-- Purpose: Add buyer, seller, ojek_solidaritas, manager_marketplace, keuangan_marketplace roles

-- ============================================
-- 1. EXTEND role CHECK CONSTRAINT on profiles to include v5 marketplace roles
-- ============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (
    -- Original roles
    'umat','pastor','vikaris','wali_digital',
    'ketua_lingkungan','sekretaris','bendahara_ii',
    'bendahara_iii','koordinator_bidang','sub_koordinator',
    'wakil_ketua','tim_audit','operator_ict','super_admin','kurator_liturgis',
    'mitra_eksternal',
    -- v4 extended roles (from migration 20260608000000)
    'super_admin_dev',
    'admin_portal_1',
    'admin_portal_2',
    'wakil_ketua_lingkungan',
    'sekretaris_lingkungan',
    'bendahara_lingkungan',
    'seksi_liturgi',
    'seksi_pewartaan',
    'seksi_pendidikan_iman',
    'seksi_sosial_paroki',
    'seksi_sosial_lingkungan',
    'seksi_dana_kasih',
    'seksi_sarana',
    -- v5 marketplace roles (NEW)
    'buyer',
    'seller',
    'ojek_solidaritas',
    'manager_marketplace',
    'keuangan_marketplace'
));

-- ============================================
-- 2. INSERT v5 MARKETPLACE roles into roles table
-- ============================================
INSERT INTO public.roles (role_name, display_name, access_layer, description) VALUES
    ('buyer', 'Buyer (Pembeli)', 2, 'Akses marketplace untuk pembelian'),
    ('seller', 'Seller (Penjual)', 2, 'Akses marketplace untuk penjualan'),
    ('ojek_solidaritas', 'Ojek Solidaritas', 2, 'Driver pengantaran internal marketplace'),
    ('manager_marketplace', 'Manager Marketplace', 7, 'Operasional marketplace'),
    ('keuangan_marketplace', 'Keuangan Marketplace', 6, 'Keuangan marketplace RK-3')
ON CONFLICT (role_name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    access_layer = EXCLUDED.access_layer,
    description = EXCLUDED.description;

-- ============================================
-- 3. UPDATE existing helper functions to understand v5 roles
-- ============================================

-- Update is_super_admin to include marketplace managers where appropriate
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('super_admin', 'super_admin_dev', 'operator_ict') FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add new helper for marketplace roles
CREATE OR REPLACE FUNCTION public.is_marketplace_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('manager_marketplace', 'keuangan_marketplace', 'seller', 'buyer', 'ojek_solidaritas') FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is marketplace admin (manager or keuangan)
CREATE OR REPLACE FUNCTION public.is_marketplace_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('manager_marketplace', 'keuangan_marketplace') FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 4. GRANTS
-- ============================================
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON FUNCTION public.is_marketplace_role() IS 'Returns true if user has any marketplace role (buyer, seller, ojek, manager, finance)';
COMMENT ON FUNCTION public.is_marketplace_admin() IS 'Returns true if user is marketplace admin (manager or finance)';