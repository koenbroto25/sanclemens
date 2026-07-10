# Halaman Pendaftaran Sakramen

## Informasi Halaman
- **Judul**: Pendaftaran Sakramen — Perkawinan, Baptis, Krisma
- **URL**: `/sakramen/daftar`
- **Portal**: Portal 1 — Paroki
- **Layer Akses**: Umat (Layer 2+)
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal 1 Palette**: `--primary: #1e3a5f`, `--accent: #c9a227`
- **Typography**: Cormorant Garamond (heading), Inter (body)
- **Nuansa**: Sakral, formal, terstruktur

## Wireframe — Pre-Check Kelengkapan Data

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "🙏 PENDAFTARAN SAKRAMEN"                            │
│  Breadcrumb: Portal 1 > Sakramen > Pendaftaran              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ⚠️ LENGKAPI DATA ANDA DULU                             │  │
│  │  Sebelum mendaftar sakramen, pastikan data pribadi      │  │
│  │  dan dokumen Anda lengkap di profil.                    │  │
│  │                                                        │  │
│  │  [Pergi ke Halaman Kelengkapan Data]                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ✅ Data Utama Terisi (Nama, Tgl Lahir, Lingkungan)          │
│  ❌ Dokumen KTP Belum Diupload                               │
│  ✅ Surat Baptis Tersedia (jika sudah jadi Katolik)         │
│  ❌ Kartu Keluarga Belum Diupload                            │
│                                                              │
│  ╔════════════════════════════════════════════════════════╗  │
│  ║  ℹ️ Data Anda akan diverifikasi oleh Sekretariat.      ║  │
│  ║  Mohon siapkan dokumen asli saat dibutuhkan.            ║  │
│  ╚════════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────────┘
```

## Wireframe — Form Pendaftaran (Contoh: Perkawinan)

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "💍 PENDAFTARAN SAKRAMEN PERKAWINAN"                │
│  Breadcrumb: Portal 1 > Sakramen > Perkawinan               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Pilih Sakramen: [Perkawinan] [Baptis] [Krisma]          │
│                                                              │
│  ── Data Calon Pasangan ──                                    │
│  Nama Pria: [_________________________]                     │
│  Nama Wanita: [_________________________]                   │
│  ... (input detail lainnya)                                  │
│                                                              │
│  ── Dokumen Administratif Gereja ──                           │
│  Surat Baptis Terbaru: [Upload File] [Lihat Digital Vault]  │
│  Keterangan KPP: [Upload File] [Lihat Digital Vault]        │
│  ...                                                         │
│                                                              │
│  ── Dokumen Administratif Sipil ──                            │
│  Fotokopi KTP: [Upload File] [Lihat Digital Vault]          │
│  Kartu Keluarga: [Upload File] [Lihat Digital Vault]        │
│  ...                                                         │
│                                                              │
│  ☑️ Saya menyatakan data benar & bersedia diverifikasi       │
│                                                              │
│  [Ajukan Pendaftaran Sakramen]                              │
└──────────────────────────────────────────────────────────────┘
```

## Wireframe — Status Pendaftaran Umat

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "⏳ STATUS PENDAFTARAN SAKRAMEN"                      │
│  Breadcrumb: Portal 1 > Sakramen > Status                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  💍 **Pengajuan Sakramen Perkawinan**                        │
│  Nama Pasangan: Andi & Bunga                                │
│  Diajukan: 17 Juni 2026                                      │
│                                                              │
│  ── Timeline Status ──                                        │
│  ✅ Data Umat Lengkap                                        │
│  ✅ Form Pengajuan Disubmit (17 Juni 2026)                   │
│  ⏳ Menunggu Approval Ketua Lingkungan                       │
│     *   Petrus Handoko (KL Santo Yusuf) - Belum respons     │
│  ⚪ Surat Pengantar Elektronik Diterbitkan                 │
│  ⚪ Diproses Sekretaris 1                                   │
│  ⚪ Selesai / Ditolak                                       │
│                                                              │
│  [Batalkan Pengajuan]                                        │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan
*   `SacramentPrecheckComponent`: Melakukan validasi kelengkapan data umat.
*   `SacramentForm`: Form dinamis untuk pendaftaran Sakramen Perkawinan, Baptis, Krisma.
*   `DocumentUploadField`: Komponen untuk upload file ke `Digital Vault`.
*   `SacramentStatusTimeline`: Menampilkan alur dan status pengajuan.

## API Routes
*   `GET /api/user/data-completion-status`: Cek kelengkapan data umat.
*   `POST /api/sakramen/apply`: Mengajukan form pendaftaran sakramen.
*   `GET /api/sakramen/applications`: Melihat daftar/status pengajuan sakramen umat.