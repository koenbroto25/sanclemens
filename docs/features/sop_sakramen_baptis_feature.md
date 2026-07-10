# Fitur: SOP Sakramen Baptis

## Overview
Fitur ini mengelola alur pendaftaran Sakramen Baptis (Bayi/Anak dan Dewasa) secara digital, mencakup pengecekan kelengkapan data, pengajuan online, approval Ketua Lingkungan (KL), hingga penerbitan surat pengantar elektronik ke Sekretaris 1 Gereja.

## Detail Fitur

### 1. Pengecekan Kelengkapan Data Umat
*   **Trigger:** Umat (orang tua/calon baptis dewasa) mengakses halaman pendaftaran Sakramen Baptis.
*   **Aksi Sistem:** Memverifikasi kelengkapan data pribadi umat/anak di database, termasuk status upload dokumen yang diperlukan di `Digital Vault`.
*   **Kondisi:**
    *   **Data Lengkap:** Umat dapat melanjutkan ke form pengajuan.
    *   **Data Belum Lengkap:** Umat diarahkan ke halaman kelengkapan data (`/data-completion`) dengan notifikasi.
*   **Notifikasi:** Notifikasi periodik (in-app, WA) akan dikirim jika data belum lengkap.

### 2. Form Pengajuan Sakramen Baptis Online
*   **Akses:** Umat yang datanya sudah lengkap.
*   **Tipe Pendaftaran:** Pilihan antara "Baptis Bayi/Anak" atau "Baptis Dewasa".

#### 2.1. Untuk Baptis Bayi/Anak
*   **Input Form:**
    *   **Data Anak:** Nama Lengkap, Tanggal Lahir, Tempat Lahir, Rencana Nama Baptis.
    *   **Data Orang Tua:** Nama Ayah, Nama Ibu, Status Pernikahan (Gereja/Sipil).
    *   **Data Wali Baptis:** Nama Lengkap, No WA.
    *   **Dokumen Administratif (Upload via Digital Vault):**
        *   Fotokopi Akta Kelahiran anak.
        *   Kartu Keluarga (KK) Katolik.
        *   Surat Nikah Gereja orang tua.
        *   Surat Baptis dan Surat Krisma Wali Baptis.
*   **Submit:** Pengajuan tersimpan dengan status `Pending KL Approval`.

#### 2.2. Untuk Baptis Dewasa
*   **Input Form:**
    *   **Data Calon Baptis:** Nama Lengkap, Tanggal Lahir, Tempat Lahir, Rencana Nama Baptis.
    *   **Data Orang Tua:** Nama Ayah, Nama Ibu.
    *   **Dokumen Administratif (Upload via Digital Vault):**
        *   Surat pernyataan bermaterai ingin menjadi Katolik.
        *   Akta Kelahiran.
        *   Bukti partisipasi masa katekumenat (jika ada).
*   **Submit:** Pengajuan tersimpan dengan status `Pending KL Approval`.

### 3. Alur Approval Ketua Lingkungan (KL)
*   **Trigger:** Umat submit form pengajuan.
*   **Aksi Sistem:** Notifikasi (in-app, WA) dikirim ke Ketua Lingkungan yang relevan. Pengajuan muncul di Dashboard KL.
*   **Aksi KL:** Meninjau pengajuan dan dokumen di Dashboard KL. Dapat `Approve` atau `Tolak` (dengan catatan).
*   **Kondisi:**
    *   **Ditolak:** Notifikasi ke umat. Status pengajuan `Rejected by KL`.
    *   **Disetujui:** Notifikasi ke umat. Status pengajuan `Approved by KL, Waiting for Sekretaris 1`.

### 4. Penerbitan Surat Pengantar Elektronik ke Sekretaris 1 Gereja
*   **Trigger:** Pengajuan disetujui oleh KL.
*   **Aksi Sistem (Otomatis):**
    *   Sistem menerbitkan "Surat Pengantar Elektronik" dari KL ke Sekretaris 1 Gereja (Portal 1).
    *   Surat ini dapat diakses oleh Sekretaris 1 melalui Dashboard Admin Portal 1.
    *   Notifikasi (in-app, WA) dikirim ke umat dan Sekretaris 1.

### 5. Proses Sekretaris 1 Gereja (Portal 1)
*   **Akses:** Sekretaris 1 mengakses Dashboard Admin Portal 1.
*   **Aksi Sekretaris 1:**
    *   Meninjau Surat Pengantar Elektronik dan detail pengajuan.
    *   Verifikasi dokumen dan syarat lainnya.
    *   Mengubah status pengajuan.
*   **Notifikasi:** Notifikasi akan dikirim ke umat setiap kali status diperbarui.

## Integrasi
*   **Digital Vault:** Digunakan untuk menyimpan dan mengambil dokumen administratif.
*   **Sistem Notifikasi:** Untuk pemberitahuan in-app dan WhatsApp.
*   **Dashboard KL:** Integrasi untuk pengelolaan approval.
*   **Dashboard Admin Portal 1:** Integrasi untuk pengelolaan surat pengantar dan proses selanjutnya.

## API Endpoints (Contoh)
*   `POST /api/sakramen/baptis/apply`: Mengajukan form pendaftaran.
*   `GET /api/sakramen/baptis/status`: Cek status pendaftaran.
*   `POST /api/kl/sakramen/approve`: KL meng-approve/menolak.
*   `POST /api/sekretaris/sakramen/update-status`: Sekretaris 1 memperbarui status.