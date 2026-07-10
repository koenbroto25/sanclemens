-- Migration 053: User Settings System
-- Purpose: Comprehensive user settings including notifications, AI preferences, etc.
-- Created: 2026-06-18

-- ============================================
-- 1. USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Notification preferences (JSONB for flexibility)
    notification_settings JSONB NOT NULL DEFAULT '{
        "channels": {
            "whatsapp": true,
            "in_app": true,
            "email": false
        },
        "quiet_hours": {
            "start": "21:00",
            "end": "06:00",
            "override_sos": true
        },
        "categories": {
            "emergency": {"whatsapp": true, "in_app": true, "mandatory": true},
            "sacraments": {"whatsapp": true, "in_app": true, "mandatory": true},
            "finance": {"whatsapp": true, "in_app": true, "mandatory": true},
            "account": {"whatsapp": true, "in_app": true, "mandatory": true},
            "parish_info": {"whatsapp": false, "in_app": true},
            "activities": {"whatsapp": false, "in_app": true},
            "marketplace": {"whatsapp": false, "in_app": true},
            "ai_companion": {"whatsapp": true, "in_app": true},
            "daily_prayer": {"whatsapp": true, "in_app": false}
        }
    }'::jsonb,
    
    -- Privacy preferences
    privacy_settings JSONB NOT NULL DEFAULT '{
        "ai_remember_preferences": true,
        "ai_matching_consent": false,
        "allow_partner_notifications": false,
        "show_in_lingkungan_directory": true
    }'::jsonb,
    
    -- AI Communication preferences
    ai_preferences JSONB NOT NULL DEFAULT '{
        "preferred_address": "bapak",
        "bot_verbosity": "normal",
        "preferred_language": "id"
    }'::jsonb,
    
    -- Session preferences
    session_timeout_minutes INTEGER DEFAULT 30,
    default_notification_channel VARCHAR(20) DEFAULT 'whatsapp'
        CHECK (default_notification_channel IN ('whatsapp', 'in_app', 'email')),
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. PHONE CHANGE LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.phone_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_phone VARCHAR(20) NOT NULL,
    new_phone VARCHAR(20) NOT NULL,
    verified_old_otp BOOLEAN DEFAULT FALSE,
    verified_new_otp BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'verified_old', 'verified_new', 'completed', 'cancelled')),
    otp_old VARCHAR(6),
    otp_new VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phone_change_logs_user_id ON public.phone_change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_change_logs_status ON public.phone_change_logs(status);

-- RLS
ALTER TABLE public.phone_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own phone changes"
    ON public.phone_change_logs FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. AUTO-CREATE SETTINGS ON USER REGISTRATION
-- ============================================
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create settings for new users
DROP TRIGGER IF EXISTS trg_create_user_settings ON public.profiles;
CREATE TRIGGER trg_create_user_settings
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_settings();

-- ============================================
-- 4. GRANTS
-- ============================================
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
GRANT ALL ON public.phone_change_logs TO authenticated;
GRANT ALL ON public.phone_change_logs TO service_role;

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON TABLE public.user_settings IS 'Comprehensive user settings: notifications, privacy, AI preferences, etc.';
COMMENT ON TABLE public.phone_change_logs IS 'Audit trail for WhatsApp number changes';