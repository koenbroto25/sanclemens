-- Migration: AI Schema - Helper Functions
-- Created: 19 June 2026
-- Purpose: AI context builders and helper functions

-- Function: Build AI Request Context
CREATE OR REPLACE FUNCTION public.get_ai_request_context(
    p_user_id UUID,
    p_current_path TEXT DEFAULT '/'
)
RETURNS JSONB AS $$
DECLARE
    context JSONB;
    profile RECORD;
    ai_profile RECORD;
    family RECORD;
BEGIN
    -- Get base profile
    SELECT * INTO profile FROM public.profiles WHERE id = p_user_id;
    
    -- Get AI profile
    SELECT * INTO ai_profile FROM public.ai_user_profiles WHERE user_id = p_user_id;
    
    -- Get family (if any)
    SELECT * INTO family FROM public.families 
    WHERE id = profile.family_id LIMIT 1;

    context := jsonb_build_object(
        'user_id', p_user_id,
        'user_layer', profile.access_layer,
        'homepage_context', CASE 
            WHEN p_current_path LIKE '/marketplace%' THEN 'marketplace'
            WHEN profile.lingkungan_id IS NOT NULL THEN 'lingkungan'
            ELSE 'paroki'
        END,
        'lingkungan_id', profile.lingkungan_id,
        'user_name', COALESCE(ai_profile.preferred_name, profile.full_name),
        'lingkungan_name', (SELECT name FROM public.lingkungan WHERE id = profile.lingkungan_id),
        'account_age_days', COALESCE(ai_profile.account_age_days, 0),
        'last_active_days_ago', COALESCE(EXTRACT(DAY FROM NOW() - ai_profile.last_bot_interaction)::INTEGER, 9999),
        'visited_portals', COALESCE(ai_profile.visited_portals, '{}'),
        'emotional_signal_last_session', COALESCE(ai_profile.emotional_signal_last_session, 'neutral'),
        'companion_memory_enabled', COALESCE(ai_profile.companion_memory_enabled, FALSE),
        'matching_consent', COALESCE(ai_profile.matching_consent, FALSE),
        'family_name', COALESCE(family.name, 'Tidak terdaftar'),
        'family_role', 'single'
    );

    RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: GAKIN Priority Check
