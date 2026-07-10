-- Migration 051: API Key Management System
-- Purpose: Manage OpenRouter & Gemini API keys for AI provider integration
-- Created: 2026-06-17

-- ============================================
-- 1. USER API KEYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openrouter', 'gemini', 'openai')),
    api_key_encrypted TEXT NOT NULL,
    key_name VARCHAR(100) DEFAULT 'My API Key',
    is_active BOOLEAN DEFAULT TRUE,
    last_validated_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON public.user_api_keys(provider);

-- RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
    ON public.user_api_keys FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. ADMIN API KEY POOL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_api_key_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openrouter', 'gemini', 'openai')),
    api_key_encrypted TEXT NOT NULL,
    key_name VARCHAR(100) DEFAULT 'Pool Key',
    assigned_to_bot VARCHAR(50), -- 'bot_public', 'bot_companion', 'bot_administrative', null=all
    rotation_strategy VARCHAR(50) DEFAULT 'round_robin' 
        CHECK (rotation_strategy IN ('round_robin', 'least_used', 'random', 'priority')),
    priority_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_exhausted BOOLEAN DEFAULT FALSE,
    last_error TEXT,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_api_key_pool_provider ON public.admin_api_key_pool(provider);
CREATE INDEX IF NOT EXISTS idx_admin_api_key_pool_assigned_bot ON public.admin_api_key_pool(assigned_to_bot);
CREATE INDEX IF NOT EXISTS idx_admin_api_key_pool_active ON public.admin_api_key_pool(is_active, is_exhausted);

-- RLS
ALTER TABLE public.admin_api_key_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage API key pool"
    ON public.admin_api_key_pool FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'operator_ict')
        )
    );

-- ============================================
-- 3. API USAGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    bot_mode VARCHAR(50),
    provider VARCHAR(50) NOT NULL,
    api_key_id UUID REFERENCES public.admin_api_key_pool(id) ON DELETE SET NULL,
    user_api_key_id UUID REFERENCES public.user_api_keys(id) ON DELETE SET NULL,
    request_type VARCHAR(50), -- 'chat', 'retrieval', 'embedding'
    tokens_used INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON public.api_usage_logs(provider);

-- RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
    ON public.api_usage_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
    ON public.api_usage_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND access_layer >= 5
        )
    );

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to get next API key for a bot (round-robin strategy)
CREATE OR REPLACE FUNCTION public.get_next_api_key(
    p_provider VARCHAR(50),
    p_bot_mode VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_key_id UUID;
BEGIN
    -- Get the least used active key for the provider
    SELECT id INTO v_key_id
    FROM public.admin_api_key_pool
    WHERE provider = p_provider
      AND is_active = TRUE
      AND is_exhausted = FALSE
      AND (assigned_to_bot = p_bot_mode OR assigned_to_bot IS NULL)
    ORDER BY usage_count ASC, last_used_at ASC NULLS LAST
    LIMIT 1;
    
    RETURN v_key_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update API key usage
CREATE OR REPLACE FUNCTION public.update_api_key_usage(
    p_key_id UUID,
    p_success BOOLEAN DEFAULT TRUE,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF p_success THEN
        UPDATE public.admin_api_key_pool
        SET 
            usage_count = usage_count + 1,
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE id = p_key_id;
    ELSE
        -- Mark as exhausted if too many errors
        UPDATE public.admin_api_key_pool
        SET 
            is_exhausted = TRUE,
            last_error = p_error,
            updated_at = NOW()
        WHERE id = p_key_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get API key pool statistics
CREATE OR REPLACE FUNCTION public.get_api_key_stats()
RETURNS TABLE (
    provider VARCHAR(50),
    total_keys INTEGER,
    active_keys INTEGER,
    exhausted_keys INTEGER,
    total_usage BIGINT,
    avg_usage_per_key NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        akp.provider,
        COUNT(*)::INTEGER as total_keys,
        COUNT(CASE WHEN akp.is_active = TRUE AND akp.is_exhausted = FALSE THEN 1 END)::INTEGER as active_keys,
        COUNT(CASE WHEN akp.is_exhausted = TRUE THEN 1 END)::INTEGER as exhausted_keys,
        COALESCE(SUM(akp.usage_count), 0)::BIGINT as total_usage,
        COALESCE(AVG(akp.usage_count), 0)::NUMERIC as avg_usage_per_key
    FROM public.admin_api_key_pool akp
    GROUP BY akp.provider
    ORDER BY akp.provider;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. GRANTS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_api_key_pool TO authenticated;
GRANT SELECT ON public.api_usage_logs TO authenticated;

-- Grant access to service_role for backend operations
GRANT ALL ON public.user_api_keys TO service_role;
GRANT ALL ON public.admin_api_key_pool TO service_role;
GRANT ALL ON public.api_usage_logs TO service_role;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE public.user_api_keys IS 'User-provided API keys for LLM providers (OpenRouter, Gemini, etc.)';
COMMENT ON TABLE public.admin_api_key_pool IS 'Admin-managed pool of API keys for shared bot usage';
COMMENT ON TABLE public.api_usage_logs IS 'Log of all API key usage for monitoring and billing';