# Fitur: SOP Sakramen Perkawinan

## Overview
Fitur ini mengelola seluruh alur pendaftaran Sakramen Perkawinan secara digital, dari pengecekan kelengkapan data umat, pengajuan online, approval oleh Ketua Lingkungan (KL), hingga penerbitan surat pengantar elektronik ke Sekretaris 1 Gereja.

## Detail Fitur

### 1. Pengecekan Kelengkapan Data Umat
*   **Trigger:** Umat mengakses halaman pendaftaran Sakramen Perkawinan.
*   **Aksi Sistem:** Memverifikasi kelengkapan data pribadi umat di database, termasuk status upload dokumen yang diperlukan di `Digital Vault` (misal: Akta Kelahiran, KTP).
*   **Kondisi:**
    *   **Data Lengkap:** Umat dapat melanjutkan ke form pengajuan.
    *   **Data Belum Lengkap:** Umat diarahkan ke halaman kelengkapan data (`/data-completion`) dengan notifikasi.
*   **Notifikasi:** Notifikasi periodik (in-app, WA) akan dikirim ke umat jika data belum lengkap dan belum diisi.

### 2. Form Pengajuan Sakramen Perkawinan Online
*   **Akses:** Umat yang datanya sudah lengkap.
*   **Input Form:**
    *   **Data Calon Pasangan:** Nama Lengkap, Tanggal Lahir, Tempat Lahir, Agama (jika non-Katolik), No WA, Alamat.
    *   **Data Orang Tua:** Nama Ayah, Nama Ibu.
    *   **Rencana Pernikahan:** Tanggal dan Lokasi Pemberkatan.
    *   **Dokumen Administratif Gereja (Upload via Digital Vault):**
        *   Surat Baptis terbaru (maksimal 6 bulan sebelum pemberkatan).
        *   Surat Pengantar dari Ketua Lingkungan (jika diperlukan secara manual, tapi preferensi dari sistem akan otomatis).
        *   Surat Keterangan Telah Mengikuti Kursus Persiapan Perkawinan (KPP).
        *   Surat Bebas Halangan Nikah.
    *   **Dokumen Administratif Sipil (Upload via Digital Vault):**
        *   Fotokopi KTP calon pasangan.
        *   Kartu Keluarga (KK).
        *   Akta Kelahiran calon pasangan.
*   **Submit:** Pengajuan tersimpan di database dengan status `Pending KL Approval`.

### 3. Alur Approval Ketua Lingkungan (KL)
*   **Trigger:** Umat submit form pengajuan.
*   **Aksi Sistem:**
    *   Notifikasi (in-app, WA) dikirim ke Ketua Lingkungan yang relevan (sesuai lingkungan umat pengaju).
    *   Pengajuan muncul di Dashboard KL (`/dashboard/kl/[slug]`).
*   **Aksi KL:**
    *   KL meninjau pengajuan dan dokumen di Dashboard KL.
    *   KL dapat `Approve` atau `Tolak` pengajuan (dengan memberikan catatan jika ditolak).
*   **Kondisi:**
    *   **Ditolak:** Notifikasi ke umat. Status pengajuan menjadi `Rejected by KL`.
    *   **Disetujui:** Notifikasi ke umat. Status pengajuan menjadi `Approved by KL, Waiting for Sekretaris 1`.

### 4. Penerbitan Surat Pengantar Elektronik ke Sekretaris 1 Gereja
*   **Trigger:** Pengajuan disetujui oleh KL.
*   **Aksi Sistem (Otomatis):**
    *   Sistem menerbitkan "Surat Pengantar Elektronik" dari KL ke Sekretaris 1 Gereja (Portal 1). Surat ini berisi ringkasan pengajuan sakramen dan rekomendasi KL.
    *   Surat ini dapat diakses oleh Sekretaris 1 melalui Dashboard Admin Portal 1.
    *   Notifikasi (in-app, WA) dikirim ke umat bahwa surat pengantar telah diterbitkan dan ke Sekretaris 1 bahwa ada pengajuan sakramen baru yang perlu ditindaklanjuti.
*   **Notifikasi:**
    *   **Ke Umat:** "Pengajuan Sakramen Perkawinan Anda telah disetujui KL. Surat pengantar elektronik telah dikirim ke Sekretariat Gereja. Anda akan dihubungi oleh Sekretariat untuk langkah selanjutnya."
    *   **Ke Sekretaris 1:** "Ada pengajuan Sakramen Perkawinan baru dari [Nama Umat] (Lingkungan [Nama Lingkungan]). Surat pengantar elektronik dari KL tersedia di dashboard Anda."

### 5. Proses Sekretaris 1 Gereja (Portal 1)
*   **Akses:** Sekretaris 1 mengakses Dashboard Admin Portal 1.
*   **Aksi Sekretaris 1:**
    *   Meninjau Surat Pengantar Elektronik dan detail pengajuan sakramen.
    *   Dapat menghubungi umat untuk wawancara atau verifikasi tambahan.
    *   Mengubah status pengajuan (misal: `Diproses Sekretariat`, `Verifikasi Dokumen`, `Jadwal Pertemuan`, `Selesai`, `Ditolak Sekretariat`).
*   **Notifikasi:** Notifikasi akan dikirim ke umat setiap kali status pengajuan diperbarui oleh Sekretaris 1.

## Integrasi
*   **Digital Vault:** Digunakan untuk menyimpan dan mengambil dokumen-dokumen administratif.
*   **Sistem Notifikasi:** Untuk mengirim pemberitahuan in-app dan WhatsApp.
*   **Dashboard KL:** Integrasi untuk pengelolaan approval.
*   **Dashboard Admin Portal 1:** Integrasi untuk pengelolaan surat pengantar dan proses selanjutnya oleh Sekretaris 1.

## API Endpoints (Contoh)
*   `POST /api/sakramen/perkawinan/apply`: Mengajukan form pendaftaran.
*   `GET /api/sakramen/perkawinan/status`: Cek status pendaftaran.
*   `POST /api/kl/sakramen/approve`: KL meng-approve/menolak.
*   `POST /api/sekretaris/sakramen/update-status`: Sekretaris 1 memperbarui status.