CREATE OR REPLACE FUNCTION public.check_gakin_priority(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    family_id UUID;
    gakin_status TEXT;
    result JSONB;
BEGIN
    -- Get user's family
    SELECT family_id INTO family_id FROM public.profiles WHERE id = p_user_id;

    IF family_id IS NULL THEN
        RETURN jsonb_build_object('is_gakin', FALSE, 'priority_tier', 'standard');
    END IF;

    -- Check GAKIN status
    SELECT status INTO gakin_status FROM public.data_gakin 
    WHERE family_id = family_id AND status IN ('active', 'pending')
    LIMIT 1;

    IF gakin_status IS NULL THEN
        RETURN jsonb_build_object('is_gakin', FALSE, 'priority_tier', 'standard');
    ELSIF gakin_status = 'active' THEN
        RETURN jsonb_build_object('is_gakin', TRUE, 'priority_tier', 'critical');
    ELSE
        RETURN jsonb_build_object('is_gakin', TRUE, 'priority_tier', 'elevated');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update AI User Profile after interaction
CREATE OR REPLACE FUNCTION public.update_ai_interaction(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.ai_user_profiles
    SET 
        last_bot_interaction = NOW(),
        total_sessions = total_sessions + 1
    WHERE user_id = p_user_id;

    -- If not exists, create initial profile
    IF NOT FOUND THEN
        INSERT INTO public.ai_user_profiles (user_id)
        VALUES (p_user_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate Match Score (for matching engine)
CREATE OR REPLACE FUNCTION public.calculate_job_match_score(
    p_worker_id UUID,
    p_job_id UUID
)
RETURNS DECIMAL(4,3) AS $$
DECLARE
    worker RECORD;
    job RECORD;
    score DECIMAL(4,3) := 0.0;
    skill_matches INTEGER;
BEGIN
    -- Get worker profile
    SELECT * INTO worker FROM public.tenaga_kerja WHERE id = p_worker_id;
    
    -- Get job details
    SELECT * INTO job FROM public.lowongan_kerja WHERE id = p_job_id;

    IF worker IS NULL OR job IS NULL THEN
        RETURN 0.0;
    END IF;

    -- Skills match (30%)
    SELECT COUNT(*) INTO skill_matches
    FROM unnest(worker.keahlian) w_skill
    WHERE w_skill = ANY(job.tags);
    
    score := score + (skill_matches::DECIMAL / GREATEST(1, array_length(job.tags, 1)) * 0.3);

    -- Location match (30%) - simplified version
    IF job.lingkungan_id IS NOT NULL THEN
        -- Check if worker is in same lingkungan
        IF EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = worker.user_id 
            AND p.lingkungan_id = job.lingkungan_id
        ) THEN
            score := score + 0.3;
        ELSE
            score := score + 0.05;
        END IF;
    ELSE
        score := score + 0.15;
    END IF;

    -- Urgency (20%)
    IF job.is_verified THEN
        score := score + 0.15;
    ELSE
        score := score + 0.10;
    END IF;

    -- Availability (20%)
    IF worker.tersedia THEN
        score := score + 0.20;
    END IF;

    RETURN LEAST(score, 1.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get Liturgical Context for AI
CREATE OR REPLACE FUNCTION public.get_liturgical_context(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    liturgical RECORD;
BEGIN
    SELECT * INTO liturgical 
    FROM public.liturgical_calendar_cache 
    WHERE date = p_date
    LIMIT 1;

    IF liturgical IS NULL THEN
        -- Return default context if not cached
        RETURN jsonb_build_object(
            'date', p_date,
            'season', 'Biasa',
            'day_name', 'Hari Biasa',
            'liturgical_rank', 'hari_biasa',
            'color', 'hijau'
        );
    END IF;

    RETURN jsonb_build_object(
        'date', liturgical.date,
        'season', liturgical.season,
        'season_week', liturgical.season_week,
        'day_name', liturgical.day_name,
        'liturgical_rank', liturgical.liturgical_rank,
        'color', liturgical.color,
        'readings_summary', liturgical.readings_summary,
        'special_notes', liturgical.special_notes
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Log AI Abuse
CREATE OR REPLACE FUNCTION public.log_ai_abuse(
    p_bot_type TEXT,
    p_user_id UUID,
    p_original_input TEXT,
    p_filter_action TEXT,
    p_filter_reason TEXT DEFAULT NULL,
    p_response_given TEXT DEFAULT NULL,
    p_emergency_sos BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ai_abuse_logs (
        bot_type, user_id, original_input, filter_action,
        filter_reason, response_given, emergency_sos
    ) VALUES (
        p_bot_type, p_user_id, p_original_input, p_filter_action,
        p_filter_reason, p_response_given, p_emergency_sos
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_ai_request_context(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_gakin_priority(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ai_interaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_job_match_score(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_liturgical_context(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_ai_abuse(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Comments
COMMENT ON FUNCTION public.get_ai_request_context IS 'Build comprehensive AI request context from user profile and system data';
COMMENT ON FUNCTION public.check_gakin_priority IS 'Check if user has GAKIN status and determine priority tier';
COMMENT ON FUNCTION public.update_ai_interaction IS 'Update AI interaction tracking after bot usage';
COMMENT ON FUNCTION public.calculate_job_match_score IS 'Calculate AI match score between worker and job posting';
COMMENT ON FUNCTION public.get_liturgical_context IS 'Get liturgical calendar context for AI prompt injection';
COMMENT ON FUNCTION public.log_ai_abuse IS 'Log AI input filter actions for abuse detection and monitoring';