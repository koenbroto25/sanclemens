-- Migration: AI Schema - Support Tables (Prompts, Logs, Cache)
-- Created: 19 June 2026
-- Purpose: AI prompt management, abuse logging, and liturgical calendar caching

-- Table: public.ai_prompts (Extended from v4)
CREATE TABLE IF NOT EXISTS public.ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_code TEXT NOT NULL,             -- 'bot_public_info', 'bot_companion', etc
    prompt_name TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT FALSE,
    is_ab_test BOOLEAN DEFAULT FALSE,
    ab_test_percentage INTEGER DEFAULT 0 CHECK (ab_test_percentage BETWEEN 0 AND 100),
    change_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    performance_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_bot ON public.ai_prompts(bot_code, is_active, is_ab_test);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_version ON public.ai_prompts(bot_code, version);

-- Table: public.ai_abuse_logs
CREATE TABLE IF NOT EXISTS public.ai_abuse_logs (
    id BIGSERIAL PRIMARY KEY,
    bot_type TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    original_input TEXT NOT NULL,
    filter_action TEXT NOT NULL CHECK (filter_action IN ('block','sanitize','pass','emergency')),
    filter_reason TEXT,
    response_given TEXT,
    emergency_sos BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_abuse_logs_user_id ON public.ai_abuse_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_abuse_logs_created_at ON public.ai_abuse_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_abuse_logs_bot_type ON public.ai_abuse_logs(bot_type, created_at);

-- Table: public.liturgical_calendar_cache
CREATE TABLE IF NOT EXISTS public.liturgical_calendar_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    season TEXT NOT NULL,
    season_week INTEGER,
    day_name TEXT NOT NULL,
    liturgical_rank TEXT NOT NULL CHECK (liturgical_rank IN ('hari_raya_wajib','pesta','peringatan_wajib','peringatan_pilihan','hari_biasa')),
    color TEXT NOT NULL CHECK (color IN ('putih','merah','ungu','hijau','merah_muda','hitam')),
    readings_first TEXT,
    readings_psalm TEXT,
    readings_second TEXT,
    readings_gospel TEXT,
    readings_summary TEXT,
    special_notes TEXT,
    source_url TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liturgical_date ON public.liturgical_calendar_cache(date);
CREATE INDEX IF NOT EXISTS idx_liturgical_season ON public.liturgical_calendar_cache(season, season_week);

-- RLS Policies
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_abuse_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liturgical_calendar_cache ENABLE ROW LEVEL SECURITY;

-- AI Prompts: public read active prompts, admin manage all
CREATE POLICY ai_prompts_read_active ON public.ai_prompts
    FOR SELECT TO authenticated USING (is_active = TRUE OR is_ab_test = TRUE);

CREATE POLICY ai_prompts_read_all_admin ON public.ai_prompts
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

CREATE POLICY ai_prompts_write_admin ON public.ai_prompts
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 7)
    );

-- AI Abuse Logs: users can read own, admin can read all
CREATE POLICY ai_abuse_read_own ON public.ai_abuse_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY ai_abuse_read_admin ON public.ai_abuse_logs
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

CREATE POLICY ai_abuse_insert_system ON public.ai_abuse_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Liturgical Calendar: public read, admin write
CREATE POLICY liturgical_read_all ON public.liturgical_calendar_cache
    FOR SELECT TO authenticated USING (true);

CREATE POLICY liturgical_write_admin ON public.liturgical_calendar_cache
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

-- Public read for liturgical cache (no auth required for public access)
CREATE POLICY liturgical_read_public ON public.liturgical_calendar_cache
    FOR SELECT TO public USING (true);

-- Comments
COMMENT ON TABLE public.ai_prompts IS 'AI system prompts with versioning and A/B testing support';
COMMENT ON TABLE public.ai_abuse_logs IS 'Logs for AI input filter abuse detection and emergency flags';
COMMENT ON TABLE public.liturgical_calendar_cache IS 'Daily liturgical calendar cache for AI context injection';