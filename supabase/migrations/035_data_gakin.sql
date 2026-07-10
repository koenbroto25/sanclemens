-- Migration 035: Data GAKIN — Keluarga Miskin
-- Ref: GDD v4.0 BAB IV §4.2, Sub-Fase 1.11

CREATE TABLE IF NOT EXISTS public.data_gakin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    penghasilan_per_bulan DECIMAL(12,2),
    jumlah_tanggungan INTEGER,
    kondisi_rumah TEXT CHECK (kondisi_rumah IN ('layak','kurang_layak','tidak_layak')),
    catatan_seksos TEXT,
    foto_kondisi TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed','active','rejected','graduated')),
    proposed_by UUID NOT NULL REFERENCES public.profiles(id),
    proposed_at TIMESTAMPTZ DEFAULT NOW(),
    graduated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_gakin_family ON public.data_gakin(family_id);
CREATE INDEX IF NOT EXISTS idx_data_gakin_status ON public.data_gakin(status);

ALTER TABLE public.data_gakin ENABLE ROW LEVEL SECURITY;

-- Policy: Pastor (Layer 9) bisa read all
CREATE POLICY "Pastor can read all gakin" ON public.data_gakin
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('pastor', 'vikaris', 'super_admin')
        )
    );

-- Policy: Wakil DPP (Layer 8) bisa read all
CREATE POLICY "Wakil DPP can read all gakin" ON public.data_gakin
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('wakil_ketua')
        )
    );

-- Policy: Komsos (Layer 5+) bisa read all
CREATE POLICY "Komsos can read all gakin" ON public.data_gakin
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('sekretaris', 'koordinator_bidang', 'sub_koordinator')
        )
    );

-- Policy: KL bisa read gakin di lingkungan sendiri
CREATE POLICY "KL can read gakin own lingkungan" ON public.data_gakin
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'ketua_lingkungan'
            AND lingkungan_id = (SELECT lingkungan_id FROM public.families WHERE id = family_id)
        )
    );

-- Policy: Yang punya akses read bisa insert
CREATE POLICY "Authorized roles can insert gakin" ON public.data_gakin
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN (
                'pastor', 'vikaris', 'super_admin', 'wakil_ketua',
                'sekretaris', 'koordinator_bidang', 'sub_koordinator',
                'ketua_lingkungan'
            )
        )
    );

-- Policy: Update oleh role yang berwenang
CREATE POLICY "Authorized roles can update gakin" ON public.data_gakin
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN (
                'pastor', 'vikaris', 'super_admin', 'wakil_ketua',
                'sekretaris', 'koordinator_bidang', 'sub_koordinator'
            )
        )
    ) WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN (
                'pastor', 'vikaris', 'super_admin', 'wakil_ketua',
                'sekretaris', 'koordinator_bidang', 'sub_koordinator'
            )
        )
    );