-- Role Assignment & Bypass System for Super Admin

-- 1. Add assigned_role columns to umat_staging
ALTER TABLE public.umat_staging 
ADD COLUMN IF NOT EXISTS assigned_role text,
ADD COLUMN IF NOT EXISTS assigned_access_layer integer,
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

-- 2. Create pre_registered_roles table
CREATE TABLE IF NOT EXISTS public.pre_registered_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL,
  access_layer integer NOT NULL,
  is_active boolean DEFAULT true,
  assigned_by uuid NOT NULL REFERENCES public.profiles(id),
  used_by uuid REFERENCES public.profiles(id),
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create system_bypass_logs table
CREATE TABLE IF NOT EXISTS public.system_bypass_logs (
  bypass_type text NOT NULL,
  target_identifier text NOT NULL,
  action text NOT NULL,
  performed_by uuid NOT NULL REFERENCES public.profiles(id),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.pre_registered_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_bypass_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for pre_registered_roles
CREATE POLICY Super_Admins_can_manage_pre_registered_roles ON public.pre_registered_roles FOR ALL USING ((select auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'access_layer'::text = '9') WITH CHECK ((select auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'access_layer'::text = '9');

CREATE POLICY Users_can_view_own_pre_registered_role ON public.pre_registered_roles FOR SELECT USING (phone_number = (select auth.jwt() ->> 'phone'::text) AND is_active = true);

-- 6. RLS Policies for system_bypass_logs
CREATE POLICY Super_Admins_can_view_all_bypass_logs ON public.system_bypass_logs FOR SELECT USING ((select auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'access_layer'::text = '9');

CREATE POLICY Service_role_can_insert_bypass_logs ON public.system_bypass_logs FOR INSERT WITH CHECK (true);

-- 7. Update umat_staging RLS
DROP POLICY IF EXISTS Super_Admins_can_manage_umat_staging ON public.umat_staging;

CREATE POLICY Super_Admins_can_manage_umat_staging ON public.umat_staging FOR ALL USING ((select auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'access_layer'::text = '9') WITH CHECK ((select auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'access_layer'::text = '9');

-- 11. Seed super_admin in umat_staging for ANTHANOSIUS KOEN BROTO DRIYATMO
UPDATE umat_staging 
SET 
  assigned_role = 'super_admin',
  assigned_access_layer = 10,
  assigned_at = NOW()
WHERE id = '63cfb61f-bac2-4093-be8d-49f856611352';

-- 12. Insert super admin credentials (password: god25)
-- Stored as bcrypt hash for security
INSERT INTO public.super_admin_credentials (password_hash, created_at)
VALUES ('$2b$10$qGzBa.LIevJJLPq40jcUD.rxDCaHrwphvfn4Z.K3D5h8qZLn2difG', NOW())
ON CONFLICT DO NOTHING;
