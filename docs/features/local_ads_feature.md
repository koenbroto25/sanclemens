# Local Ads — Iklan Lokal Internal

## Informasi Dokumen
- **Fase:** 4 — Ekonomi Internal
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 4.3 — Iklan Lokal
- **Referensi Utama:**
  - [GDD v4.0] Bab XI "Dual-Ledger Financial Engine" — sumber dana fee iklan
  - [masterplan v4.0] Sub-Fase 4.3

## Deskripsi
Sistem iklan lokal internal yang memungkinkan umat dan UMKM anggota paroki untuk memasang iklan/promosi di portal ekonomi (Pasar Kasih). Iklan ini bersifat internal — hanya untuk sesama umat — dan tidak terkait dengan platform iklan eksternal.

## Tujuan
- Mendukung promosi usaha umat secara internal
- Menyediakan sumber dana tambahan untuk RK-3 (melalui fee iklan)
- Memperkuat ekonomi internal paroki

## Jenis Iklan
| Jenis | Deskripsi | Biaya | Durasi |
|-------|-----------|-------|--------|
| Iklan Banner | Banner di halaman Pasar Kasih | Rp 50.000/minggu | 1-4 minggu |
| Iklan Produk Unggulan | Produk muncul di halaman utama | Rp 25.000/minggu | 1-4 minggu |
| Iklan Kolom Umat | Iklan baris di portal informasi | Gratis (untuk umat) | 1 bulan |

## Alur Utama
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 1 | Umat/UMKM | Buka halaman Iklan → "Pasang Iklan Baru" | Form iklan tersedia |
| 2 | Umat/UMKM | Pilih jenis iklan, upload materi, pilih durasi | Iklan diajukan |
| 3 | Admin Marketplace | Review dan approve iklan | Iklan aktif |
| 4 | Umat/UMKM | Bayar fee iklan (jika berbayar) via Xendit | Pembayaran diverifikasi |
| 5 | Sistem | Tampilkan iklan di slot yang tersedia | Iklan tayang |

## Aturan Bisnis
- Iklan hanya untuk umat terdaftar (Layer 2+)
- Konten iklan harus sesuai dengan nilai-nilai paroki
- Admin Marketplace berhak menolak iklan yang tidak sesuai
- Fee iklan masuk ke RK-3

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Iklan tidak sesuai nilai paroki | Ditolak oleh Admin Marketplace dengan alasan |
| Masa iklan habis | Otomatis nonaktif, notifikasi ke pemasang untuk perpanjangan |
| Pembayaran gagal | Iklan tidak tayang sampai pembayaran berhasil |
| Pemasang ingin perpanjang | Bisa perpanjang sebelum masa habis |

## Referensi Halaman
- Admin Marketplace: manajemen iklan