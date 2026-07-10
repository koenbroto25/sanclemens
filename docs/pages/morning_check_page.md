# Halaman Cek Lansia Harian

## Informasi Halaman
- **Judul**: Cek Lansia Harian — Morning Check
- **URL**: `/lansia`
- **Portal**: Portal 1 — Paroki (Fase 2 — Inklusivitas & Rohani)
- **Layer Akses**: Lansia (>60 tahun, auto-detect), WDL (Layer 3), KL (Layer 4), Sub Bidang Sosek (Layer 5+), Pastor (Layer 9+)
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal 1 Palette**: `--primary: #1e3a5f`, `--accent: #c9a227` (emas)
- **Typography**: Cormorant Garamond (heading), Inter (body)
- **Nuansa**: Hangat, perhatian, pastoral care

## Wireframe — Lansia Check-In

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "☀️ CEK LANSIA HARIAN"                             │
│  Breadcrumb: Portal 1 > Cek Lansia                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🙏 Selamat pagi, Ibu Maria!                           │  │
│  │  Hari ini: Minggu, 17 Juni 2026                        │  │
│  │                                                        │  │
│  │  Bagaimana keadaan Bunda hari ini?                     │  │
│  │                                                        │  │
│  │  ┌────────────────────┐  ┌────────────────────┐       │  │
│  │  │  ✅ Saya Baik       │  │  🆘 Butuh Bantuan  │       │  │
│  │  │     (Alhamdulillah) │  │                     │       │  │
│  │  └────────────────────┘  └────────────────────┘       │  │
│  │                                                        │  │
│  │  Catatan (opsional):                                   │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │ [________________________________________]    │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ╔════════════════════════════════════════════════════════╗  │
│  │  ☀️ Pagi ini, 847 umat sudah berdoa bersama           ║  │
│  ╚════════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────────┘
```

## Wireframe — Dashboard KL/WDL (Daftar Lansia)

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "📊 DASHBOARD CEK LANSIA"                          │
│  Breadcrumb: Portal 1 > Cek Lansia > Dashboard KL           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Ringkasan Hari Ini:                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  15      │  │  3       │  │  2       │                   │
│  │  Lansia  │  │  Sudah   │  │  Belum   │                   │
│  │  Aktif   │  │  Cek     │  │  Cek     │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                              │
│  🟢 Sudah Cek:                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  👤 Ibu Maria — Santo Yusuf — ✅ Baik (06.15)         │  │
│  │  👤 Bpk. Antonius — Sta. Monika — ⚠️ Butuh Bantuan   │  │
│  │  👤 Ibu Theresa — Santo Paulus — ✅ Baik (06.30)      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  🔴 Belum Cek (butuh follow-up):                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  👤 Bpk. Thomas — Santo Yusuf — ⏳ Belum respons 8jam │  │
│  │  [Hubungi via WA]                                      │  │
│  │  👤 Ibu Agnes — Sta. Theresia — ⏳ Belum respons 6jam │  │
│  │  [Hubungi via WA]                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan
| Komponen | Deskripsi |
|----------|-----------|
| `LansiaCheckButton` (DS §8.8) | Tombol cek pagi (2 opsi) |
| `LansiaDashboard.tsx` | Dashboard stats + daftar lansia |
| `LansiaFollowUpList.tsx` | Daftar lansia perlu follow-up |

## API Routes
| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/morning-check/respond` | POST | Respon cek pagi |

## Aturan Eskalasi
| Waktu | Tindakan |
|-------|----------|
| T+0 (06.00) | Push notification ke lansia/WDL |
| T+6 jam | Reminder kedua via push |
| T+12 jam | Reminder ketiga via WhatsApp |
| T+24 jam | KRITIS: notifikasi ke KL + Sosek |
| T+48 jam | Eskalasi ke Pastor Paroki |