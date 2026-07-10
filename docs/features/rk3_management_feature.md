# RK-3 Management — Rekening Khusus Ekonomi & Digital

## Informasi Dokumen
- **Fase:** 4 — Ekonomi Internal
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 4.5 — RK-3 Aktif
- **Referensi Utama:**
  - [GDD v4.0] Bab XI.1 "Chart of Accounts" — RK-3 Ekonomi & Digital (Ledger B)
  - [GDD v4.0] Bab XI "Dual-Ledger Financial Engine" — Operasional App 2 & ICT
  - [masterplan v4.0] Sub-Fase 4.5

## Deskripsi
RK-3 (Rekening Khusus 3) adalah rekening untuk aktivitas ekonomi digital dan ICT. Sumber dana berasal dari fee marketplace, fee Kolom Umat, iklan mitra, dan komisi App 2. Pengeluaran RK-3 digunakan untuk operasional portal ekonomi, pengembangan ICT, dan biaya operasional sistem.

## Sumber Dana RK-3
| Sumber | Persentase | Keterangan |
|--------|-----------|------------|
| Fee Marketplace | 3-5% per transaksi | Dari penjualan di Pasar Kasih |
| Fee Kolom Umat | Tetap | Dari iklan/promosi umat |
| Iklan Mitra | Negosiasi | Dari mitra eksternal |
| Komisi App 2 | Variabel | Dari layanan ojek solidaritas |

## Alur Utama

### Alur Pemasukan RK-3
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Sistem | Fee marketplace otomatis dipotong saat transaksi | Dana masuk RK-3 | Pemasukan tercatat |
| 2 | Bendahara III | Input pemasukan dari sumber lain (manual) | Verifikasi otomatis | Pemasukan tercatat |
| 3 | Sistem | Generate laporan pemasukan bulanan | RK-3 balance update | Laporan siap |

### Alur Pengeluaran RK-3
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Bendahara III | Input pengajuan pengeluaran | Cek saldo, tentukan tingkat approval | Pengajuan tercatat |
| 2 | Sistem | < Rp 2.000.000: auto-approve WK II + ICT (log) | Status: DISETUJUI | Approval otomatis |
| 3 | Sistem | > Rp 2.000.000: perlu WK II + Pastor + Tim Audit (log) | Notifikasi ke approver | Approval manual |
| 4 | Bendahara III | Cairkan dana setelah approval | Status: TERSALURKAN | Pengeluaran selesai |

### Alur Transfer Antar Rekening
| Langkah | Pelaksana | Tindakan | Hasil |
|---------|-----------|----------|-------|
| 1 | Semua Bendahara terkait | Input transfer | Proposal transfer |
| 2 | Pastor + WK | Approve | Transfer disetujui |
| 3 | Tim Audit + Keuskupan | Menerima informasi | Tahu transfer terjadi |

## Aturan Bisnis

### Tingkat Approval Pengeluaran
| Nominal | Approver | Catatan |
|---------|----------|---------|
| < Rp 2.000.000 | Bendahara III input, WK II approve | ICT (log) |
| > Rp 2.000.000 | Bendahara III input, WK II + Pastor approve | Tim Audit (log) |

### Transfer Antar Rekening
| Step | Pelaksana | Tindakan |
|------|-----------|----------|
| 1 | Semua bendahara terkait | Input transfer |
| 2 | Pastor + WK | Approve |
| 3 | Tim Audit + Keuskupan | Informasi (notifikasi) |

## Database Schema

### Tabel `rk3_transactions` (Baru)
```sql
CREATE TABLE public.rk3_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipe TEXT NOT NULL CHECK (tipe IN ('pemasukan', 'pengeluaran', 'transfer')),
    sumber TEXT,                             -- 'fee_marketplace', 'iklan', 'komisi', 'manual'
    nominal DECIMAL(12,2) NOT NULL,
    deskripsi TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'tersalurkan')),
    approved_by UUID[],                      -- Array UUID approver
    created_by UUID REFERENCES public.profiles(id),     -- Bendahara III
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rk3_tipe ON public.rk3_transactions(tipe);
CREATE INDEX idx_rk3_status ON public.rk3_transactions(status);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `RK3Dashboard.tsx` | Dashboard RK-3: saldo, pemasukan, pengeluaran |
| `RK3Form.tsx` | Form input transaksi RK-3 |
| `RK3History.tsx` | Riwayat transaksi RK-3 |
| `RK3ApprovalPanel.tsx` | Panel approval pengeluaran |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Saldo RK-3 tidak cukup | Tolak pengeluaran, notifikasi ke Bendahara III |
| Fee marketplace belum settle | Catat sebagai pending, update saat settle |
| Transfer antar rekening gagal | Notifikasi ke semua pihak terkait |
| Laporan bulanan RK-3 | Generate otomatis, kirim ke Pastor + WK II |

## Referensi Halaman
- Dashboard Bendahara III: RK-3 management
- `src/app/(pastoral)/keuangan/rk3/page.tsx` — Halaman RK-3