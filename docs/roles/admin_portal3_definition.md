# Definisi Peran: Admin Portal 3 (Marketplace)

## Overview
Admin Portal 3 (Marketplace) adalah peran administrator yang bertanggung jawab untuk mengelola operasional Pasar Kasih, platform ekonomi internal paroki. Peran ini berfokus pada manajemen produk, seller, buyer, transaksi, dan promosi di marketplace.

## Fitur dan Fungsionalitas Dashboard (`src/app/admin/marketplace/dashboard/page.tsx`)

### 1. Dashboard Overview Marketplace
*   **Statistik Utama:** Menampilkan ringkasan total seller, total produk aktif, jumlah transaksi bulan ini, dan total pendapatan marketplace.
*   **Grafik Penjualan:** Visualisasi tren penjualan per kategori produk atau per seller.

### 2. Pencarian Data Umat
*   **Panel Pencarian Umat:** Menyediakan `UmatSearchPanel` untuk mencari data umat berdasarkan peran di marketplace (seller, buyer, ojek), nama, alamat, dll.
*   **Akses:** Hanya dapat mencari dan melihat data umat yang relevan dengan partisipasi di marketplace (misal: seller, buyer, ojek solidaritas).
*   **Detail:** Hasil pencarian dapat menampilkan detail profil umat yang diperlukan untuk operasional marketplace.

### 3. Manajemen Seller & Buyer
*   **Daftar Seller:** Melihat daftar semua seller terdaftar, status keaktifan, dan riwayat penjualan.
    *   **Aksi:** Meng-approve/menolak pendaftaran seller, menonaktifkan seller.
*   **Daftar Buyer:** Melihat daftar buyer, riwayat pembelian.
*   **Customer Support:** Menangani keluhan atau pertanyaan dari seller dan buyer.

### 4. Manajemen Produk
*   **Katalog Produk:** Mengelola semua produk yang terdaftar di marketplace.
    *   **Aksi:** Menambah, mengedit, menghapus produk.
    *   **Moderasi Produk:** Meninjau dan meng-approve/menolak produk baru atau produk yang diupdate oleh seller.
*   **Kategori Produk:** Mengelola kategori dan sub-kategori produk.

### 5. Manajemen Transaksi
*   **Daftar Transaksi:** Melihat semua riwayat transaksi, status pembayaran, dan status pengiriman.
*   **Rekonsiliasi Pembayaran:** Memverifikasi pembayaran melalui integrasi Xendit.
*   **Penyelesaian Sengketa:** Menangani perselisihan antara seller dan buyer.

### 6. Manajemen Iklan Marketplace
*   **Pengelolaan Iklan Premium:** Mengelola dan menjadwalkan iklan premium yang ditempatkan di halaman marketplace (via `Ad Management Page`).

### 7. Settings
*   Pengaturan umum marketplace (misal: komisi, biaya layanan, kebijakan).

## Bot Support (Terintegrasi)
*   **Bot untuk Pencarian Data Umat:** Membantu admin mencari umat berdasarkan peran di marketplace, terbatas pada data yang relevan.
*   **Bot untuk Moderasi Produk:** Membantu admin meninjau produk baru atau yang diupdate secara otomatis berdasarkan kebijakan marketplace, mengidentifikasi produk terlarang atau tidak sesuai.
*   **Bot untuk Support Seller/Buyer:** Menangani pertanyaan umum dari seller/buyer, memberikan panduan, atau mengarahkan ke admin jika masalah kompleks.
*   **Bot untuk Monitoring Transaksi:** Memberikan notifikasi otomatis tentang transaksi mencurigakan, pembayaran gagal, atau keterlambatan pengiriman.
*   **Bot untuk Laporan Penjualan:** Membantu menghasilkan laporan penjualan per seller, per produk, atau rekapitulasi harian/mingguan.

## Integrasi Kunci
*   **Sistem Pembayaran (Xendit):** Untuk proses pembayaran dan rekonsiliasi.
*   **Sistem Ojek Internal:** Untuk proses pengiriman pesanan.
*   **Digital Vault:** Untuk verifikasi dokumen seller (jika diperlukan).
*   **Sistem Notifikasi:** Untuk komunikasi dengan seller dan buyer.
*   **Sistem Iklan Dinamis:** Untuk mengelola penempatan iklan premium di marketplace.
