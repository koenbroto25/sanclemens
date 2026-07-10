# Halaman Klemen Kerja

## Informasi Halaman
- **Judul**: Klemen Kerja — Lowongan & Tenaga Kerja
- **URL**: `/klemen-kerja`
- **Portal**: Portal 1 — Paroki (Fase 6 — AI & Matching Solidaritas)
- **Layer Akses**: Umat (Layer 2+), KL (Layer 4+)
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal 1 Palette**: `--primary: #1e3a5f`, `--accent: #c9a227`
- **Typography**: Cormorant Garamond (heading), Inter (body)
- **Nuansa**: Solidaritas kerja, keahlian umat

## Wireframe — Halaman Utama

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "👷 KLEMEN KERJA"                                  │
│  Breadcrumb: Portal 1 > Klemen Kerja                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │ 📋 LOWONGAN KERJA  │  │ 👷 TENAGA KERJA    │             │
│  │ 12 Lowongan Aktif  │  │ 8 Tersedia        │             │
│  └────────────────────┘  └────────────────────┘             │
│                                                              │
│  ── Lowongan Terbaru ──                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🔨 TUKANG CAT — Lingk. Santo Paulus                  │  │
│  │  Estimasi: Rp 150rb/hari | Durasi: 2 minggu            │  │
│  │  "Butuh 2 tukang cat untuk renovasi gereja"            │  │
│  │  Diposting: 12 Jun 2026 — [Lamar] [Detail]            │  │
│  │  ────────────────────────────────────────               │  │
│  │  🍳 TUKANG MASAK — Lingk. Sta. Monica                 │  │
│  │  Estimasi: Rp 100rb/hari | Durasi: 3 hari             │  │
│  │  "Ibadah Syukur butuh 5 koki"                          │  │
│  │  Diposting: 10 Jun 2026 — [Lamar] [Detail]            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ── Statistik Matching ──                                    │
│  🟢 8 lowongan sudah terisi bulan ini                       │
│  🟡 3 lowongan menunggu pelamar                              │
│                                                              │
│  [➕ Pasang Lowongan Baru]                                   │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan (DS v3.0)
| Komponen | Deskripsi |
|----------|-----------|
| `LowonganCard` (DS §8.27) | Kartu lowongan pekerjaan |
| `TenagaKerjaCard` (DS §8.28) | Kartu profil tenaga kerja |
| `DonaturCard` (DS §8.29) | Kartu donatur (admin only) |

## API Routes
| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/klemen-kerja/lowongan` | GET | Daftar lowongan aktif |
| `/api/klemen-kerja/lowongan` | POST | Pasang lowongan baru |

## Matching Logic
1. User pasang lowongan → system cari `tenaga_kerja` dengan keahlian cocok
2. Cron setiap 6 jam → WA ke pencari kerja: "Ada lowongan cocok!"
3. Confidence ≥ 0.8 → langsung rekomendasikan
4. Confidence 0.5-0.79 → perlu verifikasi KL