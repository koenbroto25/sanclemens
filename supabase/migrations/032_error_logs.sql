-- Migration 032: Error Check Engine — Error Logs
-- Ref: GDD v4.0 BAB XVIII-B — Error Check Engine 3 Lapisan

CREATE TABLE IF NOT EXISTS public.error_logs (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(is_resolved);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role dan admin bisa manage
CREATE POLICY "Service role can manage error_logs" ON public.error_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Policy: Operator ICT bisa read
CREATE POLICY "Operator ICT can read error_logs" ON public.error_logs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('operator_ict', 'super_admin')
        )
    );