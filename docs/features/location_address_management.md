# Fitur: Manajemen Lokasi dan Alamat Umat

## Overview
Fitur ini memungkinkan umat untuk mengelola informasi lokasi dan alamat tempat tinggal mereka melalui halaman pengaturan profil. Ini bertujuan untuk mempermudah koordinasi pastoral, penanganan darurat (SOS), serta pembaruan data demografi paroki yang akurat. Fitur ini juga mencakup alur pengajuan perubahan alamat jika umat berpindah rumah, lingkungan, atau paroki.

## Lokasi Fitur
Fitur ini akan diintegrasikan ke dalam halaman pengaturan pengguna:
- `src/app/(dashboard)/settings/page.tsx` pada tab "Profil Pribadi".

## Komponen & Fungsionalitas

### 1. Informasi Lokasi & Alamat Rumah

- **Tujuan:** Memberikan umat kemampuan untuk membagikan lokasi geografis rumah mereka dan melihat alamat yang terdaftar.
- **Isi:**
    - Label "Alamat Terdaftar" dengan alamat tekstual yang tersimpan.
    - Tombol "Bagikan Lokasi Rumah" atau "Update Lokasi Saat Ini".
    - Indikator status apakah lokasi sudah dibagikan/diupdate.
- **Fungsionalitas "Bagikan Lokasi Rumah":**
    - Saat diklik, akan meminta izin akses lokasi dari browser/perangkat.
    - Mengambil koordinat (latitude, longitude) lokasi saat ini.
    - Mengirim koordinat ke backend untuk disimpan terkait profil umat.
- **Penjelasan Manfaat:**
    - "Memudahkan penanganan SOS darurat oleh pengurus lingkungan/paroki."
    - "Mempermudah kunjungan pastoral oleh Pastor atau Ketua Lingkungan."
    - "Membantu pemetaan dan validasi data demografi lingkungan."
- **Pemberitahuan Privasi:**
    - "Lokasi Anda akan disimpan secara terenkripsi dan hanya diakses oleh pihak berwenang paroki untuk keperluan pastoral, darurat, dan administratif, sesuai kebijakan privasi."

### 2. Ajukan Perubahan Alamat

- **Tujuan:** Memberikan alur terstruktur bagi umat untuk mengajukan perubahan alamat tempat tinggal mereka.
- **Lokasi:** Sebuah form terpisah di bawah bagian informasi lokasi.

#### A. Alur Perubahan Alamat (Umum)
1.  **Pengisian Form:** Umat mengisi alamat baru dan memilih jenis perubahan (pindah rumah/lingkungan/paroki).
2.  **Pengajuan Request:** Sistem membuat entri `location_change_requests` di database.
3.  **Notifikasi:** Pihak terkait (KL lama, KL baru, Admin Paroki) menerima notifikasi tentang pengajuan.
4.  **Verifikasi & Persetujuan:** Pihak berwenang memverifikasi informasi dan menyetujui atau menolak perubahan.
5.  **Update Data:** Setelah disetujui, data alamat umat dan/atau lingkungan/paroki di `public.profiles` dan `public.families` diperbarui.

#### B. Jenis Perubahan Alamat

##### a. Pindah Rumah (Dalam Lingkungan yang Sama)
- **Proses:** Umat memasukkan alamat baru. Request diajukan ke Ketua Lingkungan yang bersangkutan. KL memverifikasi (misal dengan kunjungan singkat atau konfirmasi via WhatsApp).
- **Notifikasi:** KL menerima notifikasi.
- **Persetujuan:** Oleh Ketua Lingkungan.

##### b. Pindah Lingkungan (Dalam Paroki yang Sama)
- **Proses:** Umat memasukkan alamat baru dan memilih lingkungan tujuan. Request diajukan ke Ketua Lingkungan lama dan Ketua Lingkungan tujuan.
- **Notifikasi:** KL lama dan KL baru menerima notifikasi.
- **Persetujuan:** Membutuhkan persetujuan dari KL lama (konfirmasi perpindahan) dan KL baru (penerimaan ke lingkungan).

##### c. Pindah Paroki
- **Proses:** Umat memasukkan alamat baru dan memilih paroki tujuan (jika sistem terhubung antar paroki, atau hanya memilih "paroki lain"). Request diajukan ke Admin Paroki saat ini.
- **Notifikasi:** Admin Paroki menerima notifikasi.
- **Persetujuan:** Oleh Admin Paroki saat ini, yang mungkin memerlukan koordinasi dengan paroki tujuan.

## Data & Backend

- **Tabel Database Baru:**
    - `public.location_change_requests`: Untuk menyimpan detail setiap pengajuan perubahan alamat (ID umat, alamat lama, alamat baru, jenis perubahan, status, tanggal pengajuan, tanggal persetujuan, ID admin yang menyetujui).
- **Endpoint API Baru:**
    - `POST /api/user/location/share`: Untuk menyimpan koordinat lokasi yang dibagikan.
    - `POST /api/user/address/change-request`: Untuk mengajukan perubahan alamat.
    - `GET /api/admin/location-requests`: Untuk admin/KL melihat daftar pengajuan.
    - `POST /api/admin/location-requests/:id/approve`: Untuk menyetujui pengajuan.
    - `POST /api/admin/location-requests/:id/reject`: Untuk menolak pengajuan.
- **Trigger/Function Database:** Mungkin diperlukan trigger atau function di Supabase untuk otomatis mengupdate data profil setelah pengajuan disetujui, atau untuk mengirim notifikasi internal.

## UX Considerations
- **Form yang Jelas:** Form pengajuan perubahan alamat harus mudah dipahami dengan pilihan jenis perubahan yang jelas.
- **Feedback Status:** Umat harus bisa melihat status pengajuan mereka (pending, disetujui, ditolak).
- **Integrasi Peta (Opsional):** Jika memungkinkan, tampilan peta kecil bisa ditambahkan untuk memvisualisasikan lokasi.

## Security & Privacy
- **RLS:** RLS yang ketat harus diterapkan pada tabel `public.location_change_requests` dan `public.profiles` untuk memastikan hanya pihak berwenang yang dapat melihat dan memproses pengajuan.
- **Persetujuan Lokasi:** Akses lokasi geografis perangkat harus selalu meminta persetujuan eksplisit dari pengguna.
- **Enkripsi:** Data koordinat lokasi dapat disimpan dalam format terenkripsi jika diperlukan, meskipun dalam konteks pastoral, akses terbatas oleh admin yang terpercaya mungkin sudah cukup.