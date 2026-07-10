# Daily Elderly Check — Cek Lansia Harian

## Informasi Dokumen
- **Fase:** 2 — Inklusivitas & Rohani
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 2.4 — Cek Lansia Harian
- **Referensi Utama:**
  - [GDD v4.0] Bab IV.2 — tabel `profiles` (kolom `is_lansia`, `last_morning_check`, `tinggal_sendiri`)
  - [GDD v4.0] Bab XIII "Real-Time & Notifikasi" — push notification untuk cek pagi
  - [UF v4.0] Bagian 10 "Cek Lansia Harian"
  - [DS v3.0] Bagian 8.8 "LansiaCheckButton" — komponen tombol cek keselamatan

## Deskripsi
Fitur Cek Lansia Harian adalah sistem notifikasi pagi untuk memastikan keselamatan dan kesejahteraan umat lansia (usia > 60) yang terdaftar di sistem. Setiap pagi, lansia atau Wali Digital (WDL) mereka akan menerima notifikasi untuk mengonfirmasi keadaan. Jika tidak ada respons dalam 24 jam, sistem akan mengirimkan notifikasi eskalasi ke Ketua Lingkungan dan Sub Bidang Sosek.

## Tujuan
- Memastikan kesejahteraan harian umat lansia yang tinggal sendiri atau rentan
- Mendeteksi dini jika ada lansia yang membutuhkan bantuan
- Memberikan ketenangan bagi keluarga dan pengurus lingkungan

## Alur Utama

### Alur Cek Pagi
| Langkah | Pelaku | Tindakan | Respon Sistem | Hasil |
|---------|--------|----------|---------------|-------|
| 1 | Sistem | Notifikasi push pagi (06.00 WITA) ke lansia/WDL | "Apakah Anda baik-baik saja hari ini?" | Notifikasi terkirim |
| 2 | Lansia/WDL | Tap notifikasi, buka halaman cek | Tampilkan 2 opsi: "Ya, baik" / "Perlu bantuan" | Halaman cek tampil |
| 3 | Lansia/WDL | Tap "Ya, baik" | Catat `last_morning_check = NOW()`, status `aman` | Cek selesai |
| 4 | Sistem | Jika "Perlu bantuan" | Notifikasi ke KL dan Sub Bidang Sosek | Bantuan difollow-up |
| 5 | KL/WDL | Buka dashboard Cek Lansia | Lihat daftar lansia yang perlu follow-up | Tindak lanjut |

### Alur Eskalasi (Jika Tidak Respons)
| Waktu | Tindakan Sistem |
|-------|----------------|
| T+0 (06.00) | Notifikasi push ke lansia/WDL |
| T+6 jam (12.00) | Reminder kedua via notifikasi push |
| T+12 jam (18.00) | Reminder ketiga via WhatsApp (jika ada nomor) |
| T+24 jam (06.00 besok) | Jika masih belum respons: notifikasi **KRITIS** ke KL + Sub Bidang Sosek |
| T+48 jam | Eskalasi ke Pastor Paroki |

### Alur WDL Proxy untuk Lansia
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 1 | WDL | Buka halaman "Kelola Lansia" | Daftar lansia yang di-proxy muncul |
| 2 | WDL | Klik "Cek Pagi" atas nama lansia | Form konfirmasi atas nama lansia |
| 3 | WDL | Pilih "Ya, baik" atau "Perlu bantuan" | Status tercatat dengan catatan "dilapor oleh WDL [Nama]" |

## Database Schema

### Kolom pada Tabel `profiles`
```sql
-- Kolom tambahan untuk cek lansia (sudah ada di profil)
-- is_lansia: BOOLEAN (auto-set jika usia > 60)
-- last_morning_check: TIMESTAMPTZ
-- tinggal_sendiri: BOOLEAN
-- wdl_proxy_id: UUID REFERENCES profiles(id) (opsional)
```

### Tabel `morning_check_logs` (Baru)
```sql
CREATE TABLE public.morning_check_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lansia_id UUID NOT NULL REFERENCES public.profiles(id),
    checker_id UUID REFERENCES public.profiles(id),       -- WDL jika proxy, NULL jika self-check
    status TEXT NOT NULL CHECK (status IN ('aman', 'butuh_bantuan', 'tidak_respons')),
    catatan TEXT,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lansia_id, check_date)                          -- Satu cek per hari per lansia
);

CREATE INDEX idx_morning_check_date ON public.morning_check_logs(check_date);
CREATE INDEX idx_morning_check_status ON public.morning_check_logs(status);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `LansiaCheckButton` (DS §8.8) | Tombol cek pagi (2 opsi) |
| `LansiaDashboard.tsx` | Dashboard KL/WDL: daftar lansia + status |
| `LansiaFollowUpList.tsx` | Daftar lansia yang perlu follow-up |

## Notifikasi
| Jenis | Waktu | Penerima | Channel |
|-------|-------|----------|---------|
| Cek pagi rutin | 06.00 WITA | Lansia, WDL | Push notification |
| Reminder 1 | 12.00 WITA | Lansia, WDL | Push notification |
| Reminder 2 | 18.00 WITA | Lansia, WDL | WhatsApp (jika ada) |
| Eskalasi | T+24 jam | KL, Sub Bidang Sosek | WhatsApp + Push |
| Eskalasi Pastor | T+48 jam | Pastor | WhatsApp + Push |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Lansia tanpa smartphone | WDL proxy melakukan cek atas nama lansia |
| Lansia tanpa WDL | Eskalasi langsung ke KL setelah 24 jam |
| Lansia dirawat di rumah sakit | Keluarga/WDL set status "dirawat" — pause cek harian |
| Lansia meninggal | Update status profil, hapus dari daftar cek harian |
| WDL tidak respons | Eskalasi ke KL untuk follow-up WDL |
| Ganda cek (lansia + WDL) | Prioritas respons terakhir, dicatat keduanya |

## Referensi Halaman
- `src/app/(pastoral)/lansia/page.tsx` — Halaman utama Cek Lansia
- Dashboard KL: daftar lansia yang perlu di-follow up