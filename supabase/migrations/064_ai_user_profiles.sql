-- Migration: AI Schema - User Profiles & Intent Tracking
-- Created: 19 June 2026
-- Purpose: AI-specific user profiles for personalization and intent detection

-- Table: public.ai_user_profiles
CREATE TABLE IF NOT EXISTS public.ai_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    
    -- IDENTITAS DASAR (dari onboarding)
    preferred_name TEXT,
    preferred_language TEXT DEFAULT 'id',
    preferred_address TEXT DEFAULT 'netral',
    
    -- KONTEKS KEUMATAN
    baptis_status TEXT DEFAULT 'tidak_diketahui' CHECK (baptis_status IN ('sudah','belum','tidak_diketahui')),
    krisma_status TEXT DEFAULT 'tidak_diketahui' CHECK (krisma_status IN ('sudah','belum','tidak_diketahui')),
    status_perkawinan TEXT DEFAULT 'tidak_diketahui' CHECK (status_perkawinan IN ('lajang','menikah_katolik','menikah_sipil','janda_duda','tidak_diketahui')),
    
    -- PREFERENSI KOMUNIKASI AI
    bot_verbosity TEXT DEFAULT 'normal' CHECK (bot_verbosity IN ('ringkas','normal','detail')),
    
    -- RIWAYAT INTERAKSI
    account_age_days INTEGER,
    last_bot_interaction TIMESTAMPTZ,
    last_active_portal TEXT,
    total_sessions INTEGER DEFAULT 0,
    visited_portals TEXT[] DEFAULT '{}',
    
    -- DETEKSI KONDISI EMOSIONAL
    emotional_signal_last_session TEXT DEFAULT 'neutral',
    emotional_signal_updated_at TIMESTAMPTZ,
    
    -- PREFERENSI COMPANION (BOT 3)
    companion_memory_enabled BOOLEAN DEFAULT FALSE,
    companion_setup_complete BOOLEAN DEFAULT FALSE,
    
    -- PREFERENSI MATCHING (BOT 7)
    matching_consent BOOLEAN DEFAULT FALSE,
    
    -- METADATA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_user ON public.ai_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_last_interaction ON public.ai_user_profiles(last_bot_interaction);

-- Extend profiles table with AI-related columns
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    ai_companion_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    ai_matching_consent BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    preferred_name TEXT;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    preferred_address TEXT DEFAULT 'netral';

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    bot_verbosity TEXT DEFAULT 'normal';

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    last_active_portal TEXT;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    last_bot_interaction TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    emotional_signal_last_session TEXT DEFAULT 'neutral';

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    emotional_signal_updated_at TIMESTAMPTZ;

-- RLS Policies
ALTER TABLE public.ai_user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update own AI profile
CREATE POLICY ai_profile_read_own ON public.ai_user_profiles
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY ai_profile_update_own ON public.ai_user_profiles
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Service role can insert (for new users)
CREATE POLICY ai_profile_insert_auth ON public.ai_user_profiles
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT ON TABLE public.ai_user_profiles IS 'AI-specific user profiles for bot personalization and context';