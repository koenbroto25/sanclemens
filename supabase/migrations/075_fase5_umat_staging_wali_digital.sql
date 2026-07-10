-- ============================================
-- MIGRATION 075: Umat Staging & Wali Digital
-- Tanggal: 25 Juni 2026
-- Ref: Rencana Import Data Umat + Wali Digital
-- ============================================

-- ============================================
-- 1. TABEL: umat_staging
-- Menyimpan data asli dari CSV tanpa FK ke auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS public.umat_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    nama_baptis TEXT,
    jenis_kelamin CHAR(1) CHECK (jenis_kelamin IN ('L','P')),
    no_kk TEXT,
    tempat_tanggal_lahir TEXT,
    tanggal_lahir DATE,
    umur INTEGER,
    alamat TEXT,
    hubungan_keluarga TEXT CHECK (hubungan_keluarga IN ('kepala','istri','anak','anggota')),
    keluarga_id UUID REFERENCES public.keluarga(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'staging' CHECK (status IN ('staging','matched','registered')),
    registered_profile_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.umat_staging IS 'Data asli umat dari CSV. Digunakan untuk matching saat registrasi KK.';
COMMENT ON COLUMN public.umat_staging.hubungan_keluarga IS 'Hubungan dalam keluarga: kepala/istri/anak/anggota';
COMMENT ON COLUMN public.umat_staging.status IS 'staging=baru import, matched=terdeteksi saat check-kk, registered=akun sudah dibuat';
COMMENT ON COLUMN public.umat_staging.registered_profile_id IS 'UUID di profiles setelah user registrasi';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_umat_staging_nokk ON public.umat_staging(no_kk);
CREATE INDEX IF NOT EXISTS idx_umat_staging_keluarga_id ON public.umat_staging(keluarga_id);
CREATE INDEX IF NOT EXISTS idx_umat_staging_status ON public.umat_staging(status);
CREATE INDEX IF NOT EXISTS idx_umat_staging_nama ON public.umat_staging(nama);


-- ============================================
-- 2. TABEL: wali_digital_log
-- Audit trail untuk semua aksi wali digital
-- ============================================
CREATE TABLE IF NOT EXISTS public.wali_digital_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wali_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wakilan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    aksi TEXT NOT NULL CHECK (aksi IN (
        'akses_profil',
        'edit_profil',
        'reset_password',
        'tambah_wakilan',
        'lepas_wali_request',
        'lepas_wali_approved',
        'lepas_wali_rejected',
        'login_sebagai'
    )),
    detail TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.wali_digital_log IS 'Log semua aktivitas wali digital terhadap akun yang diwalikan';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wali_log_wali ON public.wali_digital_log(wali_id);
CREATE INDEX IF NOT EXISTS idx_wali_log_wakilan ON public.wali_digital_log(wakilan_id);
CREATE INDEX IF NOT EXISTS idx_wali_log_aksi ON public.wali_digital_log(aksi);
CREATE INDEX IF NOT EXISTS idx_wali_log_created ON public.wali_digital_log(created_at DESC);


-- ============================================
-- 3. KOLOM WALI DIGITAL di profiles
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
    wali_digital_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
    is_wali_digital BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
    username_wd TEXT;

COMMENT ON COLUMN public.profiles.wali_digital_id IS 'UUID wali digital. NULL jika user mandiri.';
COMMENT ON COLUMN public.profiles.is_wali_digital IS 'TRUE jika user ini menjadi wali bagi anggota keluarga lain';
COMMENT ON COLUMN public.profiles.username_wd IS 'Username untuk login user wakilan. Format: nama_baptis@4digitkk';

-- Unique index untuk username_wd (hanya jika tidak NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_wd ON public.profiles(username_wd) WHERE username_wd IS NOT NULL;


-- ============================================
-- 4. TABLE: wali_digital_lepaskan_request
-- Menyimpan permintaan lepas wali digital
-- ============================================
CREATE TABLE IF NOT EXISTS public.wali_digital_lepaskan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wakilan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone_baru TEXT,
    alasan TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES public.profiles(id),
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.wali_digital_lepaskan IS 'Permintaan lepas wali digital untuk user yang sudah punya HP sendiri';

CREATE INDEX IF NOT EXISTS idx_wali_lepaskan_status ON public.wali_digital_lepaskan(status);
CREATE INDEX IF NOT EXISTS idx_wali_lepaskan_wakilan ON public.wali_digital_lepaskan(wakilan_id);


-- ============================================
-- 5. RLS POLICIES untuk umat_staging
-- ============================================
ALTER TABLE public.umat_staging ENABLE ROW LEVEL SECURITY;

-- Siapa pun bisa SELECT umat_staging (data publik untuk matching registrasi)
CREATE POLICY "Anyone can read umat_staging"
    ON public.umat_staging FOR SELECT
    USING (true);

-- Hanya admin layer 5+ yang bisa INSERT/UPDATE/DELETE
CREATE POLICY "Admin can insert umat_staging"
    ON public.umat_staging FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

CREATE POLICY "Admin can update umat_staging"
    ON public.umat_staging FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

CREATE POLICY "Admin can delete umat_staging"
    ON public.umat_staging FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );


-- ============================================
-- 6. RLS POLICIES untuk wali_digital_log
-- ============================================
ALTER TABLE public.wali_digital_log ENABLE ROW LEVEL SECURITY;

-- Wali bisa melihat log untuk dirinya sendiri
CREATE POLICY "Wali can view own log"
    ON public.wali_digital_log FOR SELECT
    USING (wali_id = auth.uid());

-- Admin layer 5+ bisa melihat semua log
CREATE POLICY "Admin can view all wali log"
    ON public.wali_digital_log FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );


