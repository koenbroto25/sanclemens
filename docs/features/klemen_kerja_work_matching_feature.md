# Klemen Kerja & Work Matching — Lowongan & Tenaga Kerja

## Informasi Dokumen
- **Fase:** 6 — AI & Matching Solidaritas
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 6.1-6.2 — Klemen Kerja
- **Referensi Utama:**
  - [AI Spec v4.0] Bab XI "Bot 7: Klemen Kerja"
  - [AI Spec v4.0] Bab XIV "Matching Engine"
  - [UF v4.0] Bagian 13 "Dana Kasih & Klemen Kerja Matching Solidaritas"
  - [GDD v4.0] Bab IV.2 — tabel `lowongan_kerja`, `tenaga_kerja`, `donatur_potensial`
  - [DS v3.0] Bagian 8.27 "LowonganCard", 8.28 "TenagaKerjaCard", 8.29 "DonaturCard"

## Deskripsi
Sistem matching solidaritas yang mempertemukan kebutuhan dan potensi umat dalam 3 area: Lowongan Kerja, Tenaga Kerja, dan Donasi/Bantuan. Sistem menggunakan AI Intent Detection untuk mendeteksi kebutuhan dari percakapan dengan Bot 3 (Companion) atau Bot 7 (Klemen Kerja), kemudian melakukan matching dengan data yang tersedia.

## Tiga Area Matching

| Area | Input | Match Dengan | Confidence Threshold |
|------|-------|-------------|---------------------|
| **Lowongan Kerja** | "Saya butuh tukang cat" | `tenaga_kerja.keahlian` | ≥ 0.8 |
| **Tenaga Kerja** | "Saya cari kerja, bisa cat" | `lowongan_kerja.jenis` | ≥ 0.8 |
| **Donasi/Bantuan** | "Saya butuh sembako" | `donatur_potensial.preferensi` | ≥ 0.5 (verifikasi KL) |

## Alur Utama

### Alur Lowongan Kerja
| Langkah | Pelaku | Tindakan | Respon Sistem | Hasil |
|---------|--------|----------|---------------|-------|
| 1 | Umat (punya info lowongan) | Buka Bot 7 atau form Lowongan Kerja | Input: jenis, deskripsi, lokasi, gaji | Form tersedia |
| 2 | Umat | Submit lowongan | Simpan ke `lowongan_kerja` (status: open) | Lowongan aktif |
| 3 | Sistem | AI cocokkan dengan `tenaga_kerja` | Kirim notifikasi ke pencari kerja yang cocok | Matching |
| 4 | Pencari kerja | Terima notifikasi, lihat detail, tap "Lamar" | Lamaran tercatat di `lowongan_lamaran` | Lamaran terkirim |
| 5 | Pemilik lowongan | Lihat daftar pelamar, pilih | Status: diterima/ditolak | Lowongan terisi |

### Alur Donasi/Bantuan
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 0 | Donatur | Daftar jadi donatur potensial: preferensi, anonim, lokasi | Tersimpan |
| 1 | User butuh bantuan | Curhat ke Bot atau ajukan via Dana Kasih | Intent detected |
| 2 | Sistem | Cocokkan dengan `donatur_potensial` | Match ditemukan / tidak |
| 3 | KL (jika confidence 0.5-0.79) | Verifikasi: "[Nama] butuh sembako. Benar?" | Konfirmasi/tolak |
| 4 | Sistem | Pertemukan donatur dan penerima (anonim) | Bantuan tersalurkan |
| 5 | Komsos | Upload laporan dampak (anonim) | Status: terbantu |

## Database Schema

### Tabel `lowongan_kerja` (Baru)
```sql
CREATE TABLE public.lowongan_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pemasang_id UUID NOT NULL REFERENCES public.profiles(id),
    jenis TEXT NOT NULL,
    deskripsi TEXT,
    lokasi TEXT,
    estimasi_gaji DECIMAL(12,2),
    durasi TEXT,                          -- 'harian', 'mingguan', 'bulanan', 'proyek'
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'terisi')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
```

