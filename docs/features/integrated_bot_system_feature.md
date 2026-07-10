# Fitur: Sistem Bot Asisten Terintegrasi

## Overview
Fitur ini mengimplementasikan sistem bot asisten yang terintegrasi di seluruh Ekosistem Digital Paroki Santo Klemens. Sistem ini mencakup 8 bot yang berbeda, masing-masing dengan peran dan fungsionalitas spesifik, serta menyediakan dukungan bot untuk semua peran admin. Fokus utama adalah pada integrasi AI Engine dan interaksi user-friendly.

## Detail Fitur

### 1. Daftar Bot Asisten (8 Bot)
*   **Bot 1 (Info Publik):** Memberikan informasi umum paroki di homepage publik dan WhatsApp.
*   **Bot 2 (CS Sekretariat):** Menangani pertanyaan umum dan mengarahkan ke Sekretariat.
*   **Bot 3 (Companion Rohani):** Memberikan panduan rohani, konseling, dan doa (E2E Encrypted, Full-page dark mode).
*   **Bot 4 (Asisten DPP):** Mendukung pengurus Dewan Pastoral Paroki (DPP) dengan informasi dan otomatisasi tugas.
*   **Bot 5 (Bot Lingkungan):** Mendukung Ketua Lingkungan (KL) dalam komunikasi dan pengelolaan lingkungan.
*   **Bot 6 (Klemen Keluarga):** Membantu umat mengelola data keluarga, mencari anggota, dan undangan.
*   **Bot 7 (Klemen Kerja):** Membantu umat mencari lowongan kerja, mencari tenaga kerja, dan mengajukan/memberikan bantuan.
*   **Gate Bot (Panduan Portal):** Memberikan panduan navigasi dan fitur di Gate Hub untuk user baru/lama.

### 2. Arsitektur Umum Sistem Bot
*   **AI Engine Integration:** Backend bot akan terintegrasi dengan model AI (misal: OpenAI, Deepseek) untuk Natural Language Understanding (NLU), Intent Detection, dan generasi respons.
*   **Context Management:** Sistem akan mempertahankan konteks percakapan per user untuk memberikan respons yang relevan dan personal.
*   **API Endpoints:** Setiap bot akan memiliki atau menggunakan API endpoint yang relevan untuk berinteraksi dengan database dan fitur aplikasi lainnya.
*   **E2E Encryption (Companion Rohani):** Khusus untuk Bot 3, semua percakapan akan dienkripsi end-to-end untuk memastikan privasi user.

### 3. Dukungan Bot untuk Semua Peran Admin
*   **Super Admin:** Bot untuk peringatan sistem tingkat tinggi, otomatisasi tugas maintenance (misal: trigger backup, health checks), dan insight data.
*   **Admin Portal 1 (Paroki):** Bot untuk query data paroki kompleks, laporan otomatis (demografi, keuangan), dan bantuan manajemen konten publik.
*   **Admin Portal 2 (Lingkungan):** Bot untuk query data umat/lingkungan, membantu entri data umat baru/sakramen, menyusun broadcast pesan, dan insight kegiatan/keuangan lingkungan.
*   **Admin Portal 3 (Marketplace):** Bot untuk moderasi produk, support seller/buyer, monitoring transaksi, dan laporan penjualan.

### 4. Interaksi UI Bot
*   **Chat Bubbles:** Untuk Gate Bot di Gate Hub dan bot-bot lain yang terintegrasi di sidebar atau Floating Action Button (FAB).
*   **Full-page Chat Interface:** Khusus untuk Companion Rohani (Bot 3) untuk pengalaman yang lebih mendalam dan fokus.
*   **Integrasi Notifikasi:** Bot akan memanfaatkan sistem notifikasi (in-app, WA) untuk menyampaikan informasi proaktif atau respons yang tertunda.

### 5. Filter Input Bot (Anti-Abuse)
*   **Mekanisme:** Implementasi filter berlapis (blocklist, sanitasi, log, graduated response) untuk menangani input user yang iseng, ofensif, atau percobaan abuse.
*   **Integrasi:** Mirip dengan `SOS Anti-Abuse System`.

## Integrasi Kunci
*   **AI Engine:** Untuk pemrosesan bahasa alami dan logika cerdas.
*   **Database (Supabase):** Untuk menyimpan data percakapan, konteks, dan data fitur terkait.
*   **Sistem Notifikasi:** Untuk komunikasi proaktif dari bot.
*   **Frontend Components:** Komponen chat UI yang dapat digunakan kembali.
*   **AI Engineer Specification v4.0:** Sebagai referensi utama untuk detail implementasi AI.

## API Endpoints (Contoh)
*   `POST /api/bot/[bot_id]/chat`: Mengirim pesan ke bot dan menerima respons.
*   `GET /api/bot/[bot_id]/context`: Mengambil konteks percakapan user.
*   `POST /api/bot/[bot_id]/admin-command`: Admin mengirim perintah ke bot.