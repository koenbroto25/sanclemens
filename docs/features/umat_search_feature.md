# Fitur: Pencarian Data Umat

## Overview
Fitur pencarian data umat memungkinkan pengurus (Admin, Ketua Lingkungan, Pengurus Lingkungan) untuk mencari dan melihat informasi umat berdasarkan berbagai kriteria. Sistem ini dilengkapi dengan Role-Based Access Control (RLS) untuk memastikan bahwa setiap pengurus hanya dapat mengakses data yang relevan dengan wilayah tugasnya.

## Tujuan
- Memudahkan pengurus dalam menemukan data umat secara cepat dan efisien.
- Mendukung tugas-tugas administratif dan pastoral yang memerlukan akses ke data umat.
- Memastikan keamanan dan privasi data dengan pembatasan akses yang ketat.

## Cakupan Pencarian
Pencarian dapat dilakukan berdasarkan parameter berikut:
- **Nama Lengkap:** Nama resmi umat.
- **Nama Panggilan:** Nama yang biasa digunakan umat.
- **Nama Baptis:** Nama baptis umat.
- **Nomor WhatsApp:** Nomor telepon yang terdaftar.
- **Alamat:** Alamat tempat tinggal umat.
- **Lingkungan:** Lingkungan tempat umat terdaftar.
- **Role / Jabatan:** Peran umat dalam ekosistem (misal: Umat Aktif, Ketua Lingkungan, Bendahara, dll.).
- **Status Umat:** Status keaktifan atau kategori umat (misal: Aktif, Belum Verifikasi, Meninggal, Pindah).
- **Paroki:** Paroki tempat umat terdaftar (terutama untuk admin paroki/super admin).
- **Data Keluarga Terkait:** Informasi anggota keluarga.

## Pembatasan Akses (RLS)
Akses terhadap hasil pencarian data umat akan sangat dibatasi berdasarkan `access_layer` dan role pengguna yang melakukan pencarian:

- **Super Admin / DPP / Sekretaris Paroki (Access Layer 5-10):**
    - Dapat mencari dan melihat seluruh data umat di Paroki Santo Klemens.
    - Detail data yang dapat dilihat meliputi semua informasi yang tersedia (nama, alamat, kontak, data keluarga, riwayat sakramen, dll.), kecuali data sangat sensitif yang mungkin memiliki enkripsi E2E.
- **Ketua Lingkungan / Pengurus Lingkungan (Access Layer 4):**
    - Hanya dapat mencari dan melihat data umat yang terdaftar di lingkungan yang menjadi tanggung jawabnya.
    - Detail data yang dapat dilihat meliputi informasi relevan untuk pengelolaan lingkungan (nama, alamat, kontak, status keaktifan, data keluarga dasar).
- **Admin Portal 3 (Marketplace) (Access Layer 6-7):**
    - Hanya dapat mencari dan melihat data umat yang relevan dengan partisipasi di marketplace (misal: seller, buyer, ojek solidaritas).
    - Detail data terbatas pada informasi yang diperlukan untuk operasional marketplace (nama, kontak untuk pengiriman/transaksi, alamat pengiriman).
- **Wali Digital Lingkungan (Access Layer 3):**
    - Hanya dapat mencari dan melihat data umat yang didelegasikan kepadanya atau yang telah memberikan persetujuan eksplisit untuk dibina.
- **Umat Biasa (Access Layer 2):**
    - Tidak memiliki akses untuk mencari data umat lain. Hanya dapat melihat data profil dirinya sendiri dan anggota keluarganya yang terhubung.

## Lokasi Fitur
- **Dashboard Pengurus (Frontend):**
    - `src/app/super-admin/dashboard/page.tsx`
    - `src/app/admin/paroki/dashboard/page.tsx` (akan dibuat)
    - `src/app/lingkungan/[slug]/kl/page.tsx` (Ketua Lingkungan)
    - `src/app/lingkungan/[slug]/pengurus/page.tsx` (Pengurus Lingkungan, akan dibuat)
    - `src/app/admin/marketplace/dashboard/page.tsx` (akan dibuat)
- **Bot System (Backend):**
    - Bot yang diizinkan (selain Bot Publik, Companion Rohani, Belajar Katolik) akan memiliki tool AI khusus untuk melakukan pencarian data umat melalui API backend.

## Implementasi Teknis

### Frontend
- **Komponen Pencarian:** Pengembangan komponen `UmatSearchPanel.tsx` yang mencakup:
    - Input pencarian (teks bebas, filter dropdown untuk lingkungan, role, status, dll.).
    - Tabel hasil pencarian dengan kolom yang dapat disesuaikan.
    - Pagginasi dan sorting.
    - Tampilan detail umat (modal/halaman terpisah) dengan pembatasan data.
- **Integrasi ke Dashboard:** Komponen `UmatSearchPanel` akan diimpor dan digunakan di halaman dashboard yang relevan.

### Backend (API)
- **Endpoint API Baru:**
    - `GET /api/umat/search`: Untuk menerima parameter pencarian dan mengembalikan daftar umat yang sesuai, dengan penerapan RLS di sisi server.
    - `GET /api/umat/:id`: Untuk mengambil detail profil umat tertentu, juga dengan RLS.
- **Database Query:** Menggunakan Supabase Client atau Edge Functions untuk melakukan query ke tabel `public.profiles` dan `public.families` (atau tabel relevan lainnya yang menyimpan data umat), dengan filter dan JOIN yang sesuai.

### Bot AI (AI Tool)
- **Definisi Tool AI:** Menambahkan tool `search_umat` di sistem AI.
    - **Input:** Nama, alamat, lingkungan, role, dll.
    - **Output:** Daftar nama umat yang cocok, lingkungan, dan informasi dasar lainnya.
- **RLS untuk Bot:** Penting untuk memastikan bahwa `search_umat` tool juga mematuhi RLS berdasarkan identitas pengguna (role/access_layer) yang menginisiasi interaksi dengan bot.
- **Audit Log:** Setiap penggunaan tool `search_umat` oleh bot akan dicatat ke dalam audit log, mencakup:
    - ID bot
    - Query yang digunakan
    - ID pengguna yang berinteraksi dengan bot
    - Hasil yang ditampilkan (ringkasan).

## Security & Privacy
- **Row Level Security (RLS):** RLS akan menjadi pilar utama keamanan data, memastikan data hanya dapat diakses oleh user dengan izin yang tepat.
- **Data Masking/Redaction:** Beberapa data sensitif mungkin perlu di-masking atau di-redact di frontend jika tidak relevan dengan role pengguna yang melihatnya (misal: nomor KTP, detail finansial).
- **Audit Logging:** Pencatatan setiap akses dan tindakan akan membantu dalam pelacakan dan kepatuhan.
- **Enkripsi:** Data sensitif tertentu (jika ada) harus disimpan dalam keadaan terenkripsi di database.