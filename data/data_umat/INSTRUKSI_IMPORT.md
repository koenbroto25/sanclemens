# INSTRUKSI IMPORT DATA KE SUPABASE

## Validasi

File CSV sudah diverifikasi sesuai skema tabel Supabase:

**profiles.csv** (2804 baris)
- Kolom: full_name, gender, place_of_birth, date_of_birth, blood_type, phone, email, alamat_lengkap, kelurahan, kecamatan, kota, provinsi, kondisi_kesehatan, status_perkawinan, keterampilan, status_aktivitas_sosial, updated_by_text, nik

**sakramen_records.csv** (2018 baris)
- Kolom: user_id, sacrament_type, date_received, paroki_received, keuskupan_received, minister, book_number, notes, sponsors

## Masukkan Import

### KARENA user_id ADALAH ANGKA (bukan UUID)
Kita perlu pendekatan khusus karena kolom `id` di CSV asli adalah angka, bukan UUID.

## OPSI 1: Import via SQL Script (Disarankan)

Langkah-langkah:

1. **Buka Supabase Dashboard** → SQL Editor

2. **Jalankan script ini untuk membuat tabel staging dan import data:**

```sql
-- 1. Buat tabel temporary untuk profiles (tanpa FK ke auth.users)
CREATE TEMP TABLE temp_profiles (
    full_name TEXT,
    gender TEXT,
    place_of_birth TEXT,
    date_of_birth DATE,
    blood_type TEXT,
    phone TEXT,
    email TEXT,
    alamat_lengkap TEXT,
    kelurahan TEXT,
    kecamatan TEXT,
    kota TEXT,
    provinsi TEXT,
    kondisi_kesehatan TEXT,
    status_perkawinan TEXT,
    keterampilan TEXT[],
    status_aktivitas_sosial TEXT,
    updated_by_text TEXT,
    nik TEXT,
    old_id INTEGER
);

-- 2. Import data dari CSV
-- Catatan: Anda perlu upload file CSV ke Supabase Storage terlebih dahulu
-- atau copy-paste data

-- 3. Setelah import ke temp_profiles, jalankan:
INSERT INTO public.profiles (
    full_name, gender, place_of_birth, date_of_birth, blood_type,
    phone, email, alamat_lengkap, kelurahan, kecamatan, kota, provinsi,
    kondisi_kesehatan, status_perkawinan, keterampilan, 
    status_aktivitas_sosial, updated_by_text, nik
)
SELECT 
    full_name, gender, place_of_birth, date_of_birth, blood_type,
    phone, email, alamat_lengkap, kelurahan, kecamatan, kota, provinsi,
    kondisi_kesehatan, status_perkawinan, keterampilan,
    status_aktivitas_sosial, updated_by_text, nik
FROM temp_profiles;

-- 4. Insert sakramen_records (akan ada error FK, tapi data sudah masuk)
INSERT INTO public.sakramen_records (
    user_id, sacrament_type, date_received, paroki_received,
    keuskupan_received, minister, book_number, notes, sponsors
)
SELECT 
    user_id, sacrament_type, date_received, paroki_received,
    keuskupan_received, minister, book_number, notes, sponsors
FROM temp_sakramen;

-- 5. Update user_id yang null setelah relasi dibuat
UPDATE public.sakramen_records sr
SET user_id = p.id
FROM public.profiles p
WHERE p.old_id = sr.user_id::INTEGER;
```

## OPSI 2: Import Manual dengan UUID Baru (Paling Mudah)

Karena `id` di CSV adalah angka (36455, 36463, dst) dan bukan UUID, kita perlu:

### Langkah 1: Import profiles tanpa kolom id

1. Buka **profiles.csv** dengan text editor
2. **HAPUS kolom `id`** dari header dan semua data
3. Save sebagai `profiles_no_id.csv`
4. Import ke Supabase → Table Editor → profiles
5. Centang "Generate UUID automatically"

### Langkah 2: Catat mapping ID lama ke UUID baru

Buat tabel mapping:

