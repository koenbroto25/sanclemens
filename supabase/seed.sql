-- Seed Data untuk Ekosistem Digital Paroki Santo Klemens
-- Ref: GDD Bab VI "Authentication & Authorization" — Organisasi & Bidang
-- Data UPDATED: 5 Juni 2026 — 17 Lingkungan + Stasi real Paroki Santo Klemens Sepinggan

-- ============================================
-- 1. WILAYAH (3 wilayah utama paroki)
-- ============================================
INSERT INTO public.wilayah (nama) VALUES
    ('Wilayah Pantai'),
    ('Wilayah Gunung'),
    ('Wilayah Kota');

-- ============================================
-- 2. LINGKUNGAN & STASI (17 total)
-- ============================================
-- 15 Lingkungan + 2 Stasi (Stasi = lokasi baptis di luar gereja utama)
-- Ref: Daftar Lingkungan Gereja Santo Martinus, Lanud Sepinggan, Balikpapan
-- Wilayah assignment: Pantai = dekat pesisir, Gunung = hulu, Kota = pusat kota
INSERT INTO public.lingkungan (nama, slug, is_stasi, alamat) VALUES
    -- 15 Lingkungan Utama
    ('Lingkungan St. Andreas Rasul',         'st-andreas-rasul',         FALSE, 'Kompleks Lanud Sepinggan'),
    ('Lingkungan St. Clara',                 'st-clara',                 FALSE, 'Jl. Mulawarman, Balikpapan'),
    ('Lingkungan St. Fransiskus Asisi',      'st-fransiskus-asisi',      FALSE, 'Jl. Jenderal Sudirman'),
    ('Lingkungan St. Monica',                'st-monica',                FALSE, 'Jl. ARS Muhammad, Balikpapan'),
    ('Lingkungan St. Theresia dari Lisieux', 'st-theresia-lisieux',      FALSE, 'Jl. Letjen Suprapto'),
    ('Lingkungan St. Theresia dari Avilla',  'st-theresia-avilla',       FALSE, 'Jl. Pattimura, Balikpapan'),
    ('Lingkungan St. Maria Ratu Rosari',     'st-maria-rosari',          FALSE, 'Jl. Mayjend Sutoyo'),
    ('Lingkungan St. Gabriel',               'st-gabriel',               FALSE, 'Jl. Pangeran Antasari'),
    ('Lingkungan St. Albertus',              'st-albertus',              FALSE, 'Jl. Kapten Pierre Tendean'),
    ('Lingkungan St. Maria Salve Regina',    'st-maria-salve-regina',    FALSE, 'Jl. Diponegoro, Balikpapan'),
    ('Lingkungan St. Maria La Salet',        'st-maria-la-salet',        FALSE, 'Jl. RE Martadinata'),
    ('Lingkungan St. Anna',                  'st-anna',                  FALSE, 'Jl. Gunung Empat'),
    ('Lingkungan St. Maria Immacula',        'st-maria-immaculata',      FALSE, 'Jl. Imam Bonjol'),
    ('Lingkungan St. Lukas Penginji',       'st-lukas-penginjil',       FALSE, 'Jl. Jend. A. Yani'),
    ('Lingkungan St. Yosef Pekerja',         'st-yosef-pekerja',         FALSE, 'Jl. Ruhui Rahayu'),
    -- 2 Stasi
    ('Stasi Argosari St. Yosef',            'stasi-argosari',           TRUE,  'Argosari, Balikpapan'),
    ('Stasi Handil',                         'stasi-handil',             TRUE,  'Handil, Balikpapan');

-- ============================================
-- 3. WILAYAH MAPPING per Lingkungan
-- ============================================
-- Pantai: lingkungan dekat pesisir/laut (Handil, Argosari)
-- Gunung: lingkungan di hulu (Klandasan, Gn. Empat, dll)
-- Kota: lingkungan di pusat kota Balikpapan
DO $$
DECLARE
    wil_pantai UUID;
    wil_gunung UUID;
    wil_kota UUID;
BEGIN
    SELECT id INTO wil_pantai FROM public.wilayah WHERE nama = 'Wilayah Pantai' LIMIT 1;
    SELECT id INTO wil_gunung FROM public.wilayah WHERE nama = 'Wilayah Gunung' LIMIT 1;
    SELECT id INTO wil_kota   FROM public.wilayah WHERE nama = 'Wilayah Kota'   LIMIT 1;

    -- Wilayah Pantai (stasi, pesisir)
    UPDATE public.lingkungan SET wilayah_id = wil_pantai WHERE slug IN ('stasi-handil', 'stasi-argosari');

    -- Wilayah Gunung (hulu, lebih tinggi)
    UPDATE public.lingkungan SET wilayah_id = wil_gunung WHERE slug IN (
        'st-clara', 'st-theresia-lisieux', 'st-gabriel',
        'st-anna', 'st-maria-immaculata', 'st-yosef-pekerja'
    );

    -- Wilayah Kota (pusat kota)
    UPDATE public.lingkungan SET wilayah_id = wil_kota WHERE slug IN (
        'st-andreas-rasul', 'st-fransiskus-asisi', 'st-monica',
        'st-theresia-avilla', 'st-maria-rosari', 'st-albertus',
        'st-maria-salve-regina', 'st-maria-la-salet', 'st-lukas-penginjil'
    );
END $$;

-- ============================================
-- 4. PARISH PROFILE
-- ============================================
INSERT INTO public.parish_profile (nama_paroki, alamat, keuskupan, sk_nomor)
VALUES (
    'Paroki Santo Klemens I',
    'Gereja Santo Martinus, Lanud, Balikpapan, Kalimantan Timur',
    'Keuskupan Agung Samarinda',
    '175/A.VIII.8/X/2024'
);

-- ============================================
-- 5. BIDANG-BIDANG POKOK DPP (informational)
-- ============================================
-- 5 Bidang Pokok: Kerygma, Liturgia, Koinonia, Diakonia, Martyria
-- Disimpan di governance_program_kerja.bidang via data JSON

-- ============================================
-- 6. KELOMPOK UMAT PER LINGKUNGAN (template untuk 17 ling/stasi)
-- ============================================
-- Ini untuk tracking komunitas_gereja[] di profiles

-- ============================================
-- 7. AUTHENTICATION & PROFILES SEED DATA (for testing - removed direct auth.users inserts)
--    Users should be created via Supabase CLI (supabase auth admin create-user)
--    and then their profiles linked in public.profiles.
-- ============================================

-- Insert new v5 roles if they do not exist (into roles table, not profiles)
INSERT INTO public.roles (role_name, display_name, access_layer)
VALUES
  ('buyer', 'Buyer', 1),
  ('seller', 'Seller', 2),
  ('ojek_solidaritas', 'Ojek Solidaritas', 2),
  ('manager_marketplace', 'Manager Marketplace', 7),
  ('keuangan_marketplace', 'Keuangan Marketplace', 7)
ON CONFLICT (role_name) DO NOTHING;
