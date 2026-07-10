# Halaman Surat Pastoral

## Informasi Halaman
- **Judul**: Surat Pastoral — Komunikasi Pribadi Pastor & Umat
- **URL**: `/surat-pastoral` (Umat) | `/pastor/surat` (Pastor)
- **Portal**: Portal 1 — Paroki
- **Layer Akses**:
  - Umat (Layer 2+): Melihat surat masuk di `/surat-pastoral`
  - Pastor (Layer 9+): Kirim & kelola surat di `/pastor/surat`
- **Fase**: 2 — Inklusivitas & Rohani (Sub-Fase 2.3)
- **Status**: ⬜ Belum Dimulai

## Referensi Desain
- **Portal 1 Palette**: `--primary: #1e3a5f`, `--accent: #c9a227` (emas)
- **Typography**: Cormorant Garamond (heading), Inter (body)
- **Nuansa**: Sakral, private, terenkripsi

## Wireframe — Inbox Umat

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: "✉️ SURAT PASTORAL" — sanclemens.com               │
│  Breadcrumb: Portal 1 > Surat Pastoral                      │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  📬 SURAT MASUK                                        │  │
│  │  ───────────────                                       │  │
│  │  📩 Surat: "Kabar Sukacita Paskah"                    │  │
│  │  Dari: Pastor Paroki  |  Tgl: 12 Jun 2026              │  │
│  │  Status: 🟢 Baru diterima                              │  │
│  │  ────────────────────────────────────────               │  │
│  │  📩 Surat: "Doa untuk Ujian Nasional"                  │  │
│  │  Dari: Pastor Paroki  |  Tgl: 10 Jun 2026              │  │
│  │  Status: ⚪ Sudah dibaca                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ╔════════════════════════════════════════════════════════╗  │
│  │  🔒 ENKRIPSI E2E AKTIF                                ║  │
│  │  Isi surat hanya bisa dibaca oleh Anda & Pastor       ║  │
│  ╚════════════════════════════════════════════════════════╝  │
│                                                              │
│  FOOTER: © 2026 Paroki Santo Klemens — sanclemens.com       │
└──────────────────────────────────────────────────────────────┘
```

## Wireframe — Detail Surat (Umat)

```
┌──────────────────────────────────────────────────────────────┐
│  🔒 KIRIM SURAT PASTORAL                                    │
│  Breadcrumb: Portal 1 > Surat Pastoral > Detail             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Dari: Pastor Paroki (Lingkungan St. Klemens)          │  │
│  │  Ke: Andi Handoko (Lingkungan Santo Yusuf)             │  │
│  │  Tanggal: 12 Juni 2026, 10.30 WITA                     │  │
│  │                                                        │  │
│  │  ═══════════════════════════════════════════════════    │  │
│  │                                                        │  │
│  │  KABAR SUKACITA PASKAH                                 │  │
│  │                                                        │  │
│  │  Saudara/i terkasih di Kristus,                        │  │
│  │  Selamat merayakan Hari Paskah...                      │  │
│  │                                                        │  │
│  │  ═══════════════════════════════════════════════════    │  │
│  │  🔒 Dienkripsi dengan AES-256-GCM                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Kembali ke Daftar]                                         │
└──────────────────────────────────────────────────────────────┘
```

## Wireframe — Kirim Surat (Pastor)

```
┌──────────────────────────────────────────────────────────────┐
│  ✉️ KIRIM SURAT PASTORAL                                    │
│  Breadcrumb: Portal 1 > Pastor > Kirim Surat                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Pilih Penerima:                                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔍 Cari nama atau lingkungan umat...                    │  │
│  │ 👤 Maria Handoko — Lingk. Santo Yusuf                   │  │
│  │ 👤 Andreas Handoko — Lingk. Santo Yusuf                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Subjek:                                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [________________________________________________]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Isi Surat:                                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [________________________________________________]    │  │
│  │ [________________________________________________]    │  │
│  │ [________________________________________________]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ☑️ Saya setuju: Surat ini akan dienkripsi E2E              │
│  dan hanya bisa dibaca oleh penerima                         │
│                                                              │
│  [🔒 Kirim & Enkripsi]                                      │
│                                                              │
│  ────────────────────────────────────────────────────────    │
│  Riwayat Surat Terkirim:                                     │
│  │ 📩 "Doa untuk Ujian Nasional" — Andi — 10 Jun — ✅  │    │
│  │ 📩 "Ucapan Lebaran" — Maria — 5 Jun — ✅ Dibaca   │    │
└──────────────────────────────────────────────────────────────┘
```

## Komponen yang Digunakan
| Komponen | Deskripsi |
|----------|-----------|
| `PastoralLetterList` | Daftar surat masuk/terkirim |
| `PastoralLetterDetail` | Tampilan isi surat (dekripsi otomatis) |
| `PastoralLetterCompose` | Form kirim surat (Pastor only) |

## API Routes
| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/pastoral-letter/inbox` | GET | Daftar surat masuk (umat) |
| `/api/pastoral-letter/send` | POST | Kirim surat (pastor) |

## Catatan
- Isi surat dienkripsi dengan AES-256-GCM
- Kunci dekripsi hanya dimiliki sender (Pastor) dan recipient (umat)
- Super Admin (Layer 10) TIDAK bisa membuka isi surat (Privacy First)
- Status surat: `sent` → `read` → `archived`