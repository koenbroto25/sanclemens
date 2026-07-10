# Fitur: Input Kolekte (Blind Dual-Entry)

## Overview
Fitur ini mengimplementasikan sistem input kolekte dengan mekanisme "Blind Dual-Entry", dirancang untuk meningkatkan akurasi dan transparansi pencatatan dana kolekte. Dua Bendahara yang berbeda akan memasukkan data kolekte secara independen, dan sistem akan memverifikasi konsistensi data.

## Detail Fitur

### 1. Mekanisme Blind Dual-Entry
*   **Akses:** Hanya Bendahara Lingkungan (Layer 6+) atau Bendahara Paroki (Layer 6+) yang memiliki akses.
*   **Proses Input:**
    *   Bendahara A memasukkan jumlah kolekte harian/mingguan.
    *   Bendahara B (yang berbeda) juga memasukkan jumlah kolekte yang sama secara independen tanpa melihat input Bendahara A.
    *   Sistem membandingkan kedua input.
*   **Validasi:**
    *   **Jika Cocok:** Transaksi kolekte dianggap valid dan dicatat.
    *   **Jika Tidak Cocok:** Sistem akan menandai perbedaan dan memerlukan rekonsiliasi oleh Supervisor (misal: Pastor atau Ketua Lingkungan).

### 2. Form Input Kolekte
*   **Input Form:**
    *   Tanggal Kolekte.
    *   Jenis Kolekte (Mingguan, Khusus, dll.).
    *   Jumlah Nominal Kolekte.
    *   Catatan (opsional).
*   **Proses:** Form dapat diakses melalui Dashboard Bendahara.

### 3. Proses Rekonsiliasi
*   **Trigger:** Input kolekte dari dua Bendahara tidak cocok.
*   **Aksi Sistem:** Notifikasi dikirim ke Supervisor yang relevan (sesuai lingkup lingkungan/paroki) tentang adanya perbedaan data.
*   **Aksi Supervisor:**
    *   Supervisor meninjau perbedaan data di dashboard rekonsiliasi.
    *   Supervisor dapat meminta klarifikasi dari Bendahara atau melakukan verifikasi fisik (misal: cek slip setoran bank).
    *   Supervisor memutuskan jumlah yang benar dan meng-approve rekonsiliasi.

### 4. Pelaporan Kolekte
*   **Akses:** Bendahara, Ketua Lingkungan, Bendahara Paroki, Pastor (sesuai lingkup dan layer akses).
*   **Laporan:** Menampilkan ringkasan kolekte (harian, mingguan, bulanan), status rekonsiliasi, dan tren.
*   **Dashboard:** Data kolekte terintegrasi dalam rekapitulasi keuangan di Dashboard Bendahara dan Dashboard Admin Portal 1/2.

## Integrasi
*   **Sistem Role-Based Access Control (RLS):** Memastikan hanya Bendahara yang berwenang yang dapat melakukan input, dan Supervisor untuk rekonsiliasi.
*   **Sistem Notifikasi:** Untuk pemberitahuan perbedaan data dan status rekonsiliasi.
*   **Dashboard Bendahara:** Integrasi untuk form input dan laporan.
*   **Dashboard Admin Portal 1/2:** Integrasi untuk ringkasan kolekte dan rekonsiliasi (bagi yang berwenang).

## API Endpoints (Contoh)
*   `POST /api/kolekte/input`: Bendahara A/B submit input kolekte.
*   `GET /api/kolekte/reconciliation`: Mengambil daftar kolekte yang perlu direkonsiliasi.
*   `POST /api/kolekte/reconciliation/approve`: Supervisor meng-approve rekonsiliasi.
*   `GET /api/kolekte/report`: Mengambil laporan kolekte.