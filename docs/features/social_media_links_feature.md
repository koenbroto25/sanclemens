# Fitur: Tautan Media Sosial

## Overview
Fitur ini menyediakan integrasi tautan ke platform media sosial resmi Paroki Santo Klemens (Instagram, YouTube, Facebook). Tautan ini akan ditampilkan di berbagai lokasi strategis di aplikasi untuk meningkatkan engagement dan komunikasi dengan umat.

## Detail Fitur

### 1. Lokasi Penempatan Tautan
*   **Homepage Publik:** Footer dan/atau Header (terutama untuk non-logged in user).
*   **Gate Hub:** Mungkin di bagian informasi paroki atau footer Gate Hub.
*   **Setiap Portal (Paroki, Lingkungan, Pasar Kasih):** Footer konsisten di seluruh aplikasi.

### 2. Ikon dan Desain
*   Menggunakan ikon resmi dari masing-masing platform media sosial (Instagram, YouTube, Facebook).
*   Desain mengikuti `UI/UX Design System v4.0` dengan penyesuaian warna agar sesuai dengan palet portal yang sedang aktif (misal: Portal 1, Portal 3, atau Gate Hub).

### 3. Sumber Data Konfigurasi
*   **Admin Panel:** URL tautan media sosial akan dapat dikelola dan diperbarui oleh Admin Komsos (Layer 5+) atau Super Admin (Layer 10) melalui dashboard admin.
*   **Environment Variables:** Sebagai fallback atau untuk development, URL tautan juga dapat didefinisikan di environment variables.

### 4. Fungsionalitas
*   Ketika ikon/tautan diklik, user akan diarahkan ke halaman media sosial resmi paroki di browser baru.

## Integrasi
*   **Admin Panel:** Untuk mengelola URL tautan.
*   **Frontend Components:** Komponen UI yang dapat digunakan kembali untuk menampilkan ikon dan tautan.
*   **Styling:** Integrasi dengan Tailwind CSS dan tokens desain.

## API Endpoints (Contoh)
*   `GET /api/public/social-links`: Mengambil daftar tautan media sosial aktif.
*   `POST /api/admin/social-links`: Admin menambahkan/mengedit tautan.