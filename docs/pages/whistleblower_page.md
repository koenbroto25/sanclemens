# Halaman Whistle-Blower

## Informasi Halaman
- **Judul**: Whistle-Blower — Laporan Pelanggaran Anonim
- **URL**: `/whistle-blower`
- **Portal**: Portal 1 — Paroki
- **Layer Akses**: Semua user Layer 2+ (submit), Hanya Pastor Layer 9+ (melihat laporan)
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal 1 Palette**: `--primary: #1e3a5f`, `--accent: #c9a227`
- **Nuansa**: Privasi absolut, anonim, aman

## Wireframe — Form Laporan

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "🔒 WHISTLE-BLOWER"                                │
│  Breadcrumb: Portal 1 > Whistle-Blower                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ╔════════════════════════════════════════════════════════╗  │
│  │  🛡️ LAPORAN INI DIJAMIN ANONIM                       ║  │
│  │  Identitas Anda TIDAK akan dicatat dalam sistem.      ║  │
│  │  IP address, device info, dan user agent tidak disimpan║  │
│  ╚════════════════════════════════════════════════════════╝  │
│                                                              │
│  Kategori Laporan:                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ○ Keuangan (penyimpangan dana)                        │  │
│  │  ○ Penyalahgunaan wewenang                             │  │
│  │  ○ Pelanggaran kode etik                               │  │
│  │  ○ Lainnya                                             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Isi Laporan:                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [________________________________________________]    │  │
│  │ [________________________________________________]    │  │
│  │ [________________________________________________]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Lampiran (opsional):                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 📎 Upload bukti/dokumen (max 3 file, 5MB per file)     │  │
│  │ [Browse...]                                             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ☑️ Saya mengerti: Laporan ini bersifat anonim dan tidak    │
│  bisa ditarik kembali setelah dikirim                        │
│                                                              │
│  [🔒 Kirim Laporan Anonim]                                  │
│                                                              │
│  ╔════════════════════════════════════════════════════════╗  │
│  │  💡 Laporan akan dikirim langsung ke Pastor Paroki    ║  │
│  │  tanpa melewati pengurus lain.                        ║  │
│  ╚════════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan
| Komponen | Deskripsi |
|----------|-----------|
| `WhistleblowerForm.tsx` | Form laporan anonim dengan E2E indicator |
| `WhistleblowerTracker.tsx` | Lacak status laporan dengan kode anonim |

## API Routes
| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/whistleblower/submit` | POST | Submit laporan (tanpa user_id/IP) |

## Keamanan
- **Identitas pelapor**: TIDAK pernah tersimpan
- **Konten laporan**: AES-256-GCM encrypted
- **Akses laporan**: Hanya Pastor (Layer 9+)
- **Super Admin**: TIDAK bisa akses isi laporan