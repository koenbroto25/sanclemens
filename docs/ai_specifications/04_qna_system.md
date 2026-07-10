## BAB IV — Sistem Q&A {#bab-iv}

### 4.1 Arsitektur Q&A

Dua mode operasi:
- **Mode Publik** — halaman Q&A, bisa di-browse Layer 0+
- **Mode Bot Reference** — Q&A dipakai bot sebagai basis jawaban saat menjawab pertanyaan user

Semua entri Q&A dikurasi oleh Tim ICT dan dikonfirmasi oleh Pastor sebelum masuk database (`public.qna`). Pencarian menggunakan semantic search (vector similarity) untuk menemukan jawaban yang paling relevan dengan pertanyaan user.

### 4.2 Q&A Baru untuk Fitur v4.0

| No | Pertanyaan | Jawaban | Bot |
|---|---|---|---|
| 1 | Bagaimana cara daftar akun? | Daftar cukup pakai No WhatsApp + Nama + Password. Sistem kirim OTP 6 digit via WA. Tidak perlu email. | Bot 1, Bot 2, Gate Bot |
| 2 | Apa itu Gate Hub? | Gate Hub adalah halaman utama setelah login. Dari sini Anda bisa memilih Portal 1 (Paroki), Portal 2 (Lingkungan), atau Portal 3 (Pasar Kasih). | Gate Bot |
| 3 | Apa itu Portal 1, 2, 3? | Portal 1 Paroki untuk informasi keumatan & administrasi. Portal 2 Lingkungan untuk kegiatan & tagihan lingkungan. Portal 3 Pasar Kasih (segera hadir) untuk jual-beli antar umat. | Gate Bot |
| 4 | Bagaimana cara menyambung ke keluarga? | Cari anggota keluarga via Gate Hub atau menu Keluarga. Masukkan No WA atau Kode Keluarga. Kirim permintaan, Kepala Keluarga akan menyetujui. | Bot 6 |
| 5 | Saya lupa PIN Companion Rohani | Data tidak bisa dipulihkan karena enkripsi E2E. Anda harus setup ulang. | Bot 3 |
| 6 | Apa itu Data GAKIN? | Data Keluarga Miskin yang terverifikasi. Bisa diakses oleh Pastor, Wakil DPP, Komsos, dan Ketua Lingkungan. | Bot 4 |
| 7 | Kapan Pasar Kasih dibuka? | Pasar Kasih masih dalam persiapan. Target peluncuran Fase 4. Sementara Anda bisa pre-registrasi sebagai seller atau driver. | Gate Bot, Bot 1 |
| 8 | Bagaimana cara lapor keluarga tidak mampu? | Hubungi Seksi Sosial (Komsos) atau Ketua Lingkungan. Mereka akan mengajukan data GAKIN dengan approval 3 dari 4 pengurus. | Bot 4 |
| 9 | Apa itu Klemen Kerja? | Fitur untuk mencari lowongan kerja atau tenaga kerja antar umat. Anda bisa daftar keahlian, cari kerja, atau pasang lowongan. | Bot 7 |
| 10 | Bagaimana cara mencari lowongan kerja? | Buka menu Klemen Kerja. Sistem akan cocokkan keahlian Anda dengan lowongan yang tersedia. | Bot 7 |
| 11 | Saya butuh sembako, bagaimana? | Sampaikan ke Bot atau langsung hubungi Ketua Lingkungan. Sistem akan mencocokkan dengan donatur potensial atau bantuan yang tersedia. | Bot 7, Bot 3 |

---
