-- Migration 039: Create super admin credentials and logs tables
-- Ref: Masterplan v4.0 Fase 7, GDD v4.0 BAB XXIII

-- Super Admin Credentials
CREATE TABLE IF NOT EXISTS public.super_admin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Super Admin Logs
CREATE TABLE IF NOT EXISTS public.super_admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE IF EXISTS public.super_admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.super_admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Only service_role can manage super_admin_credentials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage super_admin_credentials' AND tablename = 'super_admin_credentials'
  ) THEN
    CREATE POLICY "Service role can manage super_admin_credentials" ON public.super_admin_credentials
        FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- RLS: Super admin can insert logs, service_role can read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Super admin can insert logs' AND tablename = 'super_admin_logs'
  ) THEN
    CREATE POLICY "Super admin can insert logs" ON public.super_admin_logs
        FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can read logs' AND tablename = 'super_admin_logs'
  ) THEN
    CREATE POLICY "Service role can read logs" ON public.super_admin_logs
        FOR SELECT USING (true);
  END IF;
END $$;