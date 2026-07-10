## BAB XXII — Liturgical Context Injection {#bab-xxii}

### 22.1 Tujuan

Bot 3 (Companion), Bot 1 (Info Publik), dan semua bot yang berinteraksi dengan umat harus sadar akan konteks liturgi hari ini. Seorang asisten rohani yang tidak tahu bahwa hari ini adalah Minggu Advent terasa "tidak hadir secara rohani."

### 22.2 Sumber Data

- **Sumber primer:** ordo.or.id (kalender liturgi Gereja Katolik Indonesia resmi)
- **Metode pengambilan:** cron job harian, simpan ke cache database (bukan real-time scraping)
- **Backup:** google calendar Paroki (jika ordo.or.id down)

### 22.3 Skema Cache

```sql
CREATE TABLE public.liturgical_calendar_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,

    season TEXT NOT NULL,
    -- 'Adven', 'Natal', 'Biasa', 'Prapaskah', 'Paskah', 'Pentakosta'

    season_week INTEGER,
    -- Pekan ke-berapa dalam masa liturgi. Null untuk hari raya khusus.

    day_name TEXT NOT NULL,
    -- Nama liturgi: "Minggu Adven III (Gaudete)", "Hari Raya Natal",
    -- "Hari Biasa Pekan XX", "Peringatan St. Klemens I"

    liturgical_rank TEXT NOT NULL CHECK (liturgical_rank IN (
        'hari_raya_wajib',  -- Natal, Paskah, dll
        'pesta',            -- Pesta orang kudus
        'peringatan_wajib', -- Peringatan wajib
        'peringatan_pilihan',
        'hari_biasa'
    )),

    color TEXT NOT NULL CHECK (color IN (
        'putih', 'merah', 'ungu', 'hijau', 'merah_muda', 'hitam')),

    readings_first TEXT,    -- Bacaan I (referensi kitab suci)
    readings_psalm TEXT,    -- Mazmur tanggapan
    readings_second TEXT,   -- Bacaan II (jika ada)
    readings_gospel TEXT,   -- Injil

    readings_summary TEXT,
    -- Ringkasan bacaan dalam 1-2 kalimat untuk diinjeksikan ke AI
    -- Dikurasi oleh Tim ICT, bukan auto-generated

    special_notes TEXT,
    -- Catatan khusus: "Kolekte khusus pembangunan gereja hari ini"

    source_url TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 22.4 Interface LiturgicalContext

```typescript
interface LiturgicalContext {
    date: string                    // "2026-06-14"
    season: string                  // "Biasa"
    season_week: number | null      // 11
    day_name: string                // "Minggu Biasa XI"
    liturgical_rank: string         // "hari_biasa"
    color: string                   // "hijau"
    readings_summary: string        // "Perumpamaan biji sesawi — Kerajaan Allah yang kecil tapi bertumbuh"
    special_notes?: string
}
```

### 22.5 Cara Penggunaan dalam Prompt

Bot 3 menerima `liturgical_context` dan dapat menggunakannya secara natural:

```
Contoh injeksi ke Bot 3:
Masa Liturgi Hari Ini: Minggu Biasa XI — Warna Hijau
Bacaan: Perumpamaan biji sesawi — Kerajaan Allah yang kecil tapi bertumbuh

Bot 3 bisa menyebut ini secara natural dalam percakapan:
"Menarik sekali — hari ini Gereja justru merenungkan biji sesawi,
hal kecil yang bertumbuh. Mungkin perasaan Bapak hari ini pun demikian."

Bot 3 TIDAK HARUS selalu menyebut ini — hanya jika relevan dengan konteks percakapan.
```

### 22.6 Cron Job Setup

```typescript
// app/api/cron/liturgical-cache/route.ts
// Jadwal: setiap hari pukul 00:01 WIB

export async function GET() {
    const tomorrow = addDays(new Date(), 1)
    const liturgicalData = await fetchFromOrdo(tomorrow)
    // fetchFromOrdo: ambil dari ordo.or.id, parse HTML, extract data
    // Jika fetch gagal → kirim notif WA ke Developer

    await supabase
        .from('liturgical_calendar_cache')
        .upsert({
            date: formatDate(tomorrow),
            ...liturgicalData,
            fetched_at: new Date()
        })
}
```

---
