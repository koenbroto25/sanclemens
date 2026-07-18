# Laporan Verifikasi Struktur: Alkitab Deuterokanonika (Kemenag/LAI) vs NABRE

Verifikasi dilakukan dengan mendeteksi marka struktural (judul kitab & nomor pasal berfont besar)
di dalam PDF secara otomatis — **tanpa mengekstrak atau menyimpan teks ayat**, karena teks tersebut
berhak cipta LAI. Hasil dibandingkan terhadap `bible-nabre-book-chapters.json`.

## Ringkasan
- **73 dari 73 kitab** berhasil dipetakan namanya (Indonesia ↔ NABRE), urutan mengikuti NABRE.
- **71 dari 73 kitab**: jumlah pasal cocok 100% dengan referensi NABRE.
- **2 kitab (Yoël, Maleakhi)**: jumlah pasal berbeda — **bukan kesalahan**, melainkan perbedaan
  skema penomoran pasal yang memang berbeda antar tradisi (Ibrani/Vulgata vs LXX), isi ayatnya sama.
- **1 kitab (Daniel)**: PDF memisah teks jadi dua lokasi fisik (PL utama pasal 1–12, lalu
  "Tambahan-tambahan pada Kitab Daniel" pasal 13–14 di bagian lampiran Deuterokanonika) — totalnya
  tetap 14 pasal, cocok NABRE.
- **Tambahan Kitab Ester**: memakai skema huruf (A–F), bukan nomor pasal — sesuai tradisi Vulgata standar
  yang juga dipakai NABRE untuk bagian ini.

## Detail perbedaan penomoran pasal

| Kitab (NABRE) | Pasal PDF (Kemenag/LAI TB) | Pasal NABRE | Penjelasan |
|---|---|---|---|
| Joel | 3 | 4 | Yoël 2:28-32 (penomoran Ibrani/TB) = pasal 4 tersendiri di NABRE (penomoran Vulgata/LXX) |
| Malachi | 4 | 3 | Maleakhi 3:19-24 (penomoran Ibrani/TB) = bagian akhir pasal 3 di NABRE |
| Daniel | 12 (+2 di lampiran) | 14 | Tambahan Daniel (Doa Azarya, Susana, Bel & Naga) dicetak terpisah di PDF tapi bernomor pasal 13-14, menyatu secara logis dengan Daniel |

Ini adalah perbedaan **konvensi penomoran**, bukan perbedaan kanon atau isi — kedua versi (PDF Kemenag/LAI
dan NABRE) sama-sama kanon Katolik lengkap (73 kitab termasuk deuterokanonika).

## Status hak cipta teks PDF

PDF ini (Alkitab Deuterokanonika, Terjemahan Baru/TB) dinyatakan eksplisit di halaman 3 sebagai:
`© LAI 1974, LBI 1976`, dengan nomor pendaftaran ciptaan resmi di Ditjen HAKI. Fakta bahwa file ini
dihosting oleh portal Kemenag (pusaka.kemenag.go.id) untuk akses baca publik **tidak mengubah status
hak ciptanya** — itu tetap teks berlisensi milik LAI, hanya didistribusikan gratis untuk dibaca, bukan
dilepas ke domain publik atau lisensi terbuka.

**Konsekuensi:** file `bible-id.json` (teks ayat lengkap bahasa Indonesia) belum bisa saya buat dengan
menyalin isi PDF ini. Yang sudah bisa diselesaikan dan aman dari sisi hak cipta:
- Struktur nama kitab (`bible-all-books-id.json`)
- Verifikasi jumlah pasal per kitab (dokumen ini)

Untuk teks ayat, dibutuhkan salah satu dari:
- Terjemahan Katolik Indonesia yang sudah domain publik (misalnya edisi pra-1965 yang masa hak
  ciptanya sudah habis), atau
- Izin/lisensi eksplisit dari LAI/KWI untuk penggunaan teks TB, atau
- Terjemahan baru yang independen (bukan salinan TB) yang Anda/tim buat sendiri per-ayat.
