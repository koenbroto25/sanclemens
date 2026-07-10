# Definisi Peran: Admin Portal 1 (Paroki)

## Overview
Admin Portal 1 (Paroki) adalah peran administrator yang memiliki cakupan global di tingkat paroki. Peran ini bertanggung jawab untuk memantau, mengelola, dan mendukung operasional seluruh ekosistem digital dari perspektif paroki, dengan fokus pada data demografi, keuangan pastoral, kegiatan, dan komunikasi umum.

## Fitur dan Fungsionalitas Dashboard (`src/app/admin/paroki/dashboard/page.tsx`)

### 1. Dashboard Overview
*   **Statistik Utama:** Menampilkan ringkasan total user, total lingkungan, jumlah pengajuan pending (sakramen, admin baru), dan status kesehatan sistem umum.
*   **Grafik Demografi:** Visualisasi data demografi paroki (usia, jenis kelamin, distribusi lingkungan).
*   **Rekap Keuangan Pastoral:** Ringkasan pemasukan dan pengeluaran dana-dana pastoral (misal: dana duka, kolekte).

### 2. Pencarian Data Umat
*   **Panel Pencarian Umat:** Menyediakan `UmatSearchPanel` untuk mencari data umat berdasarkan nama, alamat, lingkungan, role, status, dll.
*   **Akses:** Dapat mencari seluruh data umat di Paroki Santo Klemens.
*   **Detail:** Hasil pencarian dapat menampilkan detail profil umat yang relevan sesuai RLS.

### 3. User & Role Management (Terbatas)
*   **Daftar Pengguna Aktif (View Only):** Melihat daftar semua umat terdaftar, dengan filter berdasarkan lingkungan, usia, dan status.
*   **Manajemen Role (View Only):** Melihat definisi role dan access layer yang ada.
*   **Approval Pengajuan Sakramen (via Sekretaris 1):** Memproses pengajuan sakramen yang telah disetujui KL, verifikasi dokumen, update status.

### 4. Monitoring Sistem (Ringkasan)
*   **Log Error Sistem (View Only):** Akses ringkasan log error.
*   **Status Cron Jobs (View Only):** Melihat status cron jobs penting.
*   **SOS Rekap:** Melihat rekapitulasi pengajuan SOS (tanpa detail pribadi), tren, dan status tindak lanjut.

### 5. Manajemen Konten & Data
*   **Manajemen Konten Publik:** Mengelola berita, pengumuman, jadwal misa, dan konten lain di homepage publik.
*   **Pengelolaan Data GAKIN (Semua Lingkungan):** Akses penuh untuk melihat, menambah, mengedit, dan mengubah status data GAKIN, serta mengelola alur approval 3 dari 4.
*   **Digital Vault Admin Panel:**
    *   **Verifikasi Dokumen:** Meninjau dan memverifikasi dokumen-dokumen yang diupload oleh umat (misal: KTP, KK, Surat Baptis) untuk pengajuan sakramen atau kelengkapan data.
    *   **Manajemen Dokumen:** Melihat daftar dokumen per umat, memastikan kelengkapan dan keaslian.
*   **Companion Admin Panel:** Memantau interaksi dengan Companion Rohani (statistik, topik populer, anomali), mengelola setelan umum AI.

### 6. Komunikasi & Notifikasi
*   **Broadcast Pesan:** Mengirim pesan ke seluruh umat paroki atau filter tertentu (misal: semua KL, semua umat lansia).
*   **Manajemen Notifikasi:** Mengelola template notifikasi sistem.

### 7. Settings
*   Pengaturan umum aplikasi tingkat paroki.

## Bot Support (Terintegrasi)
*   **Bot untuk Pencarian Data Umat:** Membantu admin mencari umat berdasarkan kriteria (nama, alamat, dll.) dan menampilkan hasil yang relevan.
*   **Bot untuk Query Data Paroki Kompleks:** Membantu admin mendapatkan statistik cepat, tren demografi, atau rekap kegiatan dengan perintah natural.
*   **Bot untuk Laporan Otomatis:** Membantu menghasilkan laporan mingguan/bulanan (demografi, keuangan, kegiatan) berdasarkan kriteria yang diberikan.
*   **Bot untuk Manajemen Konten:** Membantu draft pengumuman, berita, atau mengelola jadwal.
*   **Bot untuk Verifikasi Digital Vault:** Membantu proses verifikasi dokumen dengan menganalisis kesesuaian data yang diupload dengan informasi profil.

## Integrasi Kunci
*   **Digital Vault:** Untuk manajemen dokumen umat.
*   **Sistem Notifikasi:** Untuk komunikasi internal dan eksternal.
*   **API Pengajuan Sakramen:** Untuk memproses pengajuan sakramen lebih lanjut.

## Perubahan dari v3.3
*   Cakupan manajemen GAKIN yang lebih luas.
*   Integrasi `Digital Vault` dan `Companion Admin Panel`.
*   Dukungan bot untuk otomatisasi dan bantuan.
*   Fokus pada dashboard terpusat.
*   **Penambahan fitur Pencarian Data Umat.**
