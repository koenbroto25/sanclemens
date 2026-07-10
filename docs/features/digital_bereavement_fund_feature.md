# Digital Bereavement Fund — Dana Duka Digital

## Informasi Dokumen
- **Fase:** 3 — Solidaritas & Keuangan
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 3.4 — Dana Duka Digital
- **Referensi Utama:**
  - [GDD v4.0] Bab XI "Dual-Ledger Financial Engine" — RK-2 sumber dana Dana Duka
  - [GDD v4.0] Bab IV.2 — tabel `dana_kasih` untuk mekanisme pencairan
  - [UF v4.0] Bagian 11 "Dana Kasih"
  - [GDD v4.0] Bab XI "Dual-Ledger Financial Engine" — Pencairan Dana Duka: Bendahara II input, KL wilayah approve, Sekretaris I (arsip)

## Deskripsi
Sistem pengelolaan iuran dan pencairan Dana Duka secara digital. Memungkinkan pencatatan iuran rutin, pencairan otomatis saat ada keluarga berduka, serta integrasi dengan Pastoral SOS untuk deteksi dini.

## Tujuan
- Digitalisasi pencatatan iuran Dana Duka per lingkungan
- Mempercepat proses pencairan saat ada keluarga berduka
- Menyediakan riwayat iuran dan pencairan yang transparan
- Integrasi dengan SOS untuk deteksi dini

## Alur Utama

### Alur Iuran Dana Duka
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Bendahara II | Input iuran Dana Duka per lingkungan | Catat iuran ke rekening RK-2 | Iuran tercatat |
| 2 | Umat | Lihat tagihan iuran di Portal 2 | Status: LUNAS / BELUM | Informasi iuran |
| 3 | Sistem | Generate laporan iuran bulanan | Daftar pembayar & tunggakan | Laporan siap |

### Alur Pencairan Dana Duka
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Sistem | Menerima laporan kematian (dari SOS / input manual) | Trigger proses Dana Duka | Proses dimulai |
| 2 | Bendahara II | Input pencairan Dana Duka | Status: DIAJUKAN | Siap approval |
| 3 | KL wilayah duka | Approve pencairan | Status: DISETUJUI | Approval diberikan |
| 4 | Sekretaris I | Menerima arsip pencairan | Status: TERSALURKAN | Arsip digital |
| 5 | Sistem | Kirim notifikasi ke keluarga berduka | "Dana Duka telah disalurkan" | Keluarga tahu |

### Integrasi dengan Pastoral SOS
| Kondisi | Tindakan Sistem |
|---------|----------------|
| SOS dengan jenis "Pengurapan Orang Sakit" dicurigai kematian | Notifikasi ke KL untuk konfirmasi |
| KL konfirmasi kematian | Trigger otomatis proses Dana Duka |
| SOS "Kecelakaan" dengan kondisi kritis | Notifikasi ke Bendahara II + KL untuk persiapan Dana Duka |

## Database Schema

### Tabel `dana_duka_iuran` (Existing)
```sql
CREATE TABLE public.dana_duka_iuran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lingkungan_id UUID NOT NULL REFERENCES public.lingkungan(id),
    periode TEXT NOT NULL,                  -- Format: YYYY-MM
    nominal DECIMAL(12,2) NOT NULL,
    total_wajib INTEGER,                    -- Jumlah KK wajib iuran
    total_pembayar INTEGER,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `dana_duka_pencairan` (Baru)
```sql
CREATE TABLE public.dana_duka_pencairan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_berduka_id UUID NOT NULL REFERENCES public.families(id),
    lingkungan_id UUID NOT NULL REFERENCES public.lingkungan(id),
    nominal DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'diajukan' CHECK (status IN ('diajukan', 'disetujui', 'tersalurkan', 'ditolak')),
    diajukan_oleh UUID REFERENCES public.profiles(id),        -- Bendahara II
    disetujui_oleh UUID REFERENCES public.profiles(id),       -- KL wilayah
    diarsip_oleh UUID REFERENCES public.profiles(id),         -- Sekretaris I
    tanggal_meninggal DATE,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `DanaDukaForm.tsx` | Form input iuran/pencairan |
| `DanaDukaCard.tsx` | Kartu status Dana Duka per lingkungan |
| `DanaDukaHistory.tsx` | Riwayat iuran & pencairan |
| `BereavementNotification.tsx` | Notifikasi keluarga berduka |

## Aturan Bisnis
| Aturan | Detail |
|--------|--------|
| Sumber dana | RK-2 (Dana Sosial & Kasih) |
| Pencairan | Bendahara II input → KL approve → Sekretaris I arsip |
| Iuran rutin | Per bulan, per KK |
| Notifikasi KL | Otomatis saat ada keluarga berduka di wilayahnya |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Keluarga berduka tidak terdaftar di sistem | Input manual oleh KL, buat record sementara |
| Dana tidak cukup | Notifikasi ke Bendahara II, prioritaskan pencairan |
| KL tidak approve dalam 3 hari | Eskalasi ke Wakil Ketua II |
| Pencairan ganda (satu keluarga dilaporkan 2x) | Cek duplikasi berdasarkan nama + tanggal |

## Referensi Halaman
- `src/app/(pastoral)/dana-duka/page.tsx` — Halaman Dana Duka