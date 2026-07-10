-- Migration 033: Cron Heartbeat — Dead Man's Switch
-- Ref: GDD v4.0 BAB XVIII, Sub-Fase 1.10 — Dead Man's Switch

CREATE TABLE IF NOT EXISTS public.cron_heartbeat (
    id BIGSERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_interval_minutes INTEGER NOT NULL DEFAULT 60,
    status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'missed', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk monitoring
CREATE INDEX IF NOT EXISTS idx_cron_heartbeat_job ON public.cron_heartbeat(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_heartbeat_status ON public.cron_heartbeat(status);

-- Insert default jobs
INSERT INTO public.cron_heartbeat (job_name, expected_interval_minutes) VALUES
    ('error-digest', 1440),       -- 1x sehari
    ('sos-abuse-check', 1440),    -- 1x sehari (malam)
    ('rotate-qr', 1440),          -- 1x sehari
    ('morning-check', 1440)       -- 1x sehari
ON CONFLICT DO NOTHING;

ALTER TABLE public.cron_heartbeat ENABLE ROW LEVEL SECURITY;

-- Policy: Service role manage
CREATE POLICY "Service role can manage cron_heartbeat" ON public.cron_heartbeat
    FOR ALL USING (true) WITH CHECK (true);

-- Policy: Operator ICT bisa read
CREATE POLICY "Operator ICT can read cron_heartbeat" ON public.cron_heartbeat
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('operator_ict', 'super_admin')
        )
    );