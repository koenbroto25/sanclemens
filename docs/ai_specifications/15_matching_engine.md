## BAB XV — AI Matching Engine {#bab-xv}

### 15.1 Tabel Database

#### `lowongan_kerja`

```sql
CREATE TABLE public.lowongan_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posted_by UUID NOT NULL REFERENCES public.profiles(id),
    jenis_pekerjaan TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    lokasi TEXT NOT NULL,
    lingkungan_id UUID REFERENCES public.lingkungan(id),
    estimasi_gaji TEXT,
    durasi TEXT CHECK (durasi IN ('harian','mingguan','bulanan','tetap','proyek')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open','matched','filled','closed')),
    is_verified BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
```

#### `tenaga_kerja`

```sql
CREATE TABLE public.tenaga_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    keahlian TEXT[] NOT NULL,
    pengalaman_tahun INTEGER,
    preferensi_lokasi TEXT[],
    preferensi_durasi TEXT[],
    estimasi_upah TEXT,
    tersedia BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `lowongan_lamaran`

```sql
CREATE TABLE public.lowongan_lamaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lowongan_id UUID NOT NULL REFERENCES public.lowongan_kerja(id),
    pelamar_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT DEFAULT 'melamar' CHECK (status IN ('melamar','diterima','ditolak','batal')),
    catatan_pelamar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `donatur_potensial`

```sql
CREATE TABLE public.donatur_potensial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    preferensi TEXT[] NOT NULL,
    preferensi_anonim BOOLEAN DEFAULT TRUE,
    preferensi_lokasi TEXT[],
    max_per_bulan DECIMAL(12,2),
    total_donasi_30d DECIMAL(12,2) DEFAULT 0,
    last_donated_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 15.2 Alur Matching

```
1. Intent terdeteksi dari percakapan (cari_kerja / butuh_sembako / dll)
2. AI tanya konfirmasi: "Mau saya bantu carikan solusi?"
3. Jika user setuju:
   a. Lowongan Kerja: cocokkan lowongan_kerja.jenis dengan tenaga_kerja.keahlian
   b. Donasi: cocokkan umat_needs dengan donatur_potensial.preferensi
   c. Bantuan: cocokkan dengan kasih_offers
4. Hitung match score berdasarkan:
   - Kesesuaian jenis (30%)
   - Lokasi/lingkungan (30%)
   - Urgency (20%)
   - Ketersediaan (20%)
5. Tampilkan top 3 match ke user
6. Jika user setuju → notifikasi ke pihak terkait via WA
```

### 15.3 Cron Matching Mingguan

```typescript
// app/api/cron/kasih-matching/route.ts
// Setiap 6 jam, cocokkan lowongan_kerja.status='open' dengan tenaga_kerja.tersedia=true
// Kirim WA: "Halo [Nama], ada lowongan [pekerjaan] di [lokasi].
//            Cocok dengan keahlian Anda. Lihat: [link]"
```

---
