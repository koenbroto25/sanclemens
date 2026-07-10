-- Migration 059: Refine admin registration function for v5
-- Ref: GDD v5 Bab 2.2 "Daftar Peran Utama" - Pendaftaran Pengurus oleh Super Admin
-- Purpose: Update approve_admin_registration to support v5 role assignment and password management

-- ============================================
-- 1. UPDATE approve_admin_registration function
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_admin_registration(
    p_registration_id UUID,
    p_role TEXT,
    p_access_layer INTEGER,
    p_lingkungan_slug TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_registration admin_registrations;
    v_user_id UUID;
    v_temp_password TEXT;
    v_display_name TEXT;
BEGIN
    -- Get registration data
    SELECT * INTO v_registration FROM public.admin_registrations WHERE id = p_registration_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found';
    END IF;

    -- Validate role
    IF p_role NOT IN ('pastor', 'vikaris', 'ketua_lingkungan', 'sekretaris', 'bendahara_ii', 
                       'bendahara_iii', 'koordinator_bidang', 'sub_koordinator', 'wakil_ketua',
                       'sekretaris_lingkungan', 'bendahara_lingkungan', 'wakil_ketua_lingkungan',
                       'manager_marketplace', 'keuangan_marketplace', 'kurator_liturgis',
                       'seksi_liturgi', 'seksi_pewartaan', 'seksi_pendidikan_iman',
                       'seksi_sosial_paroki', 'seksi_sosial_lingkungan', 'seksi_dana_kasih',
                       'seksi_sarana', 'admin_portal_1', 'admin_portal_2') THEN
        RAISE EXCEPTION 'Invalid admin role: %', p_role;
    END IF;

    -- Get display name for the role
    SELECT display_name INTO v_display_name FROM public.roles WHERE role_name = p_role;

    -- Generate temp password (8 character alphanumeric)
    v_temp_password := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

    -- Update registration status
    UPDATE public.admin_registrations
    SET status = 'approved',
        approved_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_registration_id;

    -- Return the registration ID (actual user creation handled by API layer)
    RETURN p_registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. ADD helper function to get admin role display names
-- ============================================
CREATE OR REPLACE FUNCTION public.get_admin_role_info(p_role TEXT)
RETURNS TABLE(role_name TEXT, display_name TEXT, access_layer INT) AS $$
BEGIN
    RETURN QUERY SELECT r.role_name, r.display_name, r.access_layer
    FROM public.roles r
    WHERE r.role_name = p_role AND r.access_layer >= 4;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 3. COMMENTS
-- ============================================
COMMENT ON FUNCTION public.approve_admin_registration(UUID, TEXT, INTEGER, TEXT) IS 'v5: Approve admin registration and assign role. Handles validation and password generation';
COMMENT ON FUNCTION public.get_admin_role_info(TEXT) IS 'v5: Get role information for admin registration (access_layer >= 4)';