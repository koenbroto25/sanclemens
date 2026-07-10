## BAB XIV — AI Intent Detection & Need Profiling {#bab-xiv}

### 14.1 Tabel `umat_needs`

```sql
CREATE TABLE public.umat_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,

    needs JSONB DEFAULT '{}'::jsonb,
    -- Contoh: {
    --   "cari_kerja": { "confidence": 0.85, "last_detected": "2026-06-10",
    --                   "mention_count": 3, "keahlian": ["tukang", "cat"] },
    --   "butuh_sembako": { "confidence": 0.7, "last_detected": "2026-06-09",
    --                      "mention_count": 2 }
    -- }

    complaint_history JSONB DEFAULT '[]'::jsonb,
    -- Riwayat keluhan untuk analisis pola

    last_intervention_at TIMESTAMPTZ,
    intervention_status TEXT DEFAULT 'none' CHECK (intervention_status IN (
        'none', 'kl_dihubungi', 'pastor_dihubungi', 'terbantu', 'fake_report', 'menolak'
    )),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.2 Intents yang Dideteksi

| Intent | Contoh Trigger | Confidence Factors |
|---|---|---|
| `cari_kerja` | "nganggur", "cari kerja", "butuh penghasilan" | Frekuensi, detail keahlian |
| `butuh_sembako` | "beras tinggal", "makan aja susah" | Frekuensi, emosi |
| `butuh_dana` | "anak sakit", "rumah sakit", "biaya" | Urgency kata |
| `butuh_pendampingan` | "sendirian", "sepi", "tidak ada teman" | Pola kesepian |
| `tawaran_keahlian` | "saya bisa cat", "saya tukang" | Keahlian spesifik |
| `tawaran_donasi` | "saya mau bantu", "saya punya lebih" | Niat memberi |

### 14.3 Alur Deteksi

```
User: "Saya bingung, sudah 3 bulan nganggur"

→ AI Intent Detection
  → Sentimen: cemas
  → Topik: pekerjaan
  → Intent: cari_kerja (confidence: 0.82)
  → Update umat_needs: mention_count +1

→ AI respon: "Wajar jika Bapak merasa cemas.
   Saya catat kebutuhan Bapak. Apakah Bapak punya keahlian
   tertentu? Misal: tukang, supir, atau lainnya?"

→ User: "Saya bisa cat tembok"

→ AI: "Saya cocokkan dengan lowongan yang ada..."
  → Cari lowongan_kerja WHERE jenis = 'tukang_cat'
  → Ditemukan: renovasi gereja (match 92%)
  → Tawarkan ke user
```

---
