## BAB II — Dokumen Referensi & Knowledge Base {#bab-ii}

### 2.1 Dua Puluh Dua Dokumen Resmi Wajib

| No | Dokumen | Kode | Prioritas | Bot |
|---|---|---|---|---|
| 1 | Katekismus Gereja Katolik (KGK) | `KGK` | WAJIB | Bot 3 |
| 2 | Kitab Hukum Kanonik (KHK) — Kanon terpilih | `KHK` | WAJIB | Bot 2, Bot 3 |
| 3 | Dokumen Konsili Vatikan II | `VATII` | WAJIB | Bot 3 |
| 4 | Konstitusi Liturgi Sacrosanctum Concilium | `SC` | WAJIB | Bot 1, Bot 3 |
| 5 | Kompendium Katekismus Gereja Katolik | `KGK_KOMP` | SANGAT DISARANKAN | Bot 3 |
| 6 | Evangelii Gaudium (Paus Fransiskus) | `EG` | DISARANKAN | Bot 3 |
| 7 | Amoris Laetitia (Paus Fransiskus) | `AL` | DISARANKAN | Bot 3 |
| 8 | Katekismus Gereja Katolik Indonesia (KWI) | `KGK_KWI` | WAJIB | Bot 2, Bot 3 |
| 9 | Pedoman Umum Misale Romawi (PUMR) | `PUMR` | WAJIB | Bot 1, Bot 2 |
| 10 | Buku Ibadat Harian (IBIH) | `IBIH` | WAJIB | Bot 3 |
| 11 | Kitab Suci PL & PB (LAI) | `ALKITAB` | WAJIB | Bot 3 (via API) |
| 12 | Kalender Liturgi Gereja Katolik Indonesia | `KALENDER` | WAJIB | Bot 1, Bot 3 |
| 13 | Laudato Si' (Paus Fransiskus) | `LS` | DISARANKAN | Bot 3 |
| 14 | Statuta Keuskupan Agung Samarinda | `STATUTA` | WAJIB | Bot 2, Bot 4 |
| 15 | SK Keuskupan No. 175/A.VIII.8/X/2024 | `SK_PAROKI` | WAJIB | Bot 1, Bot 4 |
| 16 | GDD DPP v2.0 (Filosofi Paroki) | `GDD_DPP` | WAJIB | Bot 4 |
| 17 | GDD Developer v4.0 (Arsitektur Teknis) | `GDD_DEV` | WAJIB | Bot 4, Developer |
| 18 | SOP Sakramen Paroki | `SOP_SAK` | WAJIB | Bot 2, Bot 3 |
| 19 | SOP Keuangan Paroki (Dual-Ledger) | `SOP_KEU` | WAJIB | Bot 4 |
| 20 | Panduan Wali Digital (WDL) | `SOP_WDL` | WAJIB | Bot 2, Bot 4 |
| 21 | Profil & Sejarah Paroki Santo Klemens | `PROFIL` | WAJIB | Bot 1, Bot 2 |
| 22 | Doa-doa Harian Resmi | `DOA` | WAJIB | Bot 3 |

### 2.2 Tiga Lokasi Penyimpanan Dokumen

1. **Supabase Schema `theology`** — untuk semantic search
2. **Supabase Storage `ai-knowledge-base`** — private, format Markdown
3. **GitHub `docs/ai-knowledge/`** — version control & backup

### 2.3 Schema Database Teologi

```sql
-- Schema theology — referensi dokumen resmi untuk semantic search

-- Teks dokumen resmi (KGK, KHK, Vatikan II, dll)
CREATE TABLE theology.references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code TEXT NOT NULL,        -- 'KGK', 'KHK', 'VATII', dst
    title TEXT NOT NULL,
    paragraph_number TEXT,
    content_text TEXT NOT NULL,
    content_embedding VECTOR(1536),     -- untuk semantic search
    source_url TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doa-doa resmi
CREATE TABLE theology.prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_name TEXT NOT NULL,
    category TEXT NOT NULL,
    text_id TEXT NOT NULL,              -- teks dalam Bahasa Indonesia
    text_la TEXT,                       -- teks Latin (jika ada)
    occasion TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Panduan ibadat, Examen, Rosario, dll
CREATE TABLE theology.prayer_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_name TEXT NOT NULL,
    steps_json JSONB NOT NULL,          -- langkah-langkah panduan
    target_mode TEXT,                   -- mode Bot 3 yang relevan
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---
