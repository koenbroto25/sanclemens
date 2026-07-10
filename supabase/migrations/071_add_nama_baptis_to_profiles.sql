-- Migration 071: Add nama_baptis column to profiles
-- Purpose: Store user's baptismal name for personalized patron saint notifications and greetings
-- Ref: v5/ai_implementation_plan.md & docs/ai_specifications/28_prayers_and_liturgy.md

-- ============================================
-- 1. ADD new column for baptismal name
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS nama_baptis TEXT;

COMMENT ON COLUMN public.profiles.nama_baptis IS 
  'Nama baptis pengguna untuk notifikasi hari perayaan santo pelindung dan ucapan personal';

-- ============================================
-- 2. CREATE INDEX for query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_nama_baptis 
  ON public.profiles(nama_baptis);

-- ============================================
-- 3. GRANTS
-- ============================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;