-- Audit Logs Table for compliance and tracking
-- Created: 26 June 2026
-- Purpose: Track all admin actions for accountability and audit trail

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_name TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  admin_access_layer INTEGER NOT NULL,
  
  -- What action was performed
  action TEXT NOT NULL, -- 'register_umat'|'ocr_scan'|'bulk_import'|'document_generate'|'document_revoke'|'user_activate'|'user_suspend'
  action_description TEXT,
  
  -- Target of the action
  target_type TEXT, -- 'user'|'document'|'family'|'sacrament'
  target_id UUID,
  target_name TEXT,
  
  -- Additional context
  metadata JSONB, -- { document_type: 'KTP', method: 'ocr', ip_address: '...', ... }
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if not exists
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS admin_name TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS admin_role TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS admin_access_layer INTEGER;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action_description TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_name TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin can see all logs
CREATE POLICY "Super admin can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    (SELECT access_layer FROM profiles WHERE id = auth.uid()) >= 10
  );

-- Admin can view their own logs
CREATE POLICY "Admin can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    admin_id = auth.uid()
    OR (SELECT access_layer FROM profiles WHERE id = auth.uid()) >= 10
  );

-- System can insert logs (via service role)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes (immutable)
CREATE POLICY "No updates on audit logs"
  ON public.audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "No deletes on audit logs"
  ON public.audit_logs FOR DELETE
  USING (false);

-- Function to automatically log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_admin_name TEXT,
  p_admin_role TEXT,
  p_admin_access_layer INTEGER,
  p_action TEXT,
  p_action_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    admin_id, admin_name, admin_role, admin_access_layer,
    action, action_description,
    target_type, target_id, target_name,
    metadata, ip_address, user_agent
  ) VALUES (
    p_admin_id, p_admin_name, p_admin_role, p_admin_access_layer,
    p_action, p_action_description,
    p_target_type, p_target_id, p_target_name,
    p_metadata, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_admin_action TO service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_action TO anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;
