# Dana Kasih Escrow — Sistem Donasi Terbuka & Terpercaya

## Informasi Dokumen
- **Fase:** 3 — Solidaritas & Keuangan
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 3.1 — Dana Kasih Escrow (Xendit)
- **Referensi Utama:**
  - [GDD v4.0] Bab XI "Dual-Ledger Financial Engine" — RK-2 Dana Sosial & Kasih, escrow mechanism
  - [GDD v4.0] Bab III.4 "Edge Functions" — fungsi `escrow-trigger` untuk webhook Xendit
  - [GDD v4.0] Bab IV.2 — tabel `dana_kasih`, `dana_kasih_donations`, `dana_kasih_disbursements`
  - [UF v4.0] Bagian 11 "Dana Kasih (3 Pintu Kasih)"
  - [DS v3.0] Bagian 8.4 "DanaKasihProgress" — komponen UI progress bar donasi

## Deskripsi
Sistem escrow untuk Dana Kasih yang memungkinkan umat berdonasi secara transparan dan aman. Donasi masuk ke rekening bersama (RK-2) melalui payment gateway Xendit, bukan ke rekening pribadi bendahara. Sistem ini mengimplementasikan prinsip **Invisible Grace** — identitas donatur dilindungi, tidak ada feed pamer, tidak ada poin, tidak ada like.

## Prinsip Invisible Grace
- Identitas donatur dienkripsi dan tidak ditampilkan di publik
- Tidak ada leaderboard donatur
- Tidak ada notifikasi "X berdonasi" ke umat lain
- Laporan publik hanya menampilkan total nominal dan jumlah donatur (anonim)
- Penerima bantuan juga dilindungi identitasnya dalam laporan publik

## Alur Utama

### Alur Donasi
| Langkah | Pelaku | Tindakan | Respon Sistem | Hasil |
|---------|--------|----------|---------------|-------|
| 1 | Umat | Buka halaman Donasi Dana Kasih | Pilih nominal atau input nominal sendiri | Form donasi |
| 2 | Umat | Pilih metode pembayaran (transfer bank / QRIS) | Generate payment link via Xendit | Instruksi pembayaran |
| 3 | Umat | Lakukan pembayaran | Xendit webhook → escrow-trigger → dana masuk RK-2 | Dana tertampung escrow |
| 4 | Sistem | Kirim konfirmasi ke donatur (anonim) | Email/notifikasi: "Donasi Anda telah diterima" | Donatur tahu |
| 5 | Sistem | Update progress bar donasi (anonim) | Nominal donasi bertambah, count donatur +1 | Progress terupdate |

### Alur Pencairan Escrow
| Langkah | Pelaksana | Tindakan | Hasil |
|---------|-----------|----------|-------|
| 1 | Sub Bidang Sosek | Verifikasi kebutuhan penerima + upload formulir | Status: TERVERIFIKASI |
| 2 | Bendahara II + WK II | Multi-signature approval pencairan | Transfer dari RK-2 ke rekening penerima |
| 3 | Sistem | Catat pencairan, update status | Dana tersalurkan |
| 4 | Sub Bidang Sosek | Upload laporan dampak (anonim) | Status: DISALURKAN |

## Database Schema

### Tabel `dana_kasih` (Existing)
```sql
CREATE TABLE public.dana_kasih (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    deskripsi TEXT,
    target_nominal DECIMAL(12,2),
    terkumpul DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai', 'ditutup')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `dana_kasih_donations` (Existing)
```sql
CREATE TABLE public.dana_kasih_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dana_kasih_id UUID REFERENCES public.dana_kasih(id),
    donor_id UUID REFERENCES public.profiles(id),
    nominal DECIMAL(12,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    xendit_invoice_id TEXT,
    is_anonim BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `dana_kasih_disbursements` (Existing)
```sql
CREATE TABLE public.dana_kasih_disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dana_kasih_id UUID REFERENCES public.dana_kasih(id),
    penerima_id UUID REFERENCES public.profiles(id),
    nominal DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'rejected')),
    approved_by UUID[],
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integrasi Xendit
| Metode Pembayaran | Biaya | Waktu Settle |
|-------------------|-------|-------------|
| Transfer Bank (BCA, Mandiri, BNI, BRI) | 1.5% per transaksi | 1-2 hari |
| QRIS | 1.5% per transaksi | Instan |
| Virtual Account | 1.5% per transaksi | 1-2 hari |

### Webhook Xendit
- Endpoint: `/api/v1/xendit/webhook`
- Event: `invoice.paid`, `disbursement.completed`, `disbursement.failed`
- Validasi: Signature verification dengan `XENDIT_WEBHOOK_TOKEN`

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `DanaKasihProgress` (DS §8.4) | Progress bar donasi |
| `DonasiForm.tsx` | Form donasi dengan pilihan nominal |
| `PaymentMethodSelector.tsx` | Pilihan metode pembayaran |
| `DonasiSuksesPage.tsx` | Halaman konfirmasi donasi sukses |

## Aturan Bisnis
- **Batas bantuan:** Rp 5.000.000 per kejadian (konfigurasi)
- **Di atas batas:** Approval langsung Pastor
- **Frekuensi maksimal:** 3 kali dalam 12 bulan untuk satu keluarga
- **Penerima tanpa rekening:** Pencairan melalui KL setempat dengan bukti serah terima fisik + foto (consent)

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Pembayaran gagal/expired | Status update ke `failed`, dana tidak masuk escrow |
| Refund | Proses refund via Xendit, catat di `dana_kasih_donations` |
| Donatur ingin anonim | `is_anonim = TRUE`, identitas dienkripsi di DB |
| Pencairan ditolak | Dana kembali ke pool escrow |
| Target donasi tercapai | Kampanye otomatis status `selesai`, donasi baru ditolak |

## Referensi Halaman
- `src/app/(pastoral)/dana-kasih/donasi/page.tsx` — Form donasi
- `src/app/(pastoral)/dana-kasih/page.tsx` — Halaman 3 Pintu Kasih