-- ============================================
-- 7. RLS POLICIES untuk wali_digital_lepaskan
-- ============================================
ALTER TABLE public.wali_digital_lepaskan ENABLE ROW LEVEL SECURITY;

-- Wakilan bisa melihat request-nya sendiri
CREATE POLICY "Wakilan can view own lepaskan"
    ON public.wali_digital_lepaskan FOR SELECT
    USING (wakilan_id = auth.uid());

-- Admin lingkungan (layer 4+) bisa melihat semua
CREATE POLICY "Admin can view all lepaskan"
    ON public.wali_digital_lepaskan FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4)
    );

-- Siapa pun bisa INSERT (trigger dari API)
CREATE POLICY "Anyone can insert lepaskan"
    ON public.wali_digital_lepaskan FOR INSERT
    WITH CHECK (true);

-- Admin lingkungan (layer 4+) bisa approve/reject
CREATE POLICY "Admin can update lepaskan"
    ON public.wali_digital_lepaskan FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 4)
    );


-- ============================================
-- 8. RLS POLICIES untuk profiles (tambahan)
-- ============================================

-- Wali digital bisa SELECT profil yang diwalikan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Wali digital lihat profil wakilan' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Wali digital lihat profil wakilan" ON public.profiles
            FOR SELECT USING (
                id = auth.uid()
                OR wali_digital_id = auth.uid()
                OR auth.uid() IN (SELECT wali_digital_id FROM public.profiles WHERE id = profiles.id)
            );
    END IF;
END $$;

-- Wali digital bisa UPDATE profil yang diwalikan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Wali digital edit profil wakilan' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Wali digital edit profil wakilan" ON public.profiles
            FOR UPDATE USING (
                wali_digital_id = auth.uid()
            );
    END IF;
END $$;


