# Definisi Peran: Admin Portal 2 (Lingkungan)

## Overview
Admin Portal 2 (Lingkungan), yang utamanya diemban oleh Ketua Lingkungan (KL), adalah peran administrator yang berfokus pada pengelolaan dan dukungan komunitas di tingkat lingkungan. Peran ini sangat vital dalam memastikan kelancaran operasional harian dan kesejahteraan umat di lingkungannya.

## Fitur dan Fungsionalitas Dashboard (`src/app/lingkungan/[slug]/kl/page.tsx` atau `src/app/lingkungan/[slug]/pengurus/page.tsx`)

### 1. Dashboard Overview Lingkungan
*   **Statistik Utama Lingkungan:** Menampilkan ringkasan total umat di lingkungan, jumlah umat baru pending, status cek lansia harian, dan ringkasan keuangan lingkungan.
*   **Grafik Keaktifan:** Visualisasi partisipasi umat dalam kegiatan lingkungan, iuran, dan doa.

### 2. Pencarian Data Umat
*   **Panel Pencarian Umat:** Menyediakan `UmatSearchPanel` untuk mencari data umat berdasarkan nama, alamat, role, status, dll.
*   **Akses:** Hanya dapat mencari dan melihat data umat yang terdaftar di lingkungan yang menjadi tanggung jawabnya.
*   **Detail:** Hasil pencarian dapat menampilkan detail profil umat yang relevan sesuai RLS.

### 3. User & Umat Management (Fokus Lingkungan)
*   **Daftar Anggota Lingkungan:** Melihat daftar semua umat di lingkungannya, dengan detail profil dan status keaktifan.
*   **Approval Umat Baru Lingkungan:** Meninjau dan meng-approve/menolak pendaftaran umat baru yang masuk ke lingkungannya.
*   **Pengaturan Profil Umat:** Mengedit data dasar umat di lingkungannya (dengan batasan).
*   **Manajemen Permohonan Perubahan Alamat:** Menerima dan memproses pengajuan perubahan alamat dari umat di lingkungannya, termasuk pindah rumah atau pindah lingkungan.

### 4. Kegiatan & Komunikasi Lingkungan
*   **Manajemen Kegiatan Lingkungan:** Mengelola jadwal kegiatan, daftar peserta, dan laporan pertanggungjawaban (LPJ) kegiatan.
*   **Pengajuan Surat & Permohonan:** Menerima dan memproses pengajuan surat pengantar dari umat (misal: surat pengantar ke gereja lain), permohonan doa, atau permohonan dana kasih.
*   **Broadcast Pesan:** Mengirim pesan ke seluruh anggota lingkungan via in-app atau WhatsApp.

### 5. Keuangan Lingkungan
*   **Tagihan & Iuran Lingkungan:** Mengelola status iuran umat (cek lunas/tertunggak), mencatat pembayaran, dan melihat rekapitulasi.
*   **Laporan Keuangan Lingkungan:** Melihat mutasi kas dan laporan sederhana keuangan lingkungan.

### 6. Fitur Pastoral & Solidaritas
*   **Cek Lansia Harian:** Memantau status cek lansia harian, melakukan follow-up untuk yang belum respons, dan eskalasi jika diperlukan.
*   **Approval Pengajuan Sakramen:** Meninjau dan meng-approve/menolak pengajuan sakramen dari umat di lingkungannya, serta menerbitkan Surat Pengantar Elektronik ke Sekretaris 1 Gereja.
*   **MatchingBoard Klemen Kerja:** Melihat rekomendasi matching antara lowongan kerja dan tenaga kerja di lingkungannya, serta memvalidasi donasi/bantuan (jika confidence matching rendah).
*   **Data GAKIN Lingkungan:** Akses penuh untuk melihat, menambah, mengedit, dan mengubah status data GAKIN di lingkungannya, serta berpartisipasi dalam alur approval 3 dari 4.

### 7. Settings
*   Pengaturan spesifik untuk lingkungan (misal: nama KL, alamat sekretariat lingkungan).

## Bot Support (Terintegrasi)
*   **Bot untuk Pencarian Data Umat:** Membantu admin mendapatkan informasi cepat tentang umat (misal: siapa yang belum bayar iuran, daftar lansia yang belum cek pagi), terbatas pada lingkungan tugas.
*   **Bot untuk Entri Data Umat Baru/Sakramen:** Membantu proses entri data awal atau memandu KL dalam proses approval.
*   **Bot untuk Broadcast Pesan:** Membantu KL menyusun dan mengirim pengumuman/ajakan kegiatan ke anggota lingkungan.
*   **Bot untuk Insight Kegiatan/Keuangan:** Memberikan ringkasan otomatis tentang partisipasi kegiatan atau status keuangan lingkungan.

## Integrasi Kunci
*   **Sistem Notifikasi:** Untuk komunikasi dengan umat dan Sekretaris 1.
*   **API Pengajuan Sakramen:** Untuk memproses pengajuan sakramen.
*   **API Klemen Kerja:** Untuk fitur matching dan validasi.
*   **Digital Vault:** Untuk verifikasi dokumen umat.
*   **Manajemen Lokasi & Alamat Umat:** Untuk memproses pengajuan perubahan alamat.
