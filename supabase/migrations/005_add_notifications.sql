-- Migration 005: Notifications, Activity & Audit Logs
-- Ref: GDD Bab XIII "Real-Time & Notifikasi", Bab IV.2

-- ============================================
-- 1. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    judul TEXT NOT NULL,
    pesan TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK (tipe IN ('info','warning','critical','pastoral_sos')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ACTIVITY LOGS
-- ============================================
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    aksi TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    detail JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. AUDIT LOGS (Financial)
-- ============================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaksi_id UUID REFERENCES public.financial_transactions(id),
    aksi TEXT NOT NULL,
    actor_id UUID REFERENCES public.profiles(id),
    detail JSONB,
    anomali_flag TEXT CHECK (anomali_flag IN ('kritis','sedang','peringatan')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PASTORAL SOS
-- ============================================
CREATE TABLE public.pastoral_sos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by UUID NOT NULL REFERENCES public.profiles(id),
    sos_type TEXT NOT NULL CHECK (sos_type IN (
        'pengurapan','konseling_darurat','lainnya'
    )),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_address TEXT,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_seen_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    responded_by UUID REFERENCES public.profiles(id),
    escalated_to UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'triggered' CHECK (status IN (
        'triggered','acknowledged','in_progress','completed','cancelled'
    )),
    notes TEXT,
    anointing_id UUID REFERENCES public.anointings(id)
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastoral_sos ENABLE ROW LEVEL SECURITY;