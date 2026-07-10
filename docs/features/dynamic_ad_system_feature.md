# Fitur: Sistem Iklan Dinamis

## Overview
Fitur ini mengimplementasikan sistem untuk mengelola dan menampilkan iklan secara dinamis di berbagai lokasi strategis dalam ekosistem digital. Sistem ini mendukung berbagai jenis iklan (ucapan syukur, duka, mohon doa, premium umum, premium marketplace) dan menyediakan dashboard administrasi untuk pengelolaan.

## Detail Fitur

### 1. Jenis Iklan
*   **Iklan Umum (Non-Premium):**
    *   **Ucapan Syukur Umat:** Iklan berisi ucapan syukur dari umat.
    *   **Iklan Duka:** Pemberitahuan duka cita.
    *   **Mohon Doa:** Permohonan doa dari umat.
    *   **Manajemen:** Mungkin dikelola secara mandiri oleh umat (dengan approval ringan) atau melalui admin Komsos.
*   **Iklan Premium Umum (Selektif):**
    *   **Fokus:** Iklan layanan masyarakat paroki, acara khusus, atau pengusaha umat yang lolos seleksi.
    *   **Mode Tampilan:** Banner, card, pop-up ringan.
    *   **Manajemen:** Sepenuhnya dikelola oleh Admin Komsos/Super Admin.
*   **Iklan Premium Marketplace:**
    *   **Fokus:** Promosi produk atau seller di Pasar Kasih.
    *   **Manajemen:** Dikelola oleh Admin Marketplace/Super Admin.

### 2. Lokasi Penempatan Iklan
*   **Homepage Publik (`sanclemens.com`):** Satu space khusus antara bacaan dan ajakan bergabung. Umumnya untuk iklan non-premium atau premium umum.
*   **Gate Hub (setelah login):** Space untuk iklan umum premium (selektif), dengan berbagai mode tampilan. Target audiens adalah semua umat yang sudah login.
*   **Halaman Marketplace (`/pasar-kasih`):** Iklan premium khusus produk/seller marketplace.

### 3. Dashboard Manajemen Iklan (`/admin/ads`)
*   **Akses:** Admin Komsos (Layer 5+), Admin Marketplace (Layer 6+), Super Admin (Layer 10).
*   **Fungsionalitas:**
    *   **Daftar Iklan:** Menampilkan semua iklan dengan filter berdasarkan jenis, lokasi, status (aktif, pending, nonaktif), dan periode.
    *   **Buat/Edit Iklan:** Form untuk input detail iklan (konten, gambar, link, jenis, lokasi, periode tayang, target audiens).
    *   **Approval Iklan:** Admin Komsos/Marketplace dapat meng-approve atau menolak iklan pending.
    *   **Aktivasi/Non-aktivasi:** Mengaktifkan atau menonaktifkan iklan.
    *   **Statistik Iklan:** Menampilkan performa iklan (misal: jumlah tayangan, klik).

### 4. Logic Penayangan Iklan Dinamis
*   Sistem akan secara dinamis memilih dan menampilkan iklan berdasarkan:
    *   **Prioritas:** Iklan premium memiliki prioritas lebih tinggi.
    *   **Relevansi:** Bisa disesuaikan dengan konteks user (misal: iklan lingkungan tertentu untuk umat di lingkungan tersebut).
    *   **Penjadwalan:** Sesuai periode tayang yang ditentukan.
    *   **Rotasi:** Algoritma untuk merotasi iklan agar tidak monoton.

## Integrasi
*   **Admin Panel:** Dashboard khusus untuk manajemen iklan.
*   **Frontend Components:** Komponen UI yang fleksibel untuk menampilkan berbagai jenis iklan di berbagai lokasi.
*   **Database:** Tabel untuk menyimpan data iklan, status, dan statistik.
*   **Sistem Role-Based Access Control (RLS):** Untuk mengatur siapa yang dapat mengelola jenis iklan tertentu.

## API Endpoints (Contoh)
*   `GET /api/public/ads`: Mengambil iklan untuk homepage publik.
*   `GET /api/user/ads`: Mengambil iklan untuk Gate Hub/Portal.
*   `GET /api/marketplace/ads`: Mengambil iklan untuk halaman marketplace.
*   `POST /api/admin/ads`: Admin membuat iklan baru.
*   `PUT /api/admin/ads/[id]`: Admin mengedit iklan.
*   `POST /api/admin/ads/[id]/approve`: Admin meng-approve iklan.
*   `POST /api/admin/ads/[id]/deactivate`: Admin menonaktifkan iklan.