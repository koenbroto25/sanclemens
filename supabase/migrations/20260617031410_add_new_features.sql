-- Create sakramen_applications table
CREATE TABLE IF NOT EXISTS public.sakramen_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sakramen_type TEXT NOT NULL, -- 'perkawinan', 'baptis', 'krisma'
    application_data JSONB NOT NULL, -- Stores all form data (e.g., calon_pasangan, orang_tua, rencana_tanggal)
    status TEXT NOT NULL DEFAULT 'pending_kl_approval', -- 'pending_kl_approval', 'approved_kl', 'rejected_kl', 'sent_to_sekretaris', 'processing_sekretaris', 'completed', 'rejected_sekretaris'
    kl_approver_id UUID REFERENCES public.profiles(id),
    sekretaris_approver_id UUID REFERENCES public.profiles(id),
    kl_approval_notes TEXT,
    sekretaris_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sakramen_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can apply for sacraments" ON public.sakramen_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own sacrament applications" ON public.sakramen_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "KL can view and update sacrament applications in their lingkungan" ON public.sakramen_applications
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4 AND lingkungan_id = (SELECT lingkungan_id FROM public.profiles WHERE id = sakramen_applications.user_id))
    );
CREATE POLICY "KL can approve/reject sacrament applications in their lingkungan" ON public.sakramen_applications
    FOR UPDATE USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4 AND lingkungan_id = (SELECT lingkungan_id FROM public.profiles WHERE id = sakramen_applications.user_id))
    ) WITH CHECK (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4 AND lingkungan_id = (SELECT lingkungan_id FROM public.profiles WHERE id = sakramen_applications.user_id))
    );
CREATE POLICY "Sekretaris 1 can view and update sacrament applications" ON public.sakramen_applications FOR SELECT USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5));
CREATE POLICY "Sekretaris 1 can approve/reject sacrament applications" ON public.sakramen_applications
    FOR UPDATE USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5))
    WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5));


-- Create sakramen_documents table (links to storage.objects)
CREATE TABLE IF NOT EXISTS public.sakramen_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.sakramen_applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g., 'surat_baptis', 'ktp', 'kk'
    storage_object_id TEXT NOT NULL, -- ID or path from storage.objects
    uploaded_by UUID REFERENCES auth.users(id),
    verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sakramen_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sacrament documents" ON public.sakramen_documents FOR ALL USING (EXISTS(SELECT 1 FROM public.sakramen_applications sa WHERE sa.id = application_id AND sa.user_id = auth.uid()));
CREATE POLICY "KL can view sacrament documents for their lingkungan" ON public.sakramen_documents FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles p JOIN public.sakramen_applications sa ON sa.user_id = p.id WHERE sa.id = application_id AND p.lingkungan_id = (SELECT lingkungan_id FROM public.profiles WHERE id = auth.uid()) AND auth.uid() IN (SELECT id FROM public.profiles WHERE access_layer >= 4))
);
CREATE POLICY "Sekretaris 1 can view and verify sacrament documents" ON public.sakramen_documents FOR ALL USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5));


-- Create kolekte_entries table
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kolekte_status_enum') THEN CREATE TYPE public.kolekte_status_enum AS ENUM ('pending_second_entry', 'reconciled', 'mismatched', 'approved_mismatch'); END IF; END $$;
CREATE TABLE IF NOT EXISTS public.kolekte_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bendahara_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    entry_type TEXT NOT NULL, -- 'mingguan', 'khusus'
    nominal NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (bendahara_id, entry_date, entry_type) -- Ensure only one entry per bendahara per type per day
);






-- Create kolekte_reconciliations table
CREATE TABLE IF NOT EXISTS public.kolekte_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    entry_type TEXT NOT NULL,
    nominal_b1 NUMERIC(15, 2),
    nominal_b2 NUMERIC(15, 2),
    status public.kolekte_status_enum NOT NULL DEFAULT 'pending_second_entry',
    reconciled_nominal NUMERIC(15, 2),
    supervisor_id UUID REFERENCES public.profiles(id),
    supervisor_notes TEXT,
    reconciled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    lingkungan_id UUID REFERENCES public.lingkungan(id), -- For lingkungan specific kolekte
    paroki_id UUID -- For paroki wide kolekte
);

