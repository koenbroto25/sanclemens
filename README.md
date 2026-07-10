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

## Deploy ke Vercel

1. Import repo `koenbroto25/sanclemens` di dashboard Vercel (Framework Preset: Next.js).
2. **Build & Install settings** (otomatis terbaca dari `vercel.json`):
   - Package Manager: `pnpm`
   - Build Command: `pnpm build`
   - Output: `.next`
3. **Environment Variables** di Vercel → Project → Settings (isi dari `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (isi dengan domain Vercel, mis. `https://sanclemens.vercel.app`)
   - `NEXT_PUBLIC_PASTOR_PHONE`
   - `AI_COMPANION_MODEL`
   - `RESEND_API_KEY` (jika pakai email)
   - Lainnya (Fonnte, Firebase, Xendit, encryption keys) opsional sesuai fitur.
4. Deploy. Domain root `/` otomatis redirect ke `/public` (homepage).

> Catatan: `vercel.json` menonaktifkan auto-deploy untuk branch `master`; deploy terjadi dari branch `main` (default). Pastikan `main` adalah production branch di Vercel.
