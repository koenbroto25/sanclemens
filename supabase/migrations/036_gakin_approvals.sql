-- Migration 036: GAKIN Approvals — Approval 3 dari 4
-- Ref: GDD v4.0 BAB IV §4.2 — Approval GAKIN 3 dari 4 (Pastor + Wakil DPP + Komsos + KL)

CREATE TABLE IF NOT EXISTS public.gakin_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gakin_id UUID NOT NULL REFERENCES public.data_gakin(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public.profiles(id),
    role_saat_approve TEXT NOT NULL CHECK (role_saat_approve IN ('pastor', 'wakil_dpp', 'komsos', 'kl')),
    approved BOOLEAN DEFAULT FALSE,
    catatan TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gakin_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_gakin_approvals_gakin ON public.gakin_approvals(gakin_id);
CREATE INDEX IF NOT EXISTS idx_gakin_approvals_approver ON public.gakin_approvals(approver_id);

ALTER TABLE public.gakin_approvals ENABLE ROW LEVEL SECURITY;

-- View: Status approval GAKIN
CREATE OR REPLACE VIEW public.gakin_status AS
SELECT 
    dg.*,
    (SELECT COUNT(*) FROM public.gakin_approvals ga 
     WHERE ga.gakin_id = dg.id AND ga.approved = TRUE) as approval_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.gakin_approvals ga 
              WHERE ga.gakin_id = dg.id AND ga.approved = TRUE) >= 3 
        THEN 'approved' 
        ELSE 'pending' 
    END as approval_status
FROM public.data_gakin dg;

-- Policy: Yang bisa read data_gakin bisa read approvals
CREATE POLICY "Gakin readers can view approvals" ON public.gakin_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.data_gakin dg
            WHERE dg.id = gakin_id
            AND (
                -- Pastor, Wakil DPP, Komsos bisa read all
                auth.uid() IN (
                    SELECT id FROM public.profiles 
                    WHERE role IN ('pastor', 'vikaris', 'super_admin', 'wakil_ketua', 'sekretaris', 'koordinator_bidang', 'sub_koordinator')
                )
                OR
                -- KL hanya untuk lingkungan sendiri
                (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ketua_lingkungan')
                 AND dg.family_id IN (
                    SELECT id FROM public.families WHERE lingkungan_id = (
                        SELECT lingkungan_id FROM public.profiles WHERE id = auth.uid()
                    )
                 ))
            )
        )
    );

-- Policy: Hanya approver yang bisa insert/update approval mereka sendiri
CREATE POLICY "Approver can manage own approvals" ON public.gakin_approvals
    FOR INSERT WITH CHECK (
        approver_id = auth.uid()
    );

CREATE POLICY "Approver can update own approvals" ON public.gakin_approvals
    FOR UPDATE USING (
        approver_id = auth.uid()
    ) WITH CHECK (
        approver_id = auth.uid()
    );