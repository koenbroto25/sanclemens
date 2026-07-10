# 3 Doors of Charity — Tiga Pintu Kasih

## Informasi Dokumen
- **Fase:** 3 — Solidaritas & Keuangan
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 3.2 — 3 Pintu Kasih
- **Referensi Utama:**
  - [GDD v4.0] Bab XI "Dual-Ledger Financial Engine" — pencairan dari RK-2
  - [UF v4.0] Bagian 11 "Dana Kasih (3 Pintu Kasih)"
  - [DS v3.0] Bagian 8.3 "TigaPintuCard" — komponen UI tiga pintu
  - [DS v3.0] Bagian 10.7 "Tiga Pintu Kasih (Layer 2)"

## Deskripsi
Tiga Pintu Kasih adalah sistem bantuan terstruktur yang memungkinkan umat mengajukan permintaan bantuan, berdonasi, dan menyalurkan bantuan melalui tiga jalur (pintu) yang berbeda. Sistem ini mengimplementasikan prinsip **Invisible Grace** di mana identitas donatur dan penerima dilindungi.

## Tiga Pintu Kasih

### Pintu 1 — SOS (Darurat)
Bantuan darurat untuk situasi mendesak (kecelakaan, sakit kritis, musibah).
- **Pengaju:** Umat atau KL
- **Alur:** Ajukan → Langsung ke Dashboard Sosek → Verifikasi cepat → Pencairan
- **Waktu:** Target pencairan < 24 jam
- **Batas:** Rp 5.000.000 per kejadian

### Pintu 2 — Kasih (Non-Darurat)
Bantuan non-darurat untuk kebutuhan yang sudah direncanakan.
- **Pengaju:** Umat
- **Alur:** Ajukan → Verifikasi Sub Bidang Sosek → Approval → Pencairan
- **Waktu:** 3-7 hari
- **Batas:** Rp 5.000.000 per kejadian

### Pintu 3 — Donasi
Donasi sukarela dari umat untuk mendukung program kasih.
- **Pelaku:** Semua umat
- **Alur:** Pilih nominal → Bayar via Xendit → Dana masuk RK-2
- **Prinsip:** Invisible Grace (anonim)

## Alur Utama

### Alur Pengajuan Bantuan (Pintu 1 & 2)
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Umat/KL | Buka halaman 3 Pintu Kasih, pilih Pintu 1 atau 2 | Form pengajuan sesuai pintu | Form siap |
| 2 | Umat/KL | Isi: jenis bantuan, kebutuhan, nominal, keterangan | Data tersimpan, status: DIAJUKAN | Permintaan tercatat |
| 3 | Sub Bidang Sosek | Verifikasi kebutuhan di lapangan + upload formulir + foto consent | Status: TERVERIFIKASI + rekomendasi nominal | Siap approval |
| 4 | Bendahara II + WK II | Multi-signature approval pencairan | Transfer dari RK-2 ke rekening penerima | Dana cair |
| 5 | Sub Bidang Sosek | Upload laporan dampak: narasi anonim + foto bukti | Status: DISALURKAN | Selesai |
| 6 | Sistem | Generate laporan Dana Kasih bulanan otomatis | PDF dikirim LANGSUNG ke Pastor + WK II | Laporan bulanan |

### Alur Donasi (Pintu 3)
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 1 | Umat | Buka Pintu 3 — Donasi | Pilih nominal donasi |
| 2 | Umat | Pilih metode pembayaran (transfer/QRIS) | Bayar via Xendit |
| 3 | Sistem | Konfirmasi pembayaran, dana masuk RK-2 | Donasi tercatat (anonim) |
| 4 | Umat | Menerima konfirmasi (tanpa disebut nominal di publik) | Invisible Grace terjaga |

## Database Schema

### Tabel `kasih_requests` (Existing)
```sql
CREATE TABLE public.kasih_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengaju_id UUID NOT NULL REFERENCES public.profiles(id),
    pintu INTEGER NOT NULL CHECK (pintu IN (1, 2)),
    jenis_bantuan TEXT NOT NULL,
    nominal DECIMAL(12,2),
    keterangan TEXT,
    status TEXT DEFAULT 'diajukan' CHECK (status IN ('diajukan', 'diverifikasi', 'disetujui', 'dicairkan', 'disalurkan', 'ditolak')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `kasih_approvals` (Existing)
```sql
CREATE TABLE public.kasih_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.kasih_requests(id),
    approver_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `TigaPintuCard` (DS §8.3) | Kartu untuk masing-masing pintu |
| `KasihRequestForm.tsx` | Form pengajuan bantuan |
| `KasihStatusTracker.tsx` | Tracking status pengajuan |
| `DanaKasihProgress` (DS §8.4) | Progress bar donasi |

## Aturan Bisnis
| Aturan | Detail |
|--------|--------|
| Batas per kejadian | Rp 5.000.000 (konfigurasi) |
| Di atas batas | Approval langsung Pastor |
| Frekuensi maksimal | 3 kali dalam 12 bulan per keluarga |
| Penerima tanpa rekening | Pencairan melalui KL setempat + bukti serah terima fisik + foto (consent) |
| Laporan dampak | ANONIM — identitas individual TIDAK diekspos |

## Laporan Bulanan Dana Kasih
- Sistem generate laporan PDF otomatis setiap bulan
- Dikirim langsung ke Pastor + Wakil Ketua II
- Isi: total donasi masuk, total pencairan, jumlah penerima (anonim), saldo RK-2

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Pengajuan ditolak | Notifikasi ke pengaju dengan alasan |
| Penerima meninggal sebelum pencairan | Dana kembali ke pool, notifikasi ke keluarga |
| Donatur ingin donasi untuk penerima spesifik | Bisa, tapi identitas tetap dilindungi (Invisible Grace) |
| Verifikasi lapangan tidak bisa dilakukan | Sub Bidang Sosek hubungi KL setempat untuk konfirmasi |

## Referensi Halaman
- `src/app/(pastoral)/dana-kasih/page.tsx` — Halaman 3 Pintu Kasih