-- Migration: AI Schema - Consolidated RLS Policies
-- Created: 19 June 2026
-- Purpose: Additional RLS policies for AI tables that weren't covered in previous migrations

-- This migration consolidates all remaining RLS policies for AI-related tables

-- ============================================
-- ADDITIONAL POLICIES FOR EXISTING TABLES
-- ============================================

-- Table: public.profiles (extend existing with new columns)
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    seller_rating DECIMAL(3,2) DEFAULT 0.00;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    total_sales INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    store_name TEXT;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    store_description TEXT;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    store_category TEXT;

-- Ojek fields
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    ojek_vehicle_type TEXT;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    ojek_vehicle_plate TEXT;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    ojek_max_capacity INTEGER DEFAULT 2;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    ojek_rating DECIMAL(3,2) DEFAULT 0.00;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    total_deliveries INTEGER DEFAULT 0;

-- Table: public.qna (extend for AI)
ALTER TABLE IF EXISTS public.qna ADD COLUMN IF NOT EXISTS
    bot_code TEXT DEFAULT 'bot_public_info';

ALTER TABLE IF EXISTS public.qna ADD COLUMN IF NOT EXISTS
    confidence_threshold DECIMAL(4,3) DEFAULT 0.7;

-- ============================================
-- UMAT_NEEDS TABLE - Additional RLS
-- ============================================

-- Users can read own needs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'umat_needs_read_own' AND tablename = 'umat_needs'
  ) THEN
    CREATE POLICY umat_needs_read_own ON public.umat_needs
    FOR SELECT TO authenticated USING (profile_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'umat_needs_write_own' AND tablename = 'umat_needs'
  ) THEN
    CREATE POLICY umat_needs_write_own ON public.umat_needs
    FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'umat_needs_update_own' AND tablename = 'umat_needs'
  ) THEN
    CREATE POLICY umat_needs_update_own ON public.umat_needs
    FOR UPDATE TO authenticated USING (profile_id = auth.uid());
  END IF;
END $$;

-- KL/Komsos can read needs for their lingkungan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'umat_needs_read_kl' AND tablename = 'umat_needs'
  ) THEN
    CREATE POLICY umat_needs_read_kl ON public.umat_needs
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.lingkungan l ON p.lingkungan_id = l.id
            JOIN public.profiles target_user ON target_user.id = umat_needs.profile_id
            WHERE p.id = auth.uid()
            AND p.access_layer >= 4
            AND target_user.lingkungan_id = l.id
        )
    );
  END IF;
END $$;

-- ============================================
-- ENABLE RLS ON ALL AI TABLES
-- ============================================

ALTER TABLE IF EXISTS public.umat_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_abuse_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.liturgical_calendar_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SERVICE ROLE PERMISSIONS
-- ============================================

-- Grant service_role full access to AI tables for backend operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA companion TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA companion TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA theology TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA theology TO service_role;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.profiles.seller_rating IS 'Average rating for marketplace sellers';
COMMENT ON COLUMN public.profiles.store_name IS 'Display name for user''s marketplace store';
COMMENT ON COLUMN public.profiles.ojek_vehicle_type IS 'Vehicle type for Ojek Solidaritas drivers';
COMMENT ON COLUMN public.profiles.ojek_rating IS 'Average rating for Ojek Solidaritas drivers';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- This completes the AI schema setup (migrations 061-068)
-- Next steps:
-- 1. Run supabase db reset to apply all migrations
-- 2. Seed initial data for learning_modules
-- 3. Implement API endpoints
-- 4. Implement frontend pages