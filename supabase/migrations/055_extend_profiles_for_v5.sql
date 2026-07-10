-- Migration 055: Extend profiles for v5 features
-- Ref: GDD v5 Bab 2.2 "Daftar Peran Utama" - AI Matching Profile Prompt
-- Purpose: Add business/skill fields for AI matching, ensure lingkungan_slug consistency

-- ============================================
-- 1. ADD new columns to profiles for v5 business/skill matching
-- ============================================

-- Add business_skills for Klemen Kerja / AI matching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_skills TEXT[];
COMMENT ON COLUMN public.profiles.business_skills IS 'Keahlian/bisnis untuk AI matching di Klemen Kerja';

-- Add business_description for seller profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_description TEXT;
COMMENT ON COLUMN public.profiles.business_description IS 'Deskripsi bisnis/produk untuk marketplace';

-- Add lingkungan_slug for efficient queries and dynamic role identification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lingkungan_slug TEXT;
COMMENT ON COLUMN public.profiles.lingkungan_slug IS 'Kode identifikasi lingkungan (e.g., AR, FA, MRR) untuk role-based filtering';

-- Add marketplace_profile JSONB for seller/buyer preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketplace_preferences JSONB DEFAULT '{
    "seller_rating": 0,
    "buyer_rating": 0,
    "total_sales": 0,
    "total_purchases": 0,
    "joined_marketplace_at": null
}'::jsonb;
COMMENT ON COLUMN public.profiles.marketplace_preferences IS 'Marketplace-specific profile data (ratings, sales count, etc.)';

-- ============================================
-- 2. CREATE INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_lingkungan_slug ON public.profiles(lingkungan_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_business_skills ON public.profiles USING GIN(business_skills);

-- ============================================
-- 3. UPDATE existing family and lingkungan references
-- ============================================

-- Auto-fill lingkungan_slug from lingkungan table if empty
UPDATE public.profiles p
SET lingkungan_slug = l.nama_abbreviation
FROM (
    SELECT id, 
           CASE 
               WHEN nama ILIKE '%andreas%' THEN 'AR'
               WHEN nama ILIKE '%fransiskus%' THEN 'FA'
               WHEN nama ILIKE '%maria%ratu%rosari%' THEN 'MRR'
               WHEN nama ILIKE '%albertus%' THEN 'AL'
               WHEN nama ILIKE '%maria%salve%regina%' THEN 'MSR'
               WHEN nama ILIKE '%anna%' THEN 'AN'
               WHEN nama ILIKE '%clara%' THEN 'CL'
               WHEN nama ILIKE '%monica%' THEN 'MN'
               WHEN nama ILIKE '%theresia%lisieux%' THEN 'TDL'
               WHEN nama ILIKE '%theresia%avila%' THEN 'TDA'
               WHEN nama ILIKE '%gabriel%' THEN 'GB'
               WHEN nama ILIKE '%la%salette%' THEN 'MLS'
               WHEN nama ILIKE '%immaculata%' THEN 'MI'
               WHEN nama ILIKE '%lukas%' THEN 'LP'
               WHEN nama ILIKE '%yosef%pekerja%' THEN 'YP'
               WHEN nama ILIKE '%stasi%yosef%' THEN 'SY'
               WHEN nama ILIKE '%ratu%rosari%' THEN 'RR'
               ELSE UPPER(LEFT(REGEXP_REPLACE(nama, '[^a-zA-Z]', '', 'g'), 2))
           END as nama_abbreviation
    FROM public.lingkungan
) l
WHERE p.lingkungan_id = l.id AND p.lingkungan_slug IS NULL;

-- ============================================
-- 4. GRANTS
-- ============================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON COLUMN public.profiles.lingkungan_slug IS E'Kode identifikasi lingkungan (e.g., AR, FA, MRR) untuk dynamic role buttons\ne.g., ketua_lingkungan with slug AR means KL for Lingkungan St. Andreas';