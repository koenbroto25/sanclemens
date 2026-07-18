# Panduan Import Data Umat ke Supabase

## Ringkasan Masalah

File CSV asli `data_umat_supabase.csv` memiliki header yang **tidak sesuai** dengan skema tabel Supabase. File ini berisi 72 kolom yang mencampup data untuk beberapa tabel sekaligus.

## Solusi yang Disediakan

Script konversi telah membuat 3 file CSV yang siap di-import:

1. **profiles.csv** - Data profil umat (2804 baris)
2. **keluarga.csv** - Data keluarga (895 baris, unik)
3. **sakramen_records.csv** - Data sakramen (2018 baris)

## Langkah Import ke Supabase

### Persiapan
- Pastikan migrasi database sudah dijalankan (terutama `20260626120000_add_detailed_umat_data.sql`)
- Buat tabel di Supabase jika belum ada: `profiles`, `keluarga`, `sakramen_records`, `umat_details`

### Langkah 1: Import profiles.csv

1. Buka Supabase Dashboard → Table Editor
2. Pilih tabel **profiles**
3. Klik **Import data** → Upload CSV
4. Pilih file: `data/data_umat/profiles.csv`
5. Konfigurasi import:
   - Header row: ✓ Include header row
   - Encoding: UTF-8
   - Delimiter: Comma (,)
6. Klik **Import**

**Catatan Penting:**
- Kolom `id` harus berupa UUID yang valid
- Jika error karena UUID, Anda perlu membuat akun auth.users terlebih dahulu
- Atau kosongkan kolom `id` dan isi manual setelah import

### Langkah 2: Import keluarga.csv

1. Pilih tabel **keluarga**
2. Klik **Import data** → Upload CSV
3. Pilih file: `data/data_umat/keluarga.csv`
4. Konfigurasi sama seperti step 1
5. Klik **Import**

**Catatan:**
- Kolom `id` akan di-generate otomatis oleh Supabase (UUID)
- `no_kartu_keluarga` harus unik

### Langkah 3: Import sakramen_records.csv

1. Pilih tabel **sakramen_records**
2. Klik **Import data** → Upload CSV
3. Pilih file: `data/data_umat/sakramen_records.csv`
4. Klik **Import**

**Catatan:**
- Kolom `id` akan di-generate otomatis
- `user_id` harus merujuk ke `profiles.id` yang valid
- `sacrament_type` harus salah satu: baptis, komuni_pertama, penguatan, perkawinan

## Alternatif: Import via SQL

Jika import CSV gagal, gunakan SQL script:

```sql
-- Import profiles
INSERT INTO public.profiles (id, nama, jenis_kelamin, ...)
SELECT id, nama, jenis_kelamin, ...
FROM csvread('data_umat/profiles.csv');

-- Import keluarga
INSERT INTO public.keluarga (id, no_kartu_keluarga, alamat, ...)
SELECT gen_random_uuid(), no_kartu_keluarga, alamat, ...
FROM csvread('data_umat/keluarga.csv');

-- Import sakramen_records
INSERT INTO public.sakramen_records (user_id, sacrament_type, ...)
SELECT user_id, sacrament_type, ...
FROM csvread('data_umat/sakramen_records.csv');
```

## Verifikasi Import

Setelah import, verifikasi:

1. **Jumlah data:**
   ```sql
   SELECT COUNT(*) FROM profiles;  -- Harusnya: 2804
   SELECT COUNT(*) FROM keluarga;  -- Harusnya: 895
   SELECT COUNT(*) FROM sakramen_records;  -- Harusnya: 2018
   ```

2. **Cek data sampel:**
   ```sql
   -- Lihat 5 profil terbaru
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
   
   -- Lihat sakramen terbaru
   SELECT * FROM sakramen_records ORDER BY created_at DESC LIMIT 5;
   ```

## Troubleshooting

### Error: "Column doesn't exist"
- Pastikan tabel sudah dibuat dengan migrasi yang tepat
- Cek kembali nama kolom di CSV vs tabel Supabase

### Error: "Foreign key violation" (sakramen_records.user_id)
- Pastikan profiles sudah di-import terlebih dahulu
- Pastikan user_id ada di tabel profiles

### Error: "Duplicate key" (keluarga.no_kartu_keluarga)
- Cek apakah ada duplikasi no_kartu_keluarga
- Script sudah menghilangkan duplikasi, tapi bisa ada data existing

### Data tidak muncul di aplikasi
- Cek RLS policies
- Pastikan user_login terhubung ke profiles yang benar

## File yang Dihasilkan

```
data/data_umat/
├── data_umat_supabase.csv          # CSV asli (72 kolom)
├── converted_data.json             # Data dalam format JSON
├── profiles.csv                    # ✓ Siap import
├── keluarga.csv                    # ✓ Siap import
├── sakramen_records.csv            # ✓ Siap import
└── PANDUAN_IMPORT_SUPABASE.md      # File ini
```

## Script yang Digunakan

1. `scripts/convert_csv_to_supabase.py` - Konversi CSV ke JSON
2. `scripts/generate_import_csv.py` - Generate CSV per tabel

## Kontak

Jika ada masalah, hubungi tim development.