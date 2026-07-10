-- Migration 038: RLS Policies Tambahan v4.0
-- Ref: Appendix A v4.0 — 037_rls_v4.sql
-- PostgreSQL tidak mendukung CREATE POLICY IF NOT EXISTS, jadi gunakan DO block

-- ============================================
-- 1. Policy tambahan untuk tabel eksisting
-- ============================================

-- Policy: profiles — Sekretaris bisa update profiles (verifikasi)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Sekretaris can update profiles" ON public.profiles;
    CREATE POLICY "Sekretaris can update profiles" ON public.profiles
        FOR UPDATE USING (
            auth.uid() IN (
                SELECT id FROM public.profiles WHERE role IN ('sekretaris', 'super_admin', 'operator_ict')
            )
        );
END
$$;

-- Policy: profiles — User bisa update profil sendiri (tidak bisa ubah role/layer via form)
-- Proteksi role/layer ditangani oleh aplikasi layer, bukan RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own profile limited" ON public.profiles;
    CREATE POLICY "Users can update own profile limited" ON public.profiles
        FOR UPDATE USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
END
$$;

-- Policy: families — Anggota keluarga bisa lihat keluarga sendiri
DO $$
BEGIN
    DROP POLICY IF EXISTS "Family members can view own family" ON public.families;
    CREATE POLICY "Family members can view own family" ON public.families
        FOR SELECT USING (
            id IN (
                SELECT family_id FROM public.profiles WHERE id = auth.uid()
            )
        );
END
$$;

-- Policy: families — Sekretaris bisa manage
DO $$
BEGIN
    DROP POLICY IF EXISTS "Sekretaris can manage families" ON public.families;
    CREATE POLICY "Sekretaris can manage families" ON public.families
        FOR ALL USING (
            auth.uid() IN (
                SELECT id FROM public.profiles WHERE role IN ('sekretaris', 'super_admin', 'operator_ict')
            )
        );
END
$$;

-- Policy: lingkungan — KL bisa update lingkungan sendiri
DO $$
BEGIN
    DROP POLICY IF EXISTS "KL can update own lingkungan" ON public.lingkungan;
    CREATE POLICY "KL can update own lingkungan" ON public.lingkungan
        FOR UPDATE USING (
            ketua_lingkungan_id = auth.uid()
            OR auth.uid() IN (
                SELECT id FROM public.profiles WHERE role IN ('super_admin', 'operator_ict')
            )
        );
END
$$;

-- ============================================
-- 2. Function & Trigger: Cegah user ganti role sendiri
-- ============================================
CREATE OR REPLACE FUNCTION prevent_self_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Tidak bisa mengubah role sendiri';
    END IF;
    IF NEW.access_layer IS DISTINCT FROM OLD.access_layer THEN
        RAISE EXCEPTION 'Tidak bisa mengubah access_layer sendiri';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_self_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_change
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.access_layer IS DISTINCT FROM NEW.access_layer)
    EXECUTE FUNCTION prevent_self_role_change();

-- ============================================
-- 3. Grant untuk akses publik
-- ============================================
GRANT SELECT ON public.health_check TO anon;
GRANT SELECT ON public.health_check TO authenticated;