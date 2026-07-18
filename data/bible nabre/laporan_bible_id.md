# Laporan: bible-id.json (Alkitab Bahasa Indonesia, 66 Kitab)

## Ringkasan
- **Sumber**: `alkitab_ai_trans_project.txt` — proyek terjemahan literal/interlinear independen (bukan salinan LAI/Kemenag), berisi anotasi kata asli Ibrani/Yunani + nomor Strong.
- **Hasil**: `bible-id.json`, 66 kitab (kanon Protestan), 31.102 ayat, struktur identik dengan `nabre.json` (`book` → `chapters` → `chapter`/`verses` → `verse`/`text`).
- **7 kitab deuterokanonika** (Tobit, Yudit, Kebijaksanaan Salomo, Sirakh, Barukh, 1 & 2 Makabe) **tidak termasuk** — sesuai keputusan Anda, karena tidak tersedia di file sumber ini.

## Proses pembersihan & parsing
1. **Deteksi batas kitab & pasal**: memakai running header dalam teks (mis. `KEJADIAN 2.1–7 6`) sebagai sumber kebenaran nomor pasal — lebih andal daripada artefak angka mandiri dalam isi teks.
2. **Penghapusan anotasi Strong**: pola `(Kata - Nomor)` (termasuk nama majemuk seperti `El-Shadday - 410 - 7706`, dan placeholder `*` yang diganti kata Indonesia standar seperti "Allah"/"TUHAN") dibuang, teks yang tersisa jadi bacaan natural.
3. **Penanganan ayat pertama implisit**: ayat 1 tiap pasal sering tidak diberi label angka eksplisit di sumber — dideteksi lewat posisi (teks sebelum nomor eksplisit pertama dalam pasal).
4. **Penomoran alternatif Ibrani** (mis. `(3-2)` pada Mazmur, tanda kurung referensi silang) dibuang karena bukan bagian teks ayat.
5. **Perbaikan artefak line-wrap**: kata majemuk yang terpotong tanda hubung di akhir baris (`makhluk- makhluk` → `makhluk-makhluk`) dan spasi ganjil sebelum tanda baca dari sisa penghapusan anotasi.

## Validasi
- **63 dari 66 kitab**: jumlah & urutan pasal cocok 100% dengan `bible-nabre-book-chapters.json`.
- **3 kitab (Daniel, Yoël, Maleakhi)**: selisih jumlah pasal — **bukan bug**, melainkan perbedaan skema penomoran pasal (Ibrani/TB vs Vulgata/NABRE) yang telah dikonfirmasi berulang kali lintas sumber (PDF Kemenag, file ini, dan referensi NABRE) di sesi sebelumnya.
- **Nol anomali** penomoran ayat (non-sequential, duplikat) di seluruh 1189 pasal.
- **Nol sisa artefak** (tanda kurung, kebocoran header, marker internal) di seluruh 31.102 ayat setelah pembersihan akhir.
- Spot-check ayat terkenal (Yohanes 3:16, Mazmur 23:1, Kejadian 1:1, dll) dan 5 sampel acak — semua natural dan koheren.

## Yang belum tercakup
- 7 kitab deuterokanonika kosong dari `bible-id.json` — perlu sumber terjemahan terpisah bila Anda ingin versi Katolik 73-kitab lengkap.
- Kitab Daniel/Yoël/Maleakhi memakai skema penomoran pasal sumber asli (Ibrani/TB), belum dipetakan ulang ke skema NABRE bila Anda memerlukan pasal-per-pasal yang identik persis dengan NABRE untuk ketiga kitab ini.
