-- Migration 045: Create notification and WhatsApp log tables
CREATE TABLE public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'admin_approval', 'error', 'info'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed'
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);