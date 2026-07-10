-- Migration 011: Add SOS Parish Configuration
-- Ref: masterplan.md Sub-Fase 1.3 - Tahap A2
-- This migration adds contact fields for Pastor, Vikaris, WK1, and Keuskupan
-- to the public.parish_profile table for SOS escalation.

-- ============================================
-- 1. Add columns to parish_profile
-- ============================================
ALTER TABLE public.parish_profile
    ADD COLUMN IF NOT EXISTS pastor_phone TEXT,
    ADD COLUMN IF NOT EXISTS vikaris_phone TEXT,
    ADD COLUMN IF NOT EXISTS wk1_phone TEXT,
    ADD COLUMN IF NOT EXISTS keuskupan_emergency_phone TEXT;

-- ============================================
-- 2. Update existing parish_profile with sample data
--    NOTE: Replace with actual phone numbers for production
-- ============================================
UPDATE public.parish_profile
SET
    pastor_phone = '6281234567890', -- Sample Pastor Phone
    vikaris_phone = '6281234567891', -- Sample Vikaris Phone
    wk1_phone = '6281234567892',    -- Sample Wakil Ketua I Phone
    keuskupan_emergency_phone = '6281234567893' -- Sample Keuskupan Emergency Phone
WHERE id = (SELECT id FROM public.parish_profile LIMIT 1); -- Assumes one parish profile exists

-- ============================================
-- 3. RLS for parish_profile (if not already defined in 008_add_rls_policies.sql)
--    Ensure only authorized roles can update these sensitive contacts.
-- ============================================
-- Assuming RLS is already enabled for parish_profile and basic policies exist.
-- If not, these policies would need to be added:
-- ALTER TABLE public.parish_profile ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public can view parish profile" ON public.parish_profile FOR SELECT USING (TRUE);
-- CREATE POLICY "Super Admin can manage parish profile" ON public.parish_profile FOR ALL USING (get_user_access_layer() >= 10) WITH CHECK (get_user_access_layer() >= 10);
-- CREATE POLICY "Pastor+ can update own profile" ON public.parish_profile FOR UPDATE USING (get_user_access_layer() >= 9) WITH CHECK (get_user_access_layer() >= 9);

-- For these new columns, specifically: only Layer 9 (Pastor) and Layer 10 (Super Admin) should be able to modify them.
-- This is implicitly covered if there's a general "Super Admin can manage" policy.
-- If more granular control is needed, specific UPDATE policies targeting these columns would be required.