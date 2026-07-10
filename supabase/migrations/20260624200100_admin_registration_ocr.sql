-- Migration 069: Admin Registration OCR Support
-- Date: 24 Juni 2026
-- Ref: Admin dashboard registration with OCR scanning

-- ============================================
-- 1. ADD METADATA TO auth_otps
-- ============================================
ALTER TABLE IF EXISTS public.auth_otps ADD COLUMN IF NOT EXISTS
    metadata JSONB;

-- ============================================
-- 2. CREATE ocr_scan_results TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ocr_scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT CHECK (document_type IN ('ktp','kk','surat_baptis','akta_nikah','surat_cerai','lainnya')),
    image_url TEXT NOT NULL,
    extracted_text TEXT,
    confidence_score DECIMAL(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
    fields_extracted JSONB,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending','processing','completed','failed')),
    error_message TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ocr_scan_results_document_type ON public.ocr_scan_results(document_type);
CREATE INDEX IF NOT EXISTS idx_ocr_scan_results_created_by ON public.ocr_scan_results(created_by);
CREATE INDEX IF NOT EXISTS idx_ocr_scan_results_created_at ON public.ocr_scan_results(created_at DESC);

-- ============================================
-- 3. ADD registration metadata to profiles
-- ============================================
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    registration_source TEXT DEFAULT 'self' CHECK (registration_source IN ('self','admin','import'));

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    registered_by UUID REFERENCES public.profiles(id);

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    approved_by UUID REFERENCES public.profiles(id);

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    approved_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS
    registration_notes TEXT;

-- ============================================
-- 4. ENABLE RLS
-- ============================================
ALTER TABLE public.ocr_scan_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES for ocr_scan_results
-- ============================================

-- Admin can view all OCR scans
CREATE POLICY "Admin can view all OCR scans" ON public.ocr_scan_results
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND access_layer >= 4
        )
    );

-- Admin can create OCR scans
CREATE POLICY "Admin can create OCR scans" ON public.ocr_scan_results
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND access_layer >= 4
        )
    );

-- Admin can update own scans
CREATE POLICY "Admin can update own OCR scans" ON public.ocr_scan_results
    FOR UPDATE TO authenticated USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND access_layer >= 7
        )
    );

-- ============================================
-- 6. HELPER FUNCTION: Check admin registration permission
-- ============================================
CREATE OR REPLACE FUNCTION public.can_register_users(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_user_id 
        AND access_layer >= 4
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. HELPER FUNCTION: Auto-activate admin-created users
-- ============================================
CREATE OR REPLACE FUNCTION public.register_user_from_admin(
    p_admin_id UUID,
    p_phone TEXT,
    p_full_name TEXT,
    p_family_id UUID DEFAULT NULL,
    p_registration_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_cleaned_phone TEXT;
BEGIN
    -- Validate admin permission
    IF NOT public.can_register_users(p_admin_id) THEN
        RAISE EXCEPTION 'User does not have permission to register users';
    END IF;

    -- Normalize phone
    v_cleaned_phone := regexp_replace(p_phone, '\D', '', 'g');
    IF v_cleaned_phone LIKE '0%' THEN
        v_cleaned_phone := '62' || substring(v_cleaned_phone from 2);
    ELSIF NOT v_cleaned_phone LIKE '62%' THEN
        v_cleaned_phone := '62' || v_cleaned_phone;
    END IF;

    -- Check if user already exists
    SELECT id INTO v_user_id FROM public.profiles WHERE phone = v_cleaned_phone LIMIT 1;

    IF v_user_id IS NULL THEN
        -- Create new profile (active, bypass waiting room)
        INSERT INTO public.profiles (
            phone,
            full_name,
            family_id,
            status,
            access_layer,
            role,
            registration_source,
            registered_by,
            registration_notes
        ) VALUES (
            v_cleaned_phone,
            p_full_name,
            p_family_id,
            'active',
            2,
            'umat',
            'admin',
            p_admin_id,
            p_registration_notes
        ) RETURNING id INTO v_user_id;
    ELSE
        -- Update existing profile to active if pending
        UPDATE public.profiles
        SET 
            status = 'active',
            access_layer = 2,
            registration_source = 'admin',
            registered_by = p_admin_id,
            registration_notes = COALESCE(p_registration_notes, registration_notes)
        WHERE id = v_user_id;
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.ocr_scan_results TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_register_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_user_from_admin(UUID, TEXT, TEXT, UUID, TEXT) TO authenticated;