# KPD & KTPD Management — Kegiatan dengan/tanpa Permohonan Dana

## Informasi Dokumen
- **Fase:** 2 — Inklusivitas & Rohani
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 2.5 — KPD & KTPD Penuh
- **Referensi Utama:**
  - [GDD v4.0] Bab IX "Modul Kegiatan & Anggaran" — dua jenis kegiatan, approval flow, LPJ
  - [GDD v4.0] Bab XI "Dual-Ledger Financial Engine" — multi-signature approval per rentang nominal
  - [UF v4.0] Bagian 12 "KPD & KTPD"
  - [DS v3.0] Bagian 8.6 "ApprovalTracker" — komponen UI tracking status pengajuan
  - [DS v3.0] Bagian 10.14 "Koordinator Bidang (Layer 7)" — desain halaman pengajuan kegiatan

## Deskripsi
Sistem pengelolaan kegiatan paroki yang dibagi menjadi dua jenis: **KPD (Kegiatan dengan Permohonan Dana)** untuk kegiatan yang memerlukan anggaran, dan **KTPD (Kegiatan Tanpa Permohonan Dana)** untuk kegiatan sederhana tanpa rincian anggaran. Keduanya memiliki alur approval dan LPJ yang berbeda.

## Perbedaan KPD vs KTPD

| Aspek | KPD | KTPD |
|-------|-----|------|
| Anggaran | Ada (rincian per pos) | Tidak ada |
| Approval Flow | 7 langkah (hingga Pastor) | 3 langkah (hingga Koord. Bidang) |
| LPJ | Detail: realisasi anggaran, foto, bukti pengeluaran | Ringkas: peserta, ringkasan max 300 kata, foto min 1 |
| Blokir jika terlambat | Iya (> 14 hari) | Iya (> 14 hari) |

## Alur KPD (7 Langkah Approval)

```
Step 1: Koord. Bidang isi KPD → Draft tersimpan
Step 2: Submit → Status SUBMITTED, notifikasi ke Sekretaris I
Step 3: Sekretaris I review kelengkapan → Jika lengkap: REVIEW WK; Jika kurang: kembalikan
Step 4: Wakil Ketua I/II review substansi → Jika < batas nilai: DISETUJUI; Jika >= batas: ke Pastor
Step 5: Pastor approval final (jika di atas batas nilai) → Jika tidak respons 48 jam: eskalasi ke Vikaris
Step 6: Bendahara cairkan dana → Multi-signature, audit log tersimpan
Step 7: Koord. upload LPJ maks 7 hari → Reminder H+1,3,7. Blokir jika > 14 hari
```

### Detail Alur KPD
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Koord. Bidang | Isi form KPD: nama, tujuan, tanggal, PIC, rincian anggaran per pos, pilih rekening sumber | Auto-cek saldo: peringatan jika tidak cukup | Draft tersimpan |
| 2 | Koord. Bidang | Submit KPD | Status → SUBMITTED, notifikasi ke Sekretaris I | KPD masuk antrian review |
| 3 | Sekretaris I | Review kelengkapan dokumen | Jika lengkap → REVIEW WK. Jika kurang → kembalikan dengan catatan | Status update |
| 4 | Wakil Ketua I/II | Review substansi kegiatan | Jika < batas nilai → DISETUJUI. Jika >= batas → ke Pastor | Status update |
| 5 | Pastor | Approval final (jika diperlukan) | Jika tidak respons 48 jam → eskalasi ke Vikaris | Final approval |
| 6 | Bendahara | Cairkan dana | Multi-signature, audit log tersimpan | Dana cair |
| 7 | Koord. Bidang | Upload LPJ (maks 7 hari setelah kegiatan) | Reminder H+1, H+3, H+7. Blokir jika > 14 hari | Kegiatan selesai |

## Alur KTPD (3 Langkah)

```
Step 1: Koord. Bidang isi KTPD → Submit
Step 2: Wakil Ketua approve (ringkas, 1 langkah)
Step 3: LPJ ringkas (maks 7 hari)
```

## Template Laporan Standar (6 Template)

Berdasarkan [GDD] Bab IX, terdapat 6 template laporan standar:

