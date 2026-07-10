-- Migration 037: SOS Abuse Tracker — Anti-Penyalahgunaan 4 Level
-- Ref: GDD v4.0 BAB III §3.3a — Anti-Abuse SOS

CREATE TABLE IF NOT EXISTS public.sos_abuse_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Riwayat 30 hari terakhir
    trigger_count_30d INTEGER DEFAULT 0,
    last_trigger_at TIMESTAMPTZ,
    
    -- Status akun
    restriction_level INTEGER DEFAULT 0 CHECK (restriction_level BETWEEN 0 AND 3),
    restriction_until TIMESTAMPTZ,
    restriction_reason TEXT,
    
    -- Abuse flags (dihitung oleh cron malam)
    flags JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_abuse_user ON public.sos_abuse_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_abuse_restriction ON public.sos_abuse_tracker(restriction_level);

ALTER TABLE public.sos_abuse_tracker ENABLE ROW LEVEL SECURITY;

-- Policy: Service role manage
CREATE POLICY "Service role can manage sos_abuse" ON public.sos_abuse_tracker
    FOR ALL USING (true) WITH CHECK (true);

-- Policy: User bisa lihat tracker sendiri
CREATE POLICY "Users can view own sos_abuse" ON public.sos_abuse_tracker
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Operator ICT dan super_admin bisa lihat semua
CREATE POLICY "Admins can view all sos_abuse" ON public.sos_abuse_tracker
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('operator_ict', 'super_admin')
        )
    );

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_sos_abuse_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sos_abuse_updated_at BEFORE UPDATE ON public.sos_abuse_tracker
    FOR EACH ROW EXECUTE FUNCTION update_sos_abuse_updated_at();