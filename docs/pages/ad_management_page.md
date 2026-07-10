# Halaman Manajemen Iklan Dinamis

## Informasi Halaman
- **Judul**: Dashboard Pengelolaan Iklan Dinamis
- **URL**: `/admin/ads`
- **Portal**: Admin Dashboard (Portal 1, Gate Hub, Portal 3)
- **Layer Akses**: Admin Komsos (Layer 5+), Admin Marketplace (Layer 6+), Super Admin (Layer 10)
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal Admin Palette**: Netral, fokus pada data dan kontrol.
- **Typography**: Inter (body), Cormorant Garamond (heading).
- **Nuansa**: Kontrol, efisiensi, transparan.

## Wireframe — Dashboard Utama

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "📊 MANAJEMEN IKLAN DINAMIS"                        │
│  Breadcrumb: Admin > Iklan                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Ringkasan Iklan:                                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │ 12        │  │ 5         │  │ Rp 1.2M   │                │
│  │ Iklan Aktif │  │ Iklan Pending │  │ Pendapatan Bulan Ini │                │
│  └───────────┘  └───────────┘  └───────────┘                │
│                                                              │
│  ── Daftar Iklan Aktif / Pending ──                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🔔 Iklan Ucapan Syukur — Andi Handoko                 │  │
│  │  Lokasi: Homepage | Status: ✅ Aktif                    │  │
│  │  Periode: 10-17 Jun 2026 | Tipe: Umum                   │  │
│  │  [Lihat] [Edit] [Nonaktifkan]                             │  │
│  │  ────────────────────────────────────────                 │  │
│  │  💖 Iklan Duka — Keluarga Bpk. Santoso                 │  │
│  │  Lokasi: Homepage | Status: ✅ Aktif                    │  │
│  │  Periode: 15-22 Jun 2026 | Tipe: Duka                   │  │
│  │  [Lihat] [Edit] [Nonaktifkan]                             │  │
│  │  ────────────────────────────────────────                 │  │
│  │  ✨ Iklan Premium — Toko Berkah                          │  │
│  │  Lokasi: Gate Hub | Status: ⏳ Pending Approval          │  │
│  │  Periode: 20-30 Jun 2026 | Tipe: Premium                 │  │
│  │  [Approve] [Tolak] [Edit]                                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [➕ Buat Iklan Baru]                                        │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan
*   `AdDashboardStats`: Menampilkan ringkasan statistik iklan.
*   `AdTable`: Tabel interaktif untuk daftar iklan dengan filter, sorting, dan pagination.
*   `AdForm`: Form untuk membuat/mengedit iklan.
*   `AdPreviewComponent`: Menampilkan preview iklan.

## API Routes
*   `GET /api/admin/ads`: Mengambil daftar iklan.
*   `POST /api/admin/ads`: Membuat iklan baru.
*   `PUT /api/admin/ads/[id]`: Mengedit iklan.
*   `POST /api/admin/ads/[id]/approve`: Meng-approve iklan.
*   `POST /api/admin/ads/[id]/deactivate`: Menonaktifkan iklan.

## Aturan Lokasi Iklan
*   **Homepage Default:** Iklan ucapan syukur, duka, mohon doa, dll. (Umum)
*   **Gate Hub:** Iklan umum premium (selektif), berbagai mode tampilan (banner, card, pop-up ringan).
*   **Marketplace:** Iklan premium khusus produk/seller marketplace.