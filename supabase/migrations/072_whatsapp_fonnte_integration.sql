-- WhatsApp Integration via Fonnte
-- Purpose: OTP login and SOS notifications
-- Date: 21 June 2026

-- Table auth_otps
CREATE TABLE IF NOT EXISTS public.auth_otps (
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (phone, otp_code)
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_phone ON auth_otps(phone);
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires ON auth_otps(expires_at);

-- Update sos_abuse_tracker if needed
ALTER TABLE IF EXISTS public.sos_abuse_tracker ADD COLUMN IF NOT EXISTS trigger_count INTEGER DEFAULT 0;

-- RLS for auth_otps
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- Service role can manage OTPs
CREATE POLICY auth_otps_service_role ON public.auth_otps
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

-- Also allow service role key (bypasses RLS via has_role)
CREATE POLICY auth_otps_service_role_key ON public.auth_otps
    FOR ALL TO service_role USING (true);

-- Cleanup expired OTPs periodically (optional manual cleanup or cron)
-- CREATE OR REPLACE FUNCTION cleanup_expired_otps() 
-- RETURNS void AS $$
-- BEGIN
--     DELETE FROM public.auth_otps WHERE expires_at < NOW();
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;