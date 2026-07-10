# Paroki Digital Santo Klemens

Aplikasi web Paroki Santo Klemens Sepinggan (Keuskupan Agung Samarinda) — ekosistem digital umat Katolik berbasis Next.js + Supabase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend / DB**: Supabase (PostgreSQL + pgvector + Auth + Storage + Edge Functions)
- **Package Manager**: pnpm

## Struktur Utama

| Path | Keterangan |
|------|------------|
| `src/app/public/page.tsx` | **Homepage** publik (jadwal misa, warta, liturgi harian, kegiatan, bot paroki) |
| `src/app/page.tsx` | Root page, redirect ke `/public` |
| `src/app/auth/` | Login & registrasi umat |
| `src/app/dashboard/`, `src/app/admin/`, `src/app/super-admin/` | Portal berdasarkan peran |
| `src/app/marketplace/` | Marketplace ekonomi internal paroki |
| `src/app/api/` | API routes (auth, bot, liturgi, marketplace, sos, dll) |
| `supabase/migrations/` | Migrasi skema database |
| `src/lib/ai/` | Modul AI / RAG / bot teologi |

## Menjalankan Lokal

```bash
pnpm install
cp .env.example .env.local   # isi variabel Supabase
pnpm dev
```

Buka http://localhost:3000 — Anda akan diarahkan ke homepage publik (`/public`).

## Catatan Repo

Folder berikut **tidak di-commit** (lihat `.gitignore`):
- `v5/` (arsip rencana/AI), `surat-surat/`, `reference v3/`, `api source/`
- `scripts/backup/`, file `.rar`, dump schema mentah
- `.env`, `.env.local` (rahasia)
- `.next/`, `node_modules/`

`pnpm-lock.yaml` dan `.env.example` **di-commit** secara sengaja.