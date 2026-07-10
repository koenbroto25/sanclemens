-- Migration 030: Health Check Table
-- Ref: GDD v4.0 BAB XVIII, Sub-Fase 0.4 & 1.10
-- Untuk Dual Ping Guard — tabel dummy agar UptimeRobot & Cron-job.org bisa ping

CREATE TABLE IF NOT EXISTS public.health_check (
    id BIGSERIAL PRIMARY KEY,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'uptimerobot',
    status TEXT DEFAULT 'ok'
);

-- Insert baris pertama sebagai marker
INSERT INTO public.health_check (source, status) VALUES ('setup', 'ok');

-- Index untuk pembersihan data lama
CREATE INDEX IF NOT EXISTS idx_health_check_checked_at ON public.health_check(checked_at DESC);

ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa read (untuk health check publik)
CREATE POLICY "Anyone can read health_check" ON public.health_check
    FOR SELECT USING (true);

-- Policy: Hanya service_role bisa insert
CREATE POLICY "Service role can insert health_check" ON public.health_check
    FOR INSERT WITH CHECK (true);