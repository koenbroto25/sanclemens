# Panduan: Klasifikasi Otomatis Umat ke Lingkungan (Paroki St. Klemens Sepinggan)

Paket ini berisi sistem klasifikasi 3 lapis: (1) kata kunci wilayah dari SK Ketua
Lingkungan — gratis & instan, (2) geocoding + poligon sebagai cross-check/fallback,
(3) flag manual otomatis lengkap dengan kontak ketua lingkungan untuk kasus ambigu.

| File | Fungsi |
|---|---|
| `lingkungan_sepinggan.geojson` | Batas wilayah 17 lingkungan, hasil konversi dari KML paroki |
| `kamus_wilayah.json` | Kamus kata kunci per lingkungan (dipakai skrip) — jangan diubah manual, edit lewat versi Excel-nya lalu re-export jika perlu |
| `kamus_wilayah_lingkungan.xlsx` | Versi Excel kamus di atas — mudah dibaca/ditambah oleh staf paroki. Berisi nama lingkungan, ketua/koordinator, kontak, dan daftar kata kunci wilayah (jalan/perumahan/patokan) |
| `geocode_klasifikasi_lingkungan_v2.py` | Skrip utama: jalankan Lapis 1 → 2 → 3 sekaligus |
| `data_umat-alamat.xlsx` | Data umat (taruh di folder yang sama dengan skrip) |

### Tentang Lapis 1 (kata kunci) — sudah saya uji coba terhadap 2.804 data Anda:

- **967 data (34,5%)** langsung pasti terklasifikasi tanpa perlu API sama sekali.
- **49 data (1,7%)** ambigu karena memang ada wilayah yang disebut tumpang tindih
  di SK (mis. "Kartini Residence" disebut di dua lingkungan) — otomatis diberi
  kontak kedua ketua lingkungan terkait.
- **1.788 data (63,8%)** sisanya akan diproses Lapis 2 (geocoding) saat skrip dijalankan dengan API key.

---

## 1. Membuat API Key Google Geocoding (gratis untuk kebutuhan ini)

1. Buka https://console.cloud.google.com/ lalu buat project baru (atau pakai yang sudah ada).
2. Aktifkan **billing** (wajib didaftarkan kartu kredit/debit, tapi TIDAK akan tertagih selama masih di bawah kuota gratis bulanan ±10.000 permintaan/bulan — data umat 2.804 baris jauh di bawah itu).
3. Di menu **APIs & Services > Library**, cari **Geocoding API**, klik **Enable**.
4. Di menu **APIs & Services > Credentials**, klik **Create Credentials > API Key**.
5. (Disarankan) Batasi API key tersebut supaya hanya bisa dipakai untuk Geocoding API, lewat tombol **Restrict Key**.
6. **Penting**: di menu **Quotas**, set limit harian (misal 3000/hari) supaya kalau ada error/looping tidak membengkak otomatis.
7. Salin API key yang muncul.

## 2. Persiapan di komputer

1. Install Python 3 (jika belum ada): https://www.python.org/downloads/
2. Buka Command Prompt / Terminal, install library yang dibutuhkan:
   ```
   pip install openpyxl shapely requests
   ```
3. Taruh ketiga file (`geocode_klasifikasi_lingkungan.py`, `lingkungan_sepinggan.geojson`, `data_umat-alamat.xlsx`) dalam satu folder yang sama.

## 3. Menjalankan skrip

1. Buka file `geocode_klasifikasi_lingkungan_v2.py` dengan text editor (Notepad cukup).
2. Cari baris:
   ```python
   API_KEY = "ISI_API_KEY_GOOGLE_ANDA_DI_SINI"
   ```
   Ganti dengan API key yang sudah dibuat di langkah 1.
3. Simpan, lalu jalankan dari terminal:
   ```
   python geocode_klasifikasi_lingkungan_v2.py
   ```
4. Skrip akan menjalankan Lapis 1 dulu untuk semua data (instan), lalu lanjut Lapis 2 (geocoding) hanya untuk data yang belum pasti dari Lapis 1 — sehingga jauh lebih hemat kuota & waktu dibanding geocoding semua 2.804 data dari awal. Progres ditampilkan tiap 100 data dan disimpan bertahap.

## 4. Membaca hasil

File baru `data_umat-alamat_HASIL.xlsx` akan berisi semua kolom asli ditambah:

- **Lingkungan_KataKunci** — hasil Lapis 1 (kosong jika tidak ketemu kata kunci, atau "AMBIGU: ..." jika cocok ke lebih dari satu lingkungan)
- **Lingkungan_Geocoding** — hasil Lapis 2 lewat koordinat & poligon
- **Lingkungan_Final** — keputusan akhir gabungan, inilah kolom utama yang dipakai
- **Tingkat_Keyakinan** — TINGGI (kedua metode sepakat / kata kunci jelas), SEDANG (hanya satu metode berhasil), atau PERLU_CEK_MANUAL
- **Kontak_Untuk_Konfirmasi** — nama & no. HP ketua lingkungan kandidat, otomatis terisi untuk baris PERLU_CEK_MANUAL
- **Latitude / Longitude / Status_Geocode** — detail teknis hasil geocoding, untuk verifikasi

Baris **hijau** = keyakinan tinggi (siap pakai). Baris **kuning** = perlu dicek manual — tinggal lihat kolom Kontak_Untuk_Konfirmasi dan hubungi ketua lingkungan terkait.

## Catatan akurasi

Karena banyak alamat umat ditulis tanpa konteks lengkap (hanya nama jalan + RT), sebagian hasil geocoding mungkin meleset terutama di area padat gang-gang kecil. Kamus kata kunci (Lapis 1) sudah diuji terhadap data Anda: 34,5% data langsung pasti tanpa API, dan hanya 1,7% yang benar-benar ambigu (karena memang ada wilayah tumpang tindih di SK Ketua Lingkungan sendiri, bukan kesalahan sistem). Disarankan kamus ini terus dilengkapi seiring waktu — kalau ada nama jalan/perumahan kecil yang sering muncul di data tapi belum ada di kamus, tinggal tambahkan barisnya di `kamus_wilayah_lingkungan.xlsx` (lalu minta dikonversi ulang ke `kamus_wilayah.json`).
