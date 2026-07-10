# Fitur: Alur Kelengkapan Data Umat Baru Pasca-Approval

## Overview
Fitur ini mengelola alur yang harus dilalui umat baru setelah pendaftaran mereka disetujui oleh Ketua Lingkungan (KL) atau Admin Lingkungan. Umat akan diarahkan ke halaman khusus untuk melengkapi data pribadi dan dokumen penting, yang dapat di-skip dengan konsekuensi notifikasi periodik.

## Detail Fitur

### 1. Redirect Otomatis ke Halaman Kelengkapan Data
*   **Trigger:** Setelah pendaftaran umat baru di-approve oleh KL/Admin Lingkungan.
*   **Aksi Sistem:** Umat yang login akan secara otomatis diarahkan ke halaman `/data-completion`.
*   **Kondisi:** Redirect terjadi hanya jika data pribadi dan/atau dokumen wajib umat belum lengkap.

### 2. Halaman Kelengkapan Data (`/data-completion`)
*   **Tujuan:** Mengumpulkan data pribadi lebih lanjut dan dokumen yang dibutuhkan.
*   **Konten:**
    *   **Form Data Pribadi:** Input untuk data seperti tempat lahir, status pernikahan, pekerjaan, pendidikan, dll.
    *   **Upload Dokumen:** Integrasi dengan `Digital Vault` untuk upload scan dokumen seperti KTP, Kartu Keluarga, Akta Nikah Gereja, dll. (sesuai persyaratan).
    *   **Pencarian & Koneksi Keluarga:** Fitur untuk mencari dan menyambung ke keluarga yang sudah ada di sistem atau membuat keluarga baru.
*   **Visualisasi Progress:** Menampilkan progress bar atau checklist item yang sudah/belum lengkap.

### 3. Mekanisme "Lewati Dulu" (Skip)
*   **Fungsionalitas:** Umat memiliki opsi untuk melewati pengisian data ini.
*   **Konsekuensi:** Jika `Lewati Dulu` dipilih, fitur-fitur tertentu mungkin terbatas (misal: tidak bisa mendaftar sakramen, mengajukan bantuan) hingga data lengkap.

### 4. Notifikasi Periodik untuk Kelengkapan Data
*   **Trigger:** Umat memilih `Lewati Dulu`.
*   **Aksi Sistem:** Sistem akan mengirimkan notifikasi periodik (in-app, WA) untuk mengingatkan umat agar melengkapi data mereka.
*   **Frekuensi:** Misalnya, setiap 3 hari atau 7 hari sekali, dengan pesan yang mendorong untuk melengkapi data.
*   **Konten Notifikasi:** Menjelaskan pentingnya kelengkapan data untuk mengakses fitur penuh ekosistem.

### 5. Verifikasi Dokumen
*   **Trigger:** Dokumen diupload ke `Digital Vault`.
*   **Aksi Sistem:** Notifikasi dikirim ke Sekretaris 1 (Portal 1) untuk proses verifikasi.
*   **Integrasi OCR:** Jika `Digital Vault OCR Feature` terimplementasi, OCR akan otomatis membaca dan mengekstrak data dari dokumen.

## Integrasi
*   **Sistem Autentikasi/RLS:** Mengatur akses dan redirect setelah approval.
*   **Digital Vault:** Untuk manajemen dan verifikasi dokumen.
*   **Manajemen Keluarga:** Untuk menghubungkan umat dengan keluarga.
*   **Sistem Notifikasi:** Untuk pengingat periodik dan pemberitahuan verifikasi dokumen.
*   **Dashboard Admin Portal 1/2:** Untuk memantau status kelengkapan data umat di lingkup mereka.

## API Endpoints (Contoh)
*   `GET /api/user/data-completion-status`: Cek status kelengkapan data user.
*   `POST /api/user/update-profile-details`: Mengupdate detail profil.
*   `POST /api/user/upload-document-digital-vault`: Mengupload dokumen.
*   `POST /api/user/skip-data-completion`: Menandai user telah skip.
*   `POST /api/admin/verify-document/[id]`: Admin memverifikasi dokumen.