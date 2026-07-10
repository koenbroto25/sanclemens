-- Migration: AI Schema - Companion E2E Encrypted Chat
-- Created: 19 June 2026
-- Purpose: End-to-end encrypted chat for Bot 3 Companion Rohani

-- Create companion schema
CREATE SCHEMA IF NOT EXISTS companion;

-- Table: companion.chat_sessions (encrypted messages)
CREATE TABLE IF NOT EXISTS companion.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode_sequence TEXT[] DEFAULT '{}',
    message_count INTEGER DEFAULT 0,
    messages_encrypted BYTEA NOT NULL,
    iv TEXT NOT NULL,
    has_emergency_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_sessions_user ON companion.chat_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_companion_sessions_emergency ON companion.chat_sessions(has_emergency_flag) WHERE has_emergency_flag = TRUE;

-- Table: companion.spiritual_memory (encrypted E2E)
CREATE TABLE IF NOT EXISTS companion.spiritual_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    memory_encrypted BYTEA NOT NULL,
    iv TEXT NOT NULL,
    last_updated_session_id UUID REFERENCES companion.chat_sessions(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_memory_user ON companion.spiritual_memory(user_id);

-- Table: companion.emergency_logs (non-E2E — untuk pastoral monitoring)
CREATE TABLE IF NOT EXISTS companion.emergency_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES companion.chat_sessions(id) ON DELETE SET NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    keyword_triggered TEXT NOT NULL,
    pastor_notified BOOLEAN DEFAULT FALSE,
    pastor_notified_at TIMESTAMPTZ,
    pastoral_followup_status TEXT DEFAULT 'pending' CHECK (pastoral_followup_status IN ('pending','contacted','resolved','declined'))
);

CREATE INDEX IF NOT EXISTS idx_companion_emergency_user ON companion.emergency_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_emergency_pastor ON companion.emergency_logs(pastor_notified, pastoral_followup_status);

-- RLS Policies
ALTER TABLE companion.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion.spiritual_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion.emergency_logs ENABLE ROW LEVEL SECURITY;

-- Chat sessions: users can only access own sessions
CREATE POLICY companion_chat_read_own ON companion.chat_sessions
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY companion_chat_write_own ON companion.chat_sessions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Spiritual memory: users can only access own memory
CREATE POLICY companion_memory_read_own ON companion.spiritual_memory
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY companion_memory_write_own ON companion.spiritual_memory
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- Emergency logs: users can read own, pastors can read for their lingkungan
CREATE POLICY emergency_logs_read_own ON companion.emergency_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY emergency_logs_write_own ON companion.emergency_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Pastor can read emergency logs for their lingkungan
CREATE POLICY emergency_logs_read_pastor ON companion.emergency_logs
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.access_layer >= 9
        )
    );

-- Pastor can update followup status
CREATE POLICY emergency_logs_update_pastor ON companion.emergency_logs
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.access_layer >= 9
        )
    );

-- Comments
COMMENT ON SCHEMA companion IS 'End-to-end encrypted chat for Bot 3 Companion Rohani - spiritual journey tracking';
COMMENT ON TABLE companion.chat_sessions IS 'Encrypted chat sessions - server cannot decrypt contents';
COMMENT ON TABLE companion.spiritual_memory IS 'Encrypted spiritual memory (E2E) - user-controlled encryption key';
COMMENT ON TABLE companion.emergency_logs IS 'Emergency detection logs (non-E2E) for pastoral follow-up';