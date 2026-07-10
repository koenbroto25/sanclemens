# Internal Ojek — Ojek Solidaritas Internal

## Informasi Dokumen
- **Fase:** 4 — Ekonomi Internal
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 4.2 — Ojek Internal
- **Referensi Utama:**
  - [GDD v4.0] Bab I.3 "Twin App Architecture" — App 2 Layer 3 Ojol Umat
  - [UF v4.0] Bagian 18 "Pintu 3: Pasar Kasih" — alur pengantaran
  - [DS v3.0] Bagian 8.15 "OjekRequestCard" — komponen UI permintaan ojek
  - [DS v3.0] Bagian 11 "Desain Per-Halaman — Portal 3"
  - [masterplan v4.0] Sub-Fase 4.2

## Deskripsi
Layanan ojek internal untuk mengantarkan pesanan dari Pasar Kasih atau keperluan solidaritas antar umat dalam satu lingkungan/wilayah. Driver ojek adalah umat yang terdaftar dan terverifikasi. **Ojek = Solidaritas:** Tidak ada fee komersial. Tidak ada pencatatan keuangan paroki. Biaya pengantaran adalah kesepakatan antara pemesan dan driver.

## Prinsip
- **Solidaritas, bukan profit:** Ojek adalah bentuk solidaritas umat, bukan bisnis
- **Tidak ada fee paroki:** Tidak ada potongan untuk paroki
- **Matching berdasarkan wilayah:** Driver dan pemesan dicocokkan berdasarkan lingkungan/wilayah
- **Kesepakatan mandiri:** Biaya pengantaran adalah kesepakatan antara pemesan dan driver

## Alur Utama

### Alur Pemesanan Ojek
| Langkah | Pelaku | Tindakan | Respon Sistem | Hasil |
|---------|--------|----------|---------------|-------|
| 1 | Pembeli | Selesai checkout Pasar Kasih, pilih "Antar via Ojek" | Sistem cari driver terdekat | Permintaan ojek |
| 2 | Sistem | Cocokkan dengan driver berdasarkan wilayah | Kirim notifikasi ke driver yang cocok | Matching driver |
| 3 | Driver | Terima/tolak order | Jika terima: detail pengantaran tampil | Order diterima |
| 4 | Driver | Ambil pesanan, antar ke penerima | Update status: DIANTAR | Pengantaran |
| 5 | Driver | Konfirmasi sampai | Status: SELESAI | Pengantaran selesai |
| 6 | Pembeli | (Opsional) Konfirmasi terima | Status final | Transaksi selesai |

### Alur Registrasi Driver
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 1 | Umat | Buka halaman Ojek → "Daftar Jadi Driver" | Form registrasi driver |
| 2 | Umat | Isi: No HP, wilayah operasi, jenis kendaraan | Data tersimpan |
| 3 | Sistem | Verifikasi oleh KL | Status: AKTIF / DITOLAK |

## Database Schema

### Tabel `ojek_drivers` (Baru)
```sql
CREATE TABLE public.ojek_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    lingkungan_id UUID NOT NULL REFERENCES public.lingkungan(id),
    kendaraan TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'aktif', 'nonaktif')),
    total_pengantaran INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    verified_by UUID REFERENCES public.profiles(id),     -- KL yang verifikasi
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `ojek_orders` (Baru)
```sql
CREATE TABLE public.ojek_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),           -- Dari marketplace
    driver_id UUID REFERENCES public.ojek_drivers(id),
    pemesan_id UUID NOT NULL REFERENCES public.profiles(id),
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    status TEXT DEFAULT 'menunggu_driver' CHECK (status IN ('menunggu_driver', 'driver_ditemukan', 'diambil', 'diantar', 'selesai', 'dibatalkan')),
    biaya_antar DECIMAL(12,2),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ojek_orders_status ON public.ojek_orders(status);
CREATE INDEX idx_ojek_orders_driver ON public.ojek_orders(driver_id);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `OjekRequestCard` (DS §8.15) | Kartu permintaan ojek |
| `OjekDashboard.tsx` | Dashboard driver: daftar order |
| `OjekRegistrationForm.tsx` | Form registrasi driver |
| `OjekTracker.tsx` | Tracking pengantaran real-time |

## Aturan Bisnis
| Aturan | Detail |
|--------|--------|
| Fee paroki | Tidak ada (solidaritas) |
| Matching | Berdasarkan wilayah/lingkungan |
| Verifikasi driver | Oleh KL setempat |
| Laporan penghasilan driver | Tersedia di dashboard driver (total, per periode) |
| Rating driver | Oleh pemesan setelah selesai |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Tidak ada driver tersedia | Notifikasi "Belum ada driver tersedia, coba lagi nanti" |
| Driver membatalkan | Cari driver lain, jika tidak ada → notifikasi ke pemesan |
| Pemesan dan driver beda wilayah | Tawarkan driver dari wilayah terdekat |
| Driver tidak konfirmasi sampai | Otomatis selesai setelah 2 jam (dengan notifikasi) |
| Pesanan dibatalkan | Driver dapat notifikasi, status order direset |

## Referensi Halaman
- `src/app/pasar-kasih/ojek-internal/page.tsx` — Halaman Ojek Internal