# Fitur: Personalisasi Homepage ("Umat Tersapa")

## Overview
Fitur "Umat Tersapa" bertujuan untuk menciptakan pengalaman yang lebih hangat dan personal bagi umat yang mengunjungi homepage Paroki Santo Klemens Sepinggan. Tagline "Selamat Datang di Rumah Kita Bersama" akan diwujudkan melalui sapaan personal, informasi relevan yang dinamis, dan perhatian khusus bagi umat yang berulang tahun. Fitur ini hanya akan aktif untuk umat yang sudah login.

## Lokasi di Homepage
Fitur ini akan ditempatkan di homepage, setelah bagian "Bacaan Kitab Suci Harian" dan sebelum "Space Iklan" (jika ada).

## Komponen & Fungsionalitas

### 1. Sapaan Personal (Personal Welcome)
- **Tujuan:** Membuat umat merasa dihargai dan disapa secara langsung.
- **Kondisi:** Hanya muncul untuk umat yang sudah login.
- **Isi:** Sapaan yang menggabungkan nama panggilan/sapaan favorit umat (sesuai preferensi di pengaturan profil) dengan pesan hangat.
- **Contoh:**
    - "Selamat datang, Bapak Yohanes. Kami bersyukur melihatmu kembali di rumah kita bersama."
    - "Salam sejahtera, Ibu Maria. Semoga hari ini penuh berkat."
- **Data yang digunakan:** Data profil umat (nama panggilan, sapaan favorit).

### 2. Ulang Tahun Umat (Birthday Greeting)
- **Tujuan:** Memberikan perhatian dan merayakan momen spesial umat.
- **Kondisi:** Muncul jika ada umat yang berulang tahun pada hari tersebut.
- **Isi:** Pesan selamat ulang tahun yang dapat menyebutkan nama umat/jumlah umat yang berulang tahun.
- **Contoh:**
    - "🎉 Hari ini, Gereja Paroki Santo Klemens mengucapkan selamat ulang tahun kepada: **[Nama Umat]** — Tuhan memberkati hidupmu."
    - "🎉 Hari ini Gereja Paroki Santo Klemens bersyukur untuk: **Bapak Yohanes, Ibu Maria, dan 2 umat lainnya** — Tuhan memberkati hidupmu."
- **Data yang digunakan:** Tanggal lahir umat dari database.
- **Privasi:** Hanya menampilkan nama atau jumlah, tidak menampilkan detail pribadi lainnya.

### 3. Ruang "Sapaan Harian" (Daily Spiritual Note)
- **Tujuan:** Memberikan inspirasi rohani dan informasi liturgis harian.
- **Kondisi:** Muncul secara dinamis setiap hari (untuk semua user, baik login maupun tidak, namun untuk user login bisa lebih dipersonalisasi).
- **Isi:** Dapat berupa salah satu dari:
    - **Nama Santo/Santa Hari Ini:** Menyebutkan santo/santa yang diperingati pada tanggal tersebut.
    - **Ayat Pendek / Quote Rohani Harian:** Kutipan singkat dari Kitab Suci atau tokoh rohani.
    - **Doa Singkat Harian:** Doa singkat untuk hari itu.
    - **Hari Besar Liturgi:** Informasi tentang hari besar atau perayaan liturgi tertentu.
- **Contoh:**
    - "✨ Hari ini kita mengenangkan **St. Maria Magdalena** — 'Tuhan, ajar aku mengasihi seperti Engkau mengasihi.'"
- **Data yang digunakan:** Kalender liturgi, database doa, atau kutipan rohani.

## Data & Backend
- **Endpoint API:** Diperlukan endpoint API (misalnya `/api/home/sapaan`) untuk mengambil data ulang tahun dan sapaan harian yang dinamis.
- **Database:** Diperlukan akses ke tabel profil umat untuk tanggal lahir dan preferensi sapaan. Data santo/santa, ayat, doa harian dapat dikelola di tabel terpisah atau knowledge base AI.
- **Caching:** Data sapaan harian dapat di-cache untuk mengurangi beban server.

## UX Considerations
- **Non-Intrusive:** Fitur ini harus ringkas, dalam bentuk teks baris atau kartu kecil, tidak boleh mengganggu visual utama homepage.
- **Responsif:** Tampilan harus adaptif di berbagai ukuran layar.
- **Personalisasi:** Meningkatkan rasa memiliki dan koneksi umat dengan paroki.

## Security & Privacy
- Semua data personal umat yang ditampilkan harus sesuai dengan persetujuan privasi.
- Data ulang tahun hanya menampilkan nama depan atau sapaan umum jika banyak umat yang berulang tahun.