| No | Template | Isi | Digunakan Untuk |
|----|----------|-----|-----------------|
| 1 | Laporan Kegiatan Umum (KPD) | Peserta aktual, ringkasan, realisasi anggaran per pos, foto (min 2), bukti pengeluaran, evaluasi | KPD |
| 2 | Laporan Kegiatan Ringkas (KTPD) | Peserta, ringkasan (maks 300 kata), foto (min 1), evaluasi singkat | KTPD |
| 3 | Laporan Liturgi & Jadwal Petugas | Jenis misa, petugas hadir/tidak hadir, pengganti, catatan khusus | Kegiatan liturgi |
| 4 | Laporan Kegiatan Sosial (Anonim) | Jenis bantuan, penerima (ANONIM), foto bukti (consent wajib), narasi dampak anonim | Kegiatan sosial |
| 5 | Laporan Pembinaan Iman & Katekese | Jenis pembinaan, sesi ke-, materi, fasilitator, peserta, foto, ringkasan materi | Pembinaan iman |
| 6 | Laporan Periodik Bulanan | Total kegiatan, anggaran vs realisasi, highlight, kendala, rencana bulan depan | Periodik |

## Database Schema

### Tabel Existing (diperbarui)
```sql
-- Tabel kegiatan sudah ada: public.kegiatan
-- Tambah kolom untuk tipe KPD/KTPD
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS tipe TEXT CHECK (tipe IN ('kpd', 'ktpd'));
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS anggaran_per_pos JSONB;   -- Untuk KPD
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS status_lpj TEXT DEFAULT 'belum' CHECK (status_lpj IN ('belum', 'terkirim', 'terlambat'));
ALTER TABLE public.kegiatan ADD COLUMN IF NOT EXISTS lpj_deadline TIMESTAMPTZ;
```

### Tabel `kegiatan_approvals` (Baru)
```sql
CREATE TABLE public.kegiatan_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kegiatan_id UUID NOT NULL REFERENCES public.kegiatan(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public.profiles(id),
    step INTEGER NOT NULL,                        -- 1-7 untuk KPD, 1-3 untuk KTPD
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
    catatan TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kegiatan_id, step)
);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `ApprovalTracker` (DS §8.6) | Progress bar status approval (step 1-7) |
| `KegiatanForm.tsx` | Form pengajuan KPD/KTPD |
| `LPJForm.tsx` | Form upload LPJ dengan template |
| `ReminderBanner.tsx` | Banner pengingat LPJ deadline |
| `BlokirBadge.tsx` | Badge blokir jika LPJ > 14 hari |

## Aturan Bisnis

### Batas Approval Berdasarkan Nilai
| Rentang Nilai | Approval Sampai |
|---------------|----------------|
| < Rp 1.000.000 | Wakil Ketua I/II |
| Rp 1.000.000 - Rp 5.000.000 | Pastor |
| > Rp 5.000.000 | Pastor + Tim Audit |

### Reminder & Blokir LPJ
| Waktu | Tindakan |
|-------|----------|
| H+1 setelah kegiatan | Reminder otomatis ke Koord. Bidang |
| H+3 | Reminder kedua |
| H+7 | Deadline LPJ |
| H+8 hingga H+14 | Status TERLAMBAT, masih bisa upload |
| > H+14 | Blokir pengajuan baru dari bidang tersebut |

### Eskalasi Approval
| Kondisi | Tindakan |
|---------|----------|
| Wakil Ketua tidak respons 24 jam | Reminder otomatis |
| Pastor tidak respons 48 jam | Eskalasi ke Vikaris |
| Vikaris tidak respons 48 jam | Eskalasi ke Keuskupan |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Saldo rekening tidak cukup untuk KPD | Peringatan otomatis saat input, tidak bisa submit |
| Foto kegiatan tidak memenuhi syarat | Kompresi otomatis < 300 KB, peringatan jika kurang dari min jumlah |
| Kegiatan dibatalkan setelah approval | Pembatalan harus dengan alasan, notifikasi ke semua approver |
| Koordinator Bidang berganti di tengah | LPJ tetap bisa diupload oleh koordinator baru (jika authorized) |
| Anggaran tidak sesuai realisasi | LPJ wajib mencantumkan selisih dan alasan |

## Referensi Halaman
- `src/app/(pastoral)/kegiatan/kpd/page.tsx` — Form pengajuan KPD
- `src/app/(pastoral)/kegiatan/ktpd/page.tsx` — Form pengajuan KTPD