ALTER TABLE public.kolekte_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can view and update kolekte reconciliations in their scope" ON public.kolekte_reconciliations FOR ALL USING (
    EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.access_layer >= 4) -- KL can reconcile lingk. kolekte
);


-- Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    target_link TEXT,
    ad_type TEXT NOT NULL, -- 'syukur', 'duka', 'mohon_doa', 'premium_umum', 'premium_marketplace'
    status TEXT NOT NULL DEFAULT 'pending_approval', -- 'pending_approval', 'active', 'inactive', 'rejected'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create their own non-premium ads" ON public.ads FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (ad_type IN ('syukur', 'duka', 'mohon_doa'))
);
CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (access_layer >= 5 OR ad_type = 'premium_marketplace' AND access_layer >= 6)) -- Komsos for general, Marketplace Admin for marketplace
);
CREATE POLICY "Public can view active public ads" ON public.ads FOR SELECT USING (status = 'active' AND ad_type IN ('syukur', 'duka', 'mohon_doa', 'premium_umum'));


-- Create ad_locations table (to map ads to specific display areas)
CREATE TABLE IF NOT EXISTS public.ad_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
    location_slug TEXT NOT NULL, -- 'homepage_main', 'gate_hub_premium', 'marketplace_premium'
    display_mode TEXT, -- 'banner', 'card', 'popup'
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (ad_id, location_slug)
);

ALTER TABLE public.ad_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ad locations" ON public.ad_locations FOR ALL USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5));
CREATE POLICY "Public can view active ad locations" ON public.ad_locations FOR SELECT USING (is_active = TRUE AND EXISTS(SELECT 1 FROM public.ads WHERE ads.id = ad_id AND ads.status = 'active'));


-- Create social_media_links table
CREATE TABLE IF NOT EXISTS public.social_media_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE, -- 'instagram', 'youtube', 'facebook'
    url TEXT NOT NULL,
    icon_name TEXT, -- e.g., 'instagram', 'youtube'
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage social media links" ON public.social_media_links FOR ALL USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5));
CREATE POLICY "Public can view active social media links" ON public.social_media_links FOR SELECT USING (is_active = TRUE);


-- Add columns to profiles table for data completion flow
ALTER TABLE public.profiles
ADD COLUMN is_data_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN last_data_completion_reminder TIMESTAMPTZ;


-- Create bot_interactions table (for all bot types)
CREATE TABLE IF NOT EXISTS public.bot_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_id TEXT NOT NULL, -- e.g., 'companion_rohani', 'gate_bot'
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    interaction_context JSONB, -- Stores current context of conversation
    is_encrypted BOOLEAN DEFAULT FALSE, -- For Companion Rohani
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bot_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bot interactions" ON public.bot_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bot interactions" ON public.bot_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view non-encrypted bot interactions" ON public.bot_interactions FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5) AND is_encrypted = FALSE
);


-- Create bot_configs table (for bot settings management by admins)
CREATE TABLE IF NOT EXISTS public.bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id TEXT NOT NULL UNIQUE,
    config_data JSONB, -- Stores AI model settings, system prompts, abuse thresholds
    is_active BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage bot configurations" ON public.bot_configs FOR ALL USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 9)); -- Only high-level admins (Pastor, Super Admin)
CREATE POLICY "All users can read active bot configurations" ON public.bot_configs FOR SELECT USING (is_active = TRUE);


-- Create bot_context_storage table (for persistent bot context for long conversations)
CREATE TABLE IF NOT EXISTS public.bot_context_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_id TEXT NOT NULL,
    context_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ, -- Context can expire
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bot_id)
);

ALTER TABLE public.bot_context_storage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own bot context" ON public.bot_context_storage FOR ALL USING (auth.uid() = user_id);