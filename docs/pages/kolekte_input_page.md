# Halaman Input Kolekte

## Informasi Halaman
- **Judul**: Input Data Kolekte Harian/Mingguan
- **URL**: `/keuangan/kolekte/input`
- **Portal**: Portal 1 — Paroki (atau Portal 2 — Lingkungan)
- **Layer Akses**: Bendahara Lingkungan (Layer 6+), Bendahara Paroki (Layer 6+)
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal Admin Palette**: Netral, fokus pada form dan data entry.
- **Typography**: Inter (body), Cormorant Garamond (heading).
- **Nuansa**: Transparansi, akurasi, pertanggungjawaban.

## Wireframe — Form Input Kolekte

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "📝 INPUT KOLEKTE (BLIND DUAL-ENTRY)"             │
│  Breadcrumb: Portal > Keuangan > Kolekte > Input            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Selamat datang, Bendahara [Nama Bendahara]!                 │
│  Silakan masukkan data kolekte untuk verifikasi.             │
│                                                              │
│  ── Data Kolekte ──                                          │
│  Tanggal Kolekte: [17 Juni 2026 ▼]                            │
│  Jenis Kolekte:   [Mingguan  ▼]                               │
│  Nominal Kolekte: [Rp _________________________]             │
│  Catatan (opsional): [_________________________]             │
│                                                              │
│  [Submit Kolekte]                                            │
│                                                              │
│  ╔════════════════════════════════════════════════════════╗  │
│  ║  💡 Catatan: Input Anda akan dibandingkan dengan input ║  │
│  ║  Bendahara lain untuk memastikan akurasi.                ║  │
│  ╚════════════════════════────────────────────────────────┘  │
│                                                              │
│  ── Ringkasan Input Kolekte Anda Hari Ini ──                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tgl: 17 Jun | Jenis: Mingguan | Nominal: Rp 500.000  │  │
│  │  Status: ⏳ Menunggu Input Bendahara Lain              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Lihat Data Rekonsiliasi Pending]                           │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan
*   `KolekteInputField`: Input form untuk nominal, tanggal, jenis.
*   `KolekteSummaryCard`: Menampilkan ringkasan input user.
*   `ReconciliationStatusIndicator`: Menampilkan status rekonsiliasi.

## API Routes
*   `POST /api/kolekte/input`: Bendahara submit input kolekte.
*   `GET /api/kolekte/user-daily-summary`: Mengambil ringkasan input user.