-- ============================================
-- 9. FUNCTION: generate_username_wd
-- Generate username untuk user wakilan
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_username_wd(
    p_nama_baptis TEXT,
    p_nama_lengkap TEXT,
    p_no_kk TEXT
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_kk_last4 TEXT;
    v_base_name TEXT;
    v_username TEXT;
    v_counter INTEGER := 0;
BEGIN
    -- Ambil 4 digit terakhir No_KK
    v_kk_last4 := RIGHT(p_no_kk, 4);
    
    -- Ambil nama baptis atau nama depan
    IF p_nama_baptis IS NOT NULL AND p_nama_baptis != '' AND p_nama_baptis != '-' THEN
        v_base_name := LOWER(SPLIT_PART(TRIM(p_nama_baptis), ' ', 1));
    ELSE
        v_base_name := LOWER(SPLIT_PART(TRIM(p_nama_lengkap), ' ', 1));
    END IF;
    
    -- Hapus karakter non-alfanumerik
    v_base_name := REGEXP_REPLACE(v_base_name, '[^a-z]', '', 'g');
    
    -- Generate username
    v_username := v_base_name || '@' || v_kk_last4;
    
    -- Handle duplikat
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username_wd = v_username) LOOP
        v_counter := v_counter + 1;
        v_username := v_base_name || v_counter || '@' || v_kk_last4;
    END LOOP;
    
    RETURN v_username;
END;
$$;

COMMENT ON FUNCTION public.generate_username_wd IS 'Generate username wakilan: nama_baptis@4digitkk';


