-- Migration 014: Storage Buckets RLS Policies
-- Ref: masterplan.md - Storage bucket policies
-- 7 buckets: profile-photos, vault-documents, kegiatan-photos, marketplace-products,
--            sakramen-certificates, parish-assets, pastoral-sos-media

-- ============================================
-- 1. STORAGE BUCKETS
-- ============================================
-- Buckets harus sudah dibuat via scripts/setup-storage-buckets.mjs
-- Migration ini hanya menambahkan RLS policies

-- ============================================
-- 2. RLS POLICIES FOR STORAGE
-- ============================================

-- Enable RLS on storage.objects (jika belum)
-- RLS on storage.objects is managed by Supabase automatically

-- Drop existing policies (jika ada) untuk re-runnable
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

DROP POLICY IF EXISTS "Users can view own vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Sekretaris+ can view all vault" ON storage.objects;
DROP POLICY IF EXISTS "Sekretaris+ can verify vault" ON storage.objects;

DROP POLICY IF EXISTS "Kegiatan photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Koordinator+ can upload kegiatan photos" ON storage.objects;
DROP POLICY IF EXISTS "Koordinator+ can update kegiatan photos" ON storage.objects;

DROP POLICY IF EXISTS "Marketplace products are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Verified sellers can upload products" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can update their own products" ON storage.objects;

DROP POLICY IF EXISTS "Users can view their own sakramen certificates" ON storage.objects;
DROP POLICY IF EXISTS "Pastor+ can upload sakramen certificates" ON storage.objects;
DROP POLICY IF EXISTS "Pastor+ can view all certificates" ON storage.objects;

DROP POLICY IF EXISTS "Parish assets are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can manage parish assets" ON storage.objects;

DROP POLICY IF EXISTS "Pastor+ can view all pastoral sos media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own sos media" ON storage.objects;
DROP POLICY IF EXISTS "Triggered_by users can view their own sos" ON storage.objects;

-- ============================================
-- 2.1 PROFILE PHOTOS (PUBLIC bucket, user-managed)
-- ============================================
CREATE POLICY "Users can upload their own profile photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Profile photos are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own profile photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- 2.2 VAULT DOCUMENTS (PRIVATE bucket)
-- ============================================
CREATE POLICY "Users can view own vault documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'vault-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload own vault documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'vault-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Sekretaris+ can view all vault"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'vault-documents' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) >= 5
    );

CREATE POLICY "Sekretaris+ can verify vault"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'vault-documents' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) >= 5
    );

-- ============================================
-- 2.3 KEGIATAN PHOTOS (PUBLIC bucket, koordinator-managed)
-- ============================================
CREATE POLICY "Kegiatan photos are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'kegiatan-photos');

CREATE POLICY "Koordinator+ can upload kegiatan photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'kegiatan-photos' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) >= 7
    );

CREATE POLICY "Koordinator+ can update kegiatan photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'kegiatan-photos' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) >= 7
    );

-- ============================================
-- 2.4 MARKETPLACE PRODUCTS (PUBLIC bucket, seller-managed)
-- ============================================
CREATE POLICY "Marketplace products are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'marketplace-products');

CREATE POLICY "Verified sellers can upload products"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'marketplace-products' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND marketplace_role = 'seller'
            AND seller_verified = TRUE
        )
    );

CREATE POLICY "Sellers can update their own products"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'marketplace-products' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- 2.5 SAKRAMEN CERTIFICATES (PRIVATE bucket)
-- ============================================
CREATE POLICY "Users can view their own sakramen certificates"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'sakramen-certificates' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Pastor+ can upload sakramen certificates"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'sakramen-certificates' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) >= 9
    );

CREATE POLICY "Pastor+ can view all certificates"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'sakramen-certificates' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) >= 9
    );

-- ============================================
-- 2.6 PARISH ASSETS (PUBLIC bucket, super-admin-managed)
-- ============================================
CREATE POLICY "Parish assets are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'parish-assets');

CREATE POLICY "Super admin can manage parish assets"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'parish-assets' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) = 10
    );

-- ============================================
-- 2.7 PASTORAL SOS MEDIA (PRIVATE bucket)
-- ============================================
CREATE POLICY "Pastor+ can view all pastoral sos media"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'pastoral-sos-media' AND
        (SELECT access_layer FROM public.profiles WHERE id = auth.uid()) >= 9
    );

CREATE POLICY "Users can upload own sos media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'pastoral-sos-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Triggered_by users can view their own sos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'pastoral-sos-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
