-- FASE 7: SISTEM LOGIN & DASHBOARD ADMIN
-- Migration 049: RLS Policies, Views, dan Functions untuk Admin System
-- ============================================================

-- 0. Create super_admin_credentials table if not exists (required for policies below)
CREATE TABLE IF NOT EXISTS public.super_admin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    super_admin_secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

ALTER TABLE public.super_admin_credentials ENABLE ROW LEVEL SECURITY;

-- 1. RLS Policies untuk admin_registrations (tabel sudah ada di 044)
ALTER TABLE public.admin_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activations ENABLE ROW LEVEL SECURITY;

-- Super Admin bisa lihat semua registrasi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin lihat semua registrasi' AND tablename = 'admin_registrations'
  ) THEN
    CREATE POLICY "Super Admin lihat semua registrasi" ON public.admin_registrations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.super_admin_credentials WHERE id IS NOT NULL)
    );
  END IF;
END $$;

-- Super Admin bisa update status registrasi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin update registrasi' AND tablename = 'admin_registrations'
  ) THEN
    CREATE POLICY "Super Admin update registrasi" ON public.admin_registrations
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.super_admin_credentials WHERE id IS NOT NULL)
    );
  END IF;
END $$;

-- Calon admin bisa insert registrasi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Calon admin insert registrasi' AND tablename = 'admin_registrations'
  ) THEN
    CREATE POLICY "Calon admin insert registrasi" ON public.admin_registrations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 2. RLS Policies untuk akses data berdasarkan role admin
-- Admin Paroki (Layer 8-9): bisa lihat semua profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki lihat semua profil' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admin Paroki lihat semua profil" ON public.profiles
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer >= 8)
        );
  END IF;
END $$;

-- Admin Paroki bisa lihat semua keluarga
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki lihat semua keluarga' AND tablename = 'families'
  ) THEN
    CREATE POLICY "Admin Paroki lihat semua keluarga" ON public.families
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer >= 8)
        );
  END IF;
END $$;

-- Admin Paroki bisa lihat semua dokumen vault
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki lihat semua vault' AND tablename = 'digital_vault'
  ) THEN
    CREATE POLICY "Admin Paroki lihat semua vault" ON public.digital_vault
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer >= 8)
        );
  END IF;
END $$;

-- Admin Marketplace policies akan ditambahkan di migration terpisah saat tabel products dan orders dibuat
-- (Fase 4 - Marketplace penuh)

-- 3. Function: Approve admin registration (digunakan oleh Super Admin)
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
BEGIN
    -- Get registration data
    SELECT * INTO v_registration FROM public.admin_registrations WHERE id = p_registration_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found';
    END IF;

    -- Generate temp password
    v_temp_password := upper(substr(md5(random()::text), 1, 8));

    -- Create Supabase Auth user (handled by API layer, not SQL)
    -- Update status
    UPDATE public.admin_registrations
    SET status = 'approved',
        approved_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_registration_id;

    RETURN p_registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Log super admin activity
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
    p_action TEXT
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.super_admin_logs (admin_id, action, ip_address)
    VALUES (auth.uid(), p_action, inet_client_addr())
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Middleware helper: Get user access layer (untuk middleware)
CREATE OR REPLACE FUNCTION public.get_user_access_layer(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_layer INTEGER;
BEGIN
    -- Check super admin first
    IF EXISTS (SELECT 1 FROM public.super_admin_credentials) THEN
        RETURN 10;
    END IF;
    
    -- Check regular profile
    SELECT access_layer INTO v_layer FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_layer, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. View: Admin dashboard - daftar pendaftaran admin pending
CREATE OR REPLACE VIEW public.admin_pending_registrations AS
SELECT 
    ar.id,
    ar.full_name,
    ar.phone,
    ar.role_requested,
    ar.lingkungan_slug,
    ar.created_at,
    ar.updated_at
FROM public.admin_registrations ar
WHERE ar.status = 'pending'
ORDER BY ar.created_at DESC;

-- 7. View: Admin dashboard - statistik sistem
CREATE OR REPLACE VIEW public.admin_system_stats AS
SELECT
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE access_layer >= 2) as total_activated_users,
    (SELECT COUNT(*) FROM public.lingkungan) as total_lingkungan,
    (SELECT COUNT(*) FROM public.families) as total_families,
    (SELECT COUNT(*) FROM public.admin_registrations WHERE status = 'pending') as pending_admin_registrations,
    (SELECT COUNT(*) FROM public.error_logs WHERE is_resolved = FALSE) as unresolved_errors;