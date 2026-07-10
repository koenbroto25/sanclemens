# Halaman Kelengkapan Data Umat

## Informasi Halaman
- **Judul**: Kelengkapan Data Diri dan Dokumen
- **URL**: `/data-completion`
- **Portal**: Gate Hub (setelah approval KL/Admin Lingkungan)
- **Layer Akses**: Umat Baru (Layer 2) yang belum melengkapi data
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal Umum Palette**: Netral, ramah, fokus pada form.
- **Typography**: Inter (body), Cormorant Garamond (heading kecil).
- **Nuansa**: Bantuan, panduan, motivasi.

## Wireframe — Halaman Utama

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "📝 LENGKAPI DATA ANDA"                            │
│  Breadcrumb: Gate Hub > Kelengkapan Data                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Selamat datang, [Nama Umat]!                              │
│  Untuk memaksimalkan pengalaman Anda di Ekosistem Digital, │
│  mohon lengkapi data diri dan dokumen penting Anda.       │
│                                                              │
│  Progress: 30% Lengkap                                       │
│  [─────────────────⚪──────────────]                         │
│                                                              │
│  ── Data Diri & Keluarga ──                                   │
│  ✅ Nama Lengkap                                            │
│  ✅ Tanggal Lahir                                           │
│  ❌ Tempat Lahir [Lengkapi]                                  │
│  ❌ Status Pernikahan [Lengkapi]                            │
│  ✅ Alamat                                                  │
│  [Cari & Sambung Keluarga]                                  │
│                                                              │
│  ── Dokumen Penting (Digital Vault) ──                        │
│  ❌ Fotokopi KTP [Upload]                                    │
│  ❌ Kartu Keluarga [Upload]                                  │
│  ✅ Surat Baptis [Lihat]                                     │
│  ❌ Akta Nikah Gereja [Upload]                               │
│                                                              │
│  [Lewati Dulu (Akan Ada Notifikasi Periodik)]                │
│  [Selesai & Lanjutkan ke Gate Hub]                          │
│                                                              │
│  ╔════════════════════════════════════════════════════════╗  │
│  ║  💡 Mengapa ini penting?                                ║  │
│  ║  Data lengkap memudahkan pengajuan sakramen, bantuan,  ║  │
│  ║  dan fitur lainnya. Semua data aman & terenkripsi.    ║  │
│  ╚════════════════════════────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan
*   `DataCompletionProgress`: Menampilkan progress bar.
*   `ProfileInputField`: Form input untuk data pribadi.
*   `DocumentUploadField`: Komponen untuk upload file ke `Digital Vault`.
*   `FamilySearchConnect`: Untuk mencari dan menyambung keluarga.
*   `SkipButton`: Tombol untuk melewati pengisian data.

## API Routes
*   `GET /api/user/profile-completion`: Mengambil status kelengkapan data.
*   `POST /api/user/update-profile`: Mengupdate data pribadi.
*   `POST /api/user/upload-document`: Mengupload dokumen ke `Digital Vault`.
*   `POST /api/family/connect`: Mencari dan menyambung keluarga.

## Catatan
*   Halaman ini adalah titik landing utama setelah approval umat baru.
*   Notifikasi periodik akan dikirim jika umat memilih untuk melewati pengisian data.
*   `Digital Vault` akan menangani proses scan dokumen, OCR, dan verifikasi.