-- ============================================
-- 10. FUNCTION: generate_password_wd
-- Generate password default untuk user wakilan
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_password_wd(p_no_kk TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_kk_last4 TEXT;
BEGIN
    v_kk_last4 := RIGHT(p_no_kk, 4);
    RETURN 'Klemen' || v_kk_last4;
END;
$$;

COMMENT ON FUNCTION public.generate_password_wd IS 'Password default Klemen + 4 digit KK';


-- ============================================
-- 11. FUNCTION: log_wali_digital_action
-- Function untuk insert log wali digital
-- ============================================
CREATE OR REPLACE FUNCTION public.log_wali_digital_action(
    p_wali_id UUID,
    p_wakilan_id UUID,
    p_aksi TEXT,
    p_detail TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.wali_digital_log (wali_id, wakilan_id, aksi, detail, ip_address)
    VALUES (p_wali_id, p_wakilan_id, p_aksi, p_detail, current_setting('request.headers')::json->>'x-forwarded-for')
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION public.log_wali_digital_action IS 'Catat aksi wali digital ke log';


-- ============================================
-- 12. FUNCTION: register_user_mandiri
-- Insert user mandiri ke auth.users + profiles
-- ============================================
CREATE OR REPLACE FUNCTION public.register_user_mandiri(
    p_phone TEXT,
    p_nama TEXT,
    p_keluarga_id UUID,
    p_hubungan TEXT,
    p_staging_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_profile_id UUID;
BEGIN
    -- Generate UUID untuk auth.users
    v_user_id := gen_random_uuid();
    
    -- Insert ke auth.users via trigger (asumsi trigger handle ini)
    -- Atau gunakan supabase.auth.admin.create_user() dari edge function
    -- Function ini akan dipanggil dari edge function, bukan langsung SQL
    
    -- Insert ke profiles
    INSERT INTO public.profiles (id, full_name, phone, role, access_layer, status, is_wali_digital)
    VALUES (v_user_id, p_nama, p_phone, 'umat', 2, 'active', TRUE)
    RETURNING id INTO v_profile_id;
    
    -- Insert ke anggota_keluarga
    INSERT INTO public.anggota_keluarga (keluarga_id, profile_id, hubungan_keluarga)
    VALUES (p_keluarga_id, v_profile_id, p_hubungan);
    
    -- Update umat_staging jika ada
    IF p_staging_id IS NOT NULL THEN
        UPDATE public.umat_staging
        SET status = 'registered', registered_profile_id = v_profile_id
        WHERE id = p_staging_id;
    END IF;
    
    RETURN v_profile_id;
END;
$$;


-- ============================================
-- 13. FUNCTION: register_user_wakilan
-- Insert user wakilan ke auth.users + profiles
-- ============================================
CREATE OR REPLACE FUNCTION public.register_user_wakilan(
    p_wali_id UUID,
    p_nama TEXT,
    p_nama_baptis TEXT,
    p_no_kk TEXT,
    p_keluarga_id UUID,
    p_hubungan TEXT,
    p_staging_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_profile_id UUID;
    v_email TEXT;
    v_username TEXT;
    v_password TEXT;
BEGIN
    v_user_id := gen_random_uuid();
    v_username := public.generate_username_wd(p_nama_baptis, p_nama, p_no_kk);
    v_password := public.generate_password_wd(p_no_kk);
    v_email := v_username || '@keluarga.paroki';
    
    -- Insert ke profiles
    INSERT INTO public.profiles (
        id, full_name, nama_baptis, phone, role, access_layer, status,
        wali_digital_id, is_wali_digital, username_wd
    )
    VALUES (
        v_user_id, p_nama, 
        CASE WHEN p_nama_baptis IS NOT NULL AND p_nama_baptis != '-' THEN p_nama_baptis ELSE NULL END,
        (SELECT phone FROM public.profiles WHERE id = p_wali_id),
        'umat', 2, 'active',
        p_wali_id, FALSE, v_username
    )
    RETURNING id INTO v_profile_id;
    
    -- Insert ke anggota_keluarga
    INSERT INTO public.anggota_keluarga (keluarga_id, profile_id, hubungan_keluarga)
    VALUES (p_keluarga_id, v_profile_id, p_hubungan);
    
    -- Update umat_staging
    IF p_staging_id IS NOT NULL THEN
        UPDATE public.umat_staging
        SET status = 'registered', registered_profile_id = v_profile_id
        WHERE id = p_staging_id;
    END IF;
    
    -- Log
    PERFORM public.log_wali_digital_action(p_wali_id, v_profile_id, 'tambah_wakilan', 'Registrasi via family registration');
    
    RETURN jsonb_build_object(
        'profile_id', v_profile_id,
        'username', v_username,
        'email', v_email,
        'password', v_password
    );
END;
$$;

COMMENT ON FUNCTION public.register_user_wakilan IS 'Daftarkan user wakilan. Return {profile_id, username, email, password}';


-- ============================================
-- 14. FUNCTION: check_umat_staging_by_nokk
-- Cari data umat_staging berdasarkan No_KK
-- ============================================
CREATE OR REPLACE FUNCTION public.check_umat_staging_by_nokk(p_no_kk TEXT)
RETURNS TABLE (
    staging_id UUID,
    nama TEXT,
    nama_baptis TEXT,
    jenis_kelamin CHAR(1),
    hubungan_keluarga TEXT,
    umur INTEGER,
    sudah_terdaftar BOOLEAN,
    registered_profile_id UUID,
    keluarga_id UUID,
    kepala_keluarga_nama TEXT,
    jumlah_anggota INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        us.id AS staging_id,
        us.nama,
        us.nama_baptis,
        us.jenis_kelamin,
        us.hubungan_keluarga,
        us.umur,
        us.registered_profile_id IS NOT NULL AS sudah_terdaftar,
        us.registered_profile_id,
        k.id AS keluarga_id,
        k.kepala_keluarga_nama,
        k.jumlah_anggota
    FROM public.umat_staging us
    JOIN public.keluarga k ON k.id = us.keluarga_id
    WHERE us.no_kk = p_no_kk
    ORDER BY
        CASE us.hubungan_keluarga
            WHEN 'kepala' THEN 1
            WHEN 'istri' THEN 2
            WHEN 'anak' THEN 3
            ELSE 4
        END,
        us.umur DESC;
END;
$$;

COMMENT ON FUNCTION public.check_umat_staging_by_nokk IS 'Cari anggota keluarga berdasarkan No_KK untuk ditampilkan saat registrasi';


-- ============================================
-- SELESAI
-- ============================================