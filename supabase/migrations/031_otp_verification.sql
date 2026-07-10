-- Migration 031: WhatsApp OTP Verification
-- Ref: GDD v4.0 BAB VI §6.2 — WhatsApp OTP menggantikan email OTP

CREATE TABLE IF NOT EXISTS public.otp_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verification(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verification(expires_at);

ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

-- Policy: Hanya service_role yang bisa akses (OTP diurus backend)
CREATE POLICY "Service role can manage otp" ON public.otp_verification
    FOR ALL USING (true) WITH CHECK (true);