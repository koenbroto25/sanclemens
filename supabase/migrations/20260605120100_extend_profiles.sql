-- Migration 012: Extended Profiles Columns for Marketplace, Notifications, AI
-- Ref: GDD BAB 0.4 (Pintu 3), BAB XII (AI Companion), BAB XIII (Notifications)
-- Menambah kolom yang diperlukan untuk Fase 1-4 ke tabel profiles

-- ============================================
-- 1. MARKETPLACE COLUMNS (Pintu 3 - Fase 4)
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS marketplace_role TEXT DEFAULT 'buyer' 
    CHECK (marketplace_role IN ('buyer', 'seller', 'driver', 'mp_admin')),
ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_verified_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS seller_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS driver_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS driver_vehicle_info JSONB;  -- {jenis: 'motor', plat: 'KT ...', kapasitas: 1}

-- ============================================
-- 2. DENORMALIZED LINGKUNGAN SLUG (Performa lookup Pintu 2)
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lingkungan_slug TEXT;

-- ============================================
-- 3. NOTIFICATION COLUMNS (Bab XIII)
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notif_token TEXT,  -- FCM token
ADD COLUMN IF NOT EXISTS notif_liturgis BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_kegiatan BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_keuangan BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_pastoral BOOLEAN DEFAULT TRUE;

-- ============================================
-- 4. AI COMPANION COLUMNS (Bab XII - untuk Soul Profile E2E)
-- ============================================
-- Soul Profile disimpan di companion.soul_profiles (E2E encrypted)
-- Di sini hanya flag dan metadata non-sensitive
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS companion_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS companion_pin_hash TEXT,  -- PBKDF2 hash for PIN verification
ADD COLUMN IF NOT EXISTS companion_salt TEXT,      -- Salt for PIN derivation
ADD COLUMN IF NOT EXISTS companion_last_mode TEXT, -- Last active mode for resume
ADD COLUMN IF NOT EXISTS companion_session_count INTEGER DEFAULT 0;

-- ============================================
-- 5. SAKRAMEN TRACKING (Denormalized untuk dashboard cepat)
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sakramen_baptis BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sakramen_komuni BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sakramen_krisma BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sakramen_perkawinan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sakramen_pengurapan BOOLEAN DEFAULT FALSE;

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_marketplace_role ON public.profiles(marketplace_role);
CREATE INDEX IF NOT EXISTS idx_profiles_seller_verified ON public.profiles(seller_verified) WHERE seller_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_driver_active ON public.profiles(driver_active) WHERE driver_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_lingkungan_slug ON public.profiles(lingkungan_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_companion_enabled ON public.profiles(companion_enabled) WHERE companion_enabled = TRUE;

-- ============================================
-- 7. UPDATE lingkungan_slug FROM lingkungan JOIN
-- ============================================
-- Run after lingkungan has slugs populated
UPDATE public.profiles p
SET lingkungan_slug = l.slug
FROM public.lingkungan l
WHERE p.lingkungan_id = l.id
AND p.lingkungan_slug IS NULL;

-- ============================================
-- 8. COMMENTS
-- ============================================
COMMENT ON COLUMN public.profiles.marketplace_role IS 'Role di Pintu 3 Marketplace: buyer, seller, driver, mp_admin';
COMMENT ON COLUMN public.profiles.seller_verified IS 'Sudah diverifikasi admin marketplace untuk jual';
COMMENT ON COLUMN public.profiles.driver_active IS 'Status driver ojek aktif (tanpa fee paroki)';
COMMENT ON COLUMN public.profiles.driver_vehicle_info IS 'JSON: {jenis: "motor", plat: "KT 1234 AB", kapasitas: 1}';
COMMENT ON COLUMN public.profiles.lingkungan_slug IS 'Denormalized slug untuk redirect cepat ke /lingkungan/[slug]';
COMMENT ON COLUMN public.profiles.notif_token IS 'FCM device token untuk push notification';
COMMENT ON COLUMN public.profiles.companion_pin_hash IS 'PBKDF2 hash of PIN (100k iterasi) untuk unlock Companion E2E';
COMMENT ON COLUMN public.profiles.sakramen_baptis IS 'Flag cepat: sudah menerima sakramen Baptis';