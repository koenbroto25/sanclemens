-- Migration 058: Refine admin portal RLS for v5 Clemens structure
-- Ref: GDD v5 Bab 3.5 "Halaman Admin (Internal Clemens)"
-- Purpose: Adjust RLS policies to support new admin route structure

-- ============================================
-- 1. ENSURING SUPER_ADMIN_CREDENTIALS TABLE IS ROBUST
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin manage credentials' AND tablename = 'super_admin_credentials') THEN
        CREATE POLICY "Super Admin manage credentials" ON public.super_admin_credentials
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'super_admin_dev', 'operator_ict'))
            ) WITH CHECK (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'super_admin_dev', 'operator_ict'))
            );
    END IF;
END $$;

-- ============================================
-- 2. ADMIN PORTAL SEPARATION POLICIES
-- ============================================

-- Refine profiles access for admin portals
DO $$
BEGIN
    -- Only drop if exists and recreate
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki lihat semua profil' AND tablename = 'profiles') THEN
        DROP POLICY "Admin Paroki lihat semua profil" ON public.profiles;
    END IF;
    
    CREATE POLICY "Admin Paroki lihat semua profil" ON public.profiles
        FOR SELECT USING (
            -- Paroki-wide admins (Layer 5+ or pastor/vikaris)
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (
                p.access_layer >= 5 OR 
                p.role IN ('pastor', 'vikaris', 'super_admin', 'super_admin_dev', 'operator_ict')
            ))
        );
END $$;

-- Refine familias access for admin portals
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki lihat semua keluarga' AND tablename = 'families') THEN
        DROP POLICY "Admin Paroki lihat semua keluarga" ON public.families;
    END IF;
    
    CREATE POLICY "Admin Paroki lihat semua keluarga" ON public.families
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (
                p.access_layer >= 5 OR
                p.role IN ('pastor', 'vikaris', 'super_admin', 'super_admin_dev', 'operator_ict')
            ))
        );
END $$;

-- ============================================
-- 3. LINGKUNGAN-SPECIFIC ADMIN ACCESS
-- ============================================

-- Allow lingkungan admins to see profiles within their lingkungan
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lingkungan admin lihat profil lingkungannya' AND tablename = 'profiles') THEN
        CREATE POLICY "Lingkungan admin lihat profil lingkungannya" ON public.profiles
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (
                    p.role IN ('ketua_lingkungan', 'wakil_ketua_lingkungan', 'sekretaris_lingkungan', 
                               'bendahara_lingkungan', 'admin_portal_2', 'seksi_sosial_lingkungan')
                ) AND p.lingkungan_id = profiles.lingkungan_id)
            );
    END IF;
END $$;

-- ============================================
-- 4. PASTOR SPECIFIC ACCESS
-- ============================================
DO $$
BEGIN
    -- Pastor can see all pastoral data including SOS, whistleblower, companion
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pastor akses semua data pastoral' AND tablename = 'pastoral_sos') THEN
        CREATE POLICY "Pastor akses semua data pastoral" ON public.pastoral_sos
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'vikaris'))
            ) WITH CHECK (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'vikaris'))
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pastor akses whistleblower' AND tablename = 'whistleblower_reports') THEN
        CREATE POLICY "Pastor akses whistleblower" ON public.whistleblower_reports
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'vikaris'))
            ) WITH CHECK (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'vikaris'))
            );
    END IF;
END $$;

-- ============================================
-- 5. MARKETPLACE ADMIN ACCESS TO MARKETPLACE DATA ONLY
-- ============================================
-- Ensure marketplace admins can ONLY access marketplace tables
-- (Already enforced via 057 policies - marketplace admins only have policies on marketplace_*, ojek_*, lowongan_*, tenaga_* tables)

-- ============================================
-- 6. COMMENTS
-- ============================================
COMMENT ON POLICY "Lingkungan admin lihat profil lingkungannya" ON public.profiles IS 'v5: Lingkungan admins can only view profiles in their own lingkungan';
COMMENT ON POLICY "Pastor akses semua data pastoral" ON public.pastoral_sos IS 'v5: Pastor/Vikaris have full access to pastoral SOS data';
COMMENT ON POLICY "Pastor akses whistleblower" ON public.whistleblower_reports IS 'v5: Only Pastor/Vikaris can access whistleblower reports';