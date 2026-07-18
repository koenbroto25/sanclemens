-- ============================================
-- SCRIPT IMPORT DATA UMAT KE SUPABASE
-- ============================================
-- Langkah-langkah:
-- 1. Import CSV via Supabase Dashboard dulu
-- 2. Jalankan script ini untuk fix relasi dan UUID
-- ============================================

-- ============================================
-- BAGIAN 1: PROFILES
-- ============================================

-- Buat user profiles untuk data yang ada
-- Catatan: Jika id di CSV bukan UUID valid, kita perlu generate baru
-- dan hubungkan dengan auth.users

DO $$
DECLARE
    profile_record RECORD;
    new_user_id UUID;
BEGIN
    FOR profile_record IN 
        SELECT * FROM public.profiles 
        WHERE id IS NOT NULL 
        LIMIT 100  -- Process in batches if needed
    LOOP
        -- Try to use existing ID if it's valid UUID
        BEGIN
            new_user_id := profile_record.id::UUID;
        EXCEPTION
            WHEN invalid_text_representation THEN
                -- Generate new UUID if invalid
                new_user_id := gen_random_uuid();
                UPDATE public.profiles 
                SET id = new_user_id 
                WHERE id = profile_record.id;
        END;
    END LOOP;
END $$;

-- ============================================
-- BAGIAN 2: KELUARGA
-- ============================================

-- Generate UUID untuk keluarga yang belum ada
UPDATE public.keluarga
SET id = gen_random_uuid()
WHERE id IS NULL OR id = '';

-- Atau jika ID di CSV adalah placeholder (misal: gen_uuid_1, gen_uuid_2, dst)
UPDATE public.keluarga
SET id = gen_random_uuid()
WHERE id LIKE 'gen_uuid_%';

-- ============================================
-- BAGIAN 3: SAKRAMEN RECORDS
-- ============================================

-- Generate UUID untuk sakramen records
UPDATE public.sakramen_records
SET id = gen_random_uuid()
WHERE id IS NULL OR id = '' OR id LIKE 'gen_uuid_%';

-- Validasi: Pastikan semua user_id ada di profiles
-- Hapus sakramen records yang user_id-nya tidak valid
DELETE FROM public.sakramen_records
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- ============================================
-- BAGIAN 4: VERIFIKASI
-- ============================================

-- Cek jumlah data
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'keluarga', COUNT(*) FROM public.keluarga
UNION ALL
SELECT 'sakramen_records', COUNT(*) FROM public.sakramen_records
UNION ALL
SELECT 'umat_details', COUNT(*) FROM public.umat_details;

-- ============================================
-- BAGIAN 5: SAMPLE QUERIES
-- ============================================

-- Lihat data profil lengkap dengan keluarga
SELECT 
    p.id,
    p.nama,
    p.jenis_kelamin,
    p.tanggal_lahir,
    p.handphone_telepon,
    k.no_kartu_keluarga,
    k.alamat,
    k.kecamatan,
    k.kelurahan
FROM public.profiles p
LEFT JOIN public.keluarga k ON p.no_kartu_keluarga = k.no_kartu_keluarga
LIMIT 10;

-- Lihat sakramen terbaru
SELECT 
    sr.sacrament_type,
    sr.date_received,
    sr.paroki_received,
    p.nama as nama_umat
FROM public.sakramen_records sr
JOIN public.profiles p ON sr.user_id = p.id
ORDER BY sr.created_at DESC
LIMIT 10;

-- Lihat statistik sakramen per jenis
SELECT 
    sacrament_type,
    COUNT(*) as jumlah,
    MIN(date_received) as tanggal_terlama,
    MAX(date_received) as tanggal_terbaru
FROM public.sakramen_records
GROUP BY sacrament_type
ORDER BY jumlah DESC;

-- ============================================
-- BAGIAN 6: INDEX UNTUK PERFORMA
-- ============================================

-- Pastikan index ada (seharusnya sudah dibuat di migrasi)
CREATE INDEX IF NOT EXISTS idx_profiles_no_kk 
ON public.profiles(no_kartu_keluarga);

CREATE INDEX IF NOT EXISTS idx_sakramen_user_id 
ON public.sakramen_records(user_id);

-- ============================================
-- SELESAI
-- ============================================

-- Catatan:
-- 1. Jika ada error FK violation, pastikan import profiles DULU
-- 2. Jika ada error duplicate key, hapus data duplikat terlebih dahulu
-- 3. Cek RLS policies jika data tidak terlihat di aplikasi
-- 4. Umum: GRANT permissions jika perlu:
--    
--    GRANT ALL ON public.profiles TO authenticated;
--    GRANT ALL ON public.keluarga TO authenticated;
--    GRANT ALL ON public.sakramen_records TO authenticated;
--    GRANT ALL ON public.umat_details TO authenticated;