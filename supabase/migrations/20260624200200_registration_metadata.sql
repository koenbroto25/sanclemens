-- Migration 070: Registration Metadata Enhancement
-- Date: 24 Juni 2026
-- Ref: Enhance profiles table for registration tracking

-- ============================================
-- 1. ADD REGISTRATION TRACKING FIELDS
-- ============================================
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    registration_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    verification_method TEXT DEFAULT 'otp_whatsapp' CHECK (verification_method IN ('otp_whatsapp','admin','import'));

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    verification_completed_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    document_uploaded BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    document_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    document_verified_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    document_verified_by UUID REFERENCES public.profiles(id);

-- ============================================
-- 2. ADD FAMILY INVITATION TRACKING
-- ============================================
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    invited_by_family_id UUID REFERENCES public.families(id);

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    invitation_accepted_at TIMESTAMPTZ;

-- ============================================
-- 3. UPDATE TRIGGER for registration_date
-- ============================================
CREATE OR REPLACE FUNCTION public.set_registration_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.registration_date IS NULL THEN
        NEW.registration_date := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_registration_date_trigger ON public.profiles;

CREATE TRIGGER set_registration_date_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_registration_date();

-- ============================================
-- 4. CREATE INDEX for registration queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_registration_source ON public.profiles(registration_source);
CREATE INDEX IF NOT EXISTS idx_profiles_registered_by ON public.profiles(registered_by);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_date ON public.profiles(registration_date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_status_created ON public.profiles(status, created_at DESC);

-- ============================================
-- 5. HELPER FUNCTION: Get pending registrations
-- ============================================
CREATE OR REPLACE FUNCTION public.get_pending_registrations(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    phone TEXT,
    status TEXT,
    registration_source TEXT,
    registration_date TIMESTAMPTZ,
    family_id UUID,
    lingkungan_id UUID,
    days_pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.phone,
        p.status,
        p.registration_source,
        p.registration_date,
        p.family_id,
        p.lingkungan_id,
        EXTRACT(DAY FROM NOW() - p.registration_date)::INTEGER as days_pending
    FROM public.profiles p
    WHERE p.status = 'pending'
    AND p.access_layer < 2
    ORDER BY p.registration_date ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. HELPER FUNCTION: Approve registration
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_registration(
    p_approver_id UUID,
    p_user_id UUID,
    p_new_access_layer INTEGER DEFAULT 2,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_approver_layer INTEGER;
BEGIN
    -- Check approver permission
    SELECT access_layer INTO v_approver_layer
    FROM public.profiles
    WHERE id = p_approver_id AND status = 'active';

    IF v_approver_layer IS NULL OR v_approver_layer < 5 THEN
        RAISE EXCEPTION 'Insufficient permissions to approve registration';
    END IF;

    -- Update user profile
    UPDATE public.profiles
    SET 
        status = 'active',
        access_layer = p_new_access_layer,
        approved_by = p_approver_id,
        approved_at = NOW(),
        verification_completed_at = NOW(),
        registration_notes = COALESCE(p_notes, registration_notes)
    WHERE id = p_user_id AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. HELPER FUNCTION: Reject registration
-- ============================================
CREATE OR REPLACE FUNCTION public.reject_registration(
    p_rejector_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_rejector_layer INTEGER;
BEGIN
    -- Check rejector permission
    SELECT access_layer INTO v_rejector_layer
    FROM public.profiles
    WHERE id = p_rejector_id AND status = 'active';

    IF v_rejector_layer IS NULL OR v_rejector_layer < 5 THEN
        RAISE EXCEPTION 'Insufficient permissions to reject registration';
    END IF;

    -- Update user profile
    UPDATE public.profiles
    SET 
        status = 'suspended',
        registration_notes = COALESCE(
            CONCAT(COALESCE(registration_notes, ''), '\nRejected: ', COALESCE(p_reason, 'No reason provided')),
            registration_notes
        )
    WHERE id = p_user_id AND status IN ('pending', 'active');

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_pending_registrations(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_registration(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_registration(UUID, UUID, TEXT) TO authenticated;