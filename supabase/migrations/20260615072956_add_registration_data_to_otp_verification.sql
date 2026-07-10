-- Migration: Add registration_data JSONB column to otp_verification
-- Ref: GDD v4.0 BAB VI §6.2-6.3, Masterplan v4.0 (UPDATE IMPLEMENTASI)

-- Up Migration
ALTER TABLE public.otp_verification
ADD COLUMN registration_data JSONB;

-- Down Migration
ALTER TABLE public.otp_verification
DROP COLUMN registration_data;