### Tabel `tenaga_kerja` (Baru)
```sql
CREATE TABLE public.tenaga_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    keahlian TEXT[] NOT NULL,
    pengalaman_tahun INTEGER,
    estimasi_upah DECIMAL(12,2),
    lokasi TEXT,
    tersedia BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0,
    total_ulasan INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `lowongan_lamaran` (Baru)
```sql
CREATE TABLE public.lowongan_lamaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lowongan_id UUID NOT NULL REFERENCES public.lowongan_kerja(id),
    pelamar_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT DEFAULT 'dikirim' CHECK (status IN ('dikirim', 'diterima', 'ditolak')),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lowongan_id, pelamar_id)
);
```

### Tabel `donatur_potensial` (Baru)
```sql
CREATE TABLE public.donatur_potensial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    preferensi TEXT[] NOT NULL,           -- ['sembako', 'uang', 'pakaian', 'waktu']
    is_anonim BOOLEAN DEFAULT TRUE,
    preferensi_lokasi TEXT CHECK (preferensi_lokasi IN ('lingkungan', 'wilayah', 'semua')),
    plafon_bulanan DECIMAL(12,2),
    is_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `umat_needs` (Baru)
```sql
CREATE TABLE public.umat_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    tipe_kebutuhan TEXT NOT NULL CHECK (tipe_kebutuhan IN ('pekerjaan', 'sembako', 'uang', 'pakaian', 'pendampingan', 'lainnya')),
    deskripsi TEXT,
    mention_count INTEGER DEFAULT 1,       -- Berapa kali disebut di percakapan
    confidence DECIMAL(3,2),               -- Confidence score dari AI
    status TEXT DEFAULT 'terdeteksi' CHECK (status IN ('terdeteksi', 'diverifikasi', 'terbantu', 'ditutup')),
    matched_donatur_id UUID REFERENCES public.donatur_potensial(id),
    verified_by UUID REFERENCES public.profiles(id),     -- KL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `LowonganCard` (DS §8.27) | Kartu lowongan pekerjaan |
| `TenagaKerjaCard` (DS §8.28) | Kartu profil tenaga kerja |
| `DonaturCard` (DS §8.29) | Kartu donatur potensial (admin/Komsos only) |
| `MatchingBoard` (DS §8.16) | Board matching antara lowongan dan tenaga kerja |

## AI Intent Detection Flow
```
User ngobrol dengan Bot 3 (Companion) atau Bot 7 (Klemen Kerja):
"Saya bingung, sudah 3 bulan nganggur"

↓ AI Intent Detection
  • Sentimen: cemas
  • Topik: pekerjaan
  • Intent: cari_kerja (confidence: 0.82)
  • Update umat_needs: mention_count +1

↓ AI respon:
"Wajar jika merasa cemas. Saya catat kebutuhan Bapak.
Apakah Bapak punya keahlian tertentu? Misal: tukang, supir?"

↓ User: "Saya bisa cat tembok"

↓ AI Matching Engine:
  • Cari lowongan_kerja WHERE jenis = 'tukang_cat' AND status = 'open'
  • Ditemukan: "Butuh 2 tukang cat untuk renovasi gereja" (match: 92%)
  • Tawarkan ke user: "Ada kabar baik! Lingkungan Santo Paulus butuh
    tukang cat. Mau saya hubungkan?"
```

## Cron Matching Mingguan
Setiap 6 jam, cron cocokkan `lowongan_kerja.status='open'` dengan `tenaga_kerja.tersedia=true`. Kirim WA: "Halo [Nama], ada lowongan [pekerjaan] di [lokasi]. Cocok dengan keahlian Anda."

## Aturan Bisnis
| Aturan | Detail |
|--------|--------|
| Lowongan expired | Otomatis closed setelah 30 hari |
| Donatur anonim | Identitas dienkripsi, laporan anonim |
| Verifikasi KL | Untuk confidence 0.5-0.79 |
| Fake report | Confidence < 0.5 → respon empati saja. Jika terulang → flag fake |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Tidak ada lowongan cocok | Simpan kebutuhan, notifikasi saat ada lowongan baru |
| Donatur ingin berhenti | Set `is_aktif = false`, tidak di-match lagi |
| Penerima dan donatur satu lingkungan | Prioritas matching satu lingkungan |
| Lowongan sudah terisi | Status closed, tidak di-match lagi |

## Referensi Halaman
- Bot 7: Klemen Kerja (in-app chat + WhatsApp)
- `src/app/(dashboard)/klemen-kerja/page.tsx`