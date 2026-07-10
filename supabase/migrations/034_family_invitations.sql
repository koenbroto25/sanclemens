-- Migration 034: Family Invitations — Cari & Sambung Keluarga
-- Ref: GDD v4.0 BAB II §2.2-2.3, Sub-Fase 1.6

CREATE TABLE IF NOT EXISTS public.family_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    invitee_phone TEXT NOT NULL,
    invitee_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
    kode_undangan TEXT UNIQUE,
    pesan TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_invitations_family ON public.family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_phone ON public.family_invitations(invitee_phone);
CREATE INDEX IF NOT EXISTS idx_family_invitations_status ON public.family_invitations(status);
CREATE INDEX IF NOT EXISTS idx_family_invitations_kode ON public.family_invitations(kode_undangan);

ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Anggota keluarga bisa lihat undangan keluarga sendiri
CREATE POLICY "Family members can view invitations" ON public.family_invitations
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy: Anggota keluarga bisa create undangan
CREATE POLICY "Family members can create invitations" ON public.family_invitations
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy: Yang diundang bisa update status (accept/reject)
CREATE POLICY "Invitee can update invitation" ON public.family_invitations
    FOR UPDATE USING (
        invitee_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
    ) WITH CHECK (
        invitee_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
    );