```sql
-- Buat tabel mapping
CREATE TABLE IF NOT EXISTS id_mapping (
    old_id INTEGER PRIMARY KEY,
    new_uuid UUID NOT NULL
);

-- Isi dengan contoh:
INSERT INTO id_mapping (old_id, new_uuid) VALUES (36455, 'uuid-yang-dibuat-otomatis');
-- ... untuk semua data
```

Atau export dari Supabase:

```sql
-- Export mapping
SELECT nik, full_name, id FROM profiles ORDER BY created_at;
-- Simpan matching dengan manual atau Excel
```

### Langkah 3: Import sakramen_records

1. Edit **sakramen_records.csv**:
   - Ganti kolom `user_id` dari angka lama ke UUID baru sesuai mapping
   - Atau kosongkan dulu, lalu update dengan SQL

2. Import ke Supabase → Table Editor → sakramen_records

## OPSI 3: Script Import Otomatis (Paling Teknis)

Buat script Node.js/Python untuk:

1. Baca profiles.csv
2. Insert ke Supabase via API → dapat UUID baru
3. Buat mapping old_id → new_uuid
4. Update sakramen_records.csv dengan UUID baru
5. Insert sakramen_records ke Supabase

## Rekomendasi

**Gunakan OPSI 2** (Import Manual dengan UUID Baru) karena:

1. Lebih cepat dan mudah
2. Tidak perlu tools tambahan
3. Data aman masuk ke tabel
4. Relasi bisa dibuat nanti dengan SQL

## Setelah Import

### Verifikasi Data

```sql
-- Cek jumlah data
SELECT COUNT(*) FROM profiles;  -- Harusnya: 2804
SELECT COUNT(*) FROM sakramen_records;  -- Harusnya: 2018

-- Cek sample
SELECT * FROM profiles LIMIT 5;
SELECT * FROM sakramen_records LIMIT 5;

-- Cek sakramen per jenis
SELECT 
    sacrament_type,
    COUNT(*) as jumlah,
    MIN(date_received) as terlama,
    MAX(date_received) as terbaru
FROM sakramen_records
GROUP BY sacrament_type
ORDER BY jumlah DESC;
```

### Troubleshooting

**Error: "duplicate key value violates unique constraint"**
- NIK mungkin duplikat. Cek dulu:
```sql
SELECT nik, COUNT(*) 
FROM profiles 
GROUP BY nik 
HAVING COUNT(*) > 1;
```

**Error: "foreign key violation" di sakramen_records**
- Karena user_id masih angka lama. Solusi:
```sql
-- Update user_id dengan mapping manual
UPDATE sakramen_records sr
SET user_id = (
    SELECT p.id 
    FROM profiles p 
    WHERE p.nik = (
        SELECT p2.nik 
        FROM profiles p2 
        WHERE p2.phone = sr.user_id::TEXT
    )
)
WHERE EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.phone = sr.user_id::TEXT
);
```

**Keterampilan kosong**
- Kolom keterampilan adalah array, pastikan format CSV benar: `["Mengecat"]` atau `Mengecat;Cat` 

## File yang Sudah Siap

```
data/data_umat/
├── profiles.csv               ✓ Header sesuai tabel profiles
├── sakramen_records.csv       ✓ Header sesuai tabel sakramen_records
├── PANDUAN_IMPORT_SUPABASE.md
├── import_to_supabase.sql     - Script SQL helper
└── INSTRUKSI_IMPORT.md        - File ini
```

## Catatan Penting

1. **Tabel keluarga**: Belum di-import karena skema berbeda (migration 060 pakai `no_kk`, migration 026 pakai `no_kartu_keluarga`)
2. **Kolom id**: Diabaikan karena harus UUID dan merujuk ke auth.users
3. **NIK**: Ada unique constraint, jika ada duplikat akan error
4. **Gender**: Harus 'L' atau 'P' (sudah sesuai)

## Langkah Cepat

1. Import `profiles.csv` ke tabel profiles
2. Buat mapping old_id → new_uuid (Excel/csv)
3. Update `sakramen_records.csv` dengan UUID baru
4. Import `sakramen_records.csv` ke tabel sakramen_records
5. Verifikasi dengan query sample

SELESAI!