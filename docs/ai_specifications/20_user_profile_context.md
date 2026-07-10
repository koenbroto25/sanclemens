## BAB XX — User Profile & Deteksi Konteks {#bab-xx}

### 20.1 Mengapa User Profile Penting untuk AI

AI yang baik bukan hanya menjawab pertanyaan — ia menyesuaikan cara berkomunikasi berdasarkan siapa yang diajak bicara. User profile yang kaya memungkinkan:

- Bot 3 menyapa user yang berduka dengan nada berbeda dari user yang bertanya jadwal misa
- Bot 7 langsung menampilkan lowongan yang relevan dengan domisili dan keahlian user
- Gate Bot menentukan mode yang tepat (baru/lama/re-aktivasi)
- Bot 4 membatasi data sesuai layer pengurus dengan tepat

### 20.2 Skema `public.ai_user_profiles`

Tabel ini adalah ekstensi dari `public.profiles` khusus untuk keperluan AI. Diisi secara bertahap — sebagian dari onboarding, sebagian dari perilaku percakapan.

```sql
CREATE TABLE public.ai_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,

    -- IDENTITAS DASAR (dari onboarding)
    preferred_name TEXT,
    -- Nama panggilan yang disukai user. Jika null, gunakan nama lengkap.
    -- Contoh: nama KTP "Yohanes Bambang Susilo" → preferred_name "Pak Bambang"

    preferred_language TEXT DEFAULT 'id',
    -- 'id' (Indonesia formal), 'id_informal' (Indonesia santai/bahasa daerah campur)
    -- Deteksi otomatis dari pola percakapan pertama

    preferred_address TEXT DEFAULT 'netral',
    -- Bagaimana user ingin disapa:
    -- 'bapak', 'ibu', 'mas', 'mbak', 'kak', 'nama_langsung', 'netral'
    -- Diisi dari preferensi onboarding atau deteksi percakapan

    -- KONTEKS KEUMATAN (dari data paroki)
    baptis_status TEXT CHECK (baptis_status IN ('sudah','belum','tidak_diketahui'))
        DEFAULT 'tidak_diketahui',
    krisma_status TEXT CHECK (krisma_status IN ('sudah','belum','tidak_diketahui'))
        DEFAULT 'tidak_diketahui',
    status_perkawinan TEXT CHECK (status_perkawinan IN
        ('lajang','menikah_katolik','menikah_sipil','janda_duda','tidak_diketahui'))
        DEFAULT 'tidak_diketahui',

    -- DATA INI HANYA DIGUNAKAN OLEH BOT 3 (Companion) UNTUK KONTEKS PASTORAL
    -- TIDAK DIGUNAKAN UNTUK MATCHING EKONOMI

    -- PREFERENSI KOMUNIKASI AI
    bot_verbosity TEXT DEFAULT 'normal' CHECK (bot_verbosity IN
        ('ringkas','normal','detail')),
    -- 'ringkas': user suka jawaban singkat (1-2 kalimat)
    -- 'normal': standar (3-5 kalimat)
    -- 'detail': user suka penjelasan lengkap
    -- Deteksi otomatis: jika user sering memotong jawaban → set 'ringkas'
    -- Jika user sering minta "jelaskan lebih" → set 'detail'

    -- RIWAYAT INTERAKSI AI (diupdate otomatis)
    account_age_days INTEGER GENERATED ALWAYS AS
        (EXTRACT(DAY FROM NOW() - created_at)::INTEGER) STORED,
    -- ⚠️ Ini computed, tidak perlu diisi manual

    last_bot_interaction TIMESTAMPTZ,
    last_active_portal TEXT,
    -- Portal terakhir yang dikunjungi: 'paroki'/'lingkungan'/'marketplace'

    total_sessions INTEGER DEFAULT 0,
    visited_portals TEXT[] DEFAULT '{}',
    -- Array portal yang pernah dikunjungi

    -- DETEKSI KONDISI EMOSIONAL LINTAS SESI (NON-COMPANION, NON-E2E)
    -- Hanya menyimpan sinyal agregat, bukan isi percakapan
    emotional_signal_last_session TEXT DEFAULT 'neutral' CHECK (
        emotional_signal_last_session IN
        ('neutral','positive','distress_mild','distress_moderate','emergency')),
    emotional_signal_updated_at TIMESTAMPTZ,
    -- Jika 'distress_moderate' atau 'emergency': Bot 3 harus menyesuaikan tone
    -- di sesi berikutnya, bahkan sebelum user berkata apa pun

    -- PREFERENSI COMPANION (BOT 3)
    companion_memory_enabled BOOLEAN DEFAULT FALSE,
    -- Apakah user sudah consent untuk Spiritual Memory (§7.8)
    companion_setup_complete BOOLEAN DEFAULT FALSE,
    -- Apakah user sudah setup PIN Companion

    -- PREFERENSI MATCHING (BOT 7)
    matching_consent BOOLEAN DEFAULT FALSE,
    -- Apakah user consent data kebutuhannya digunakan untuk matching

    -- METADATA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 20.3 AIRequestContext yang Dibangun per Request

Middleware membangun objek ini setiap request sebelum memanggil AI:

```typescript
interface AIRequestContext {
    // Dari JWT / session
    user_id: string
    user_layer: number
    homepage_context: 'paroki' | 'lingkungan' | 'marketplace' | 'gate-hub'
    lingkungan_id?: string
    marketplace_role?: string
    family_id?: string
    current_path: string

    // Dari public.profiles
    user_name: string                   // nama lengkap
    lingkungan_name: string

    // Dari public.ai_user_profiles
    preferred_name: string              // nama panggilan, fallback ke user_name
    preferred_address: string           // 'bapak'/'ibu'/'kak'/dll
    preferred_language: string
    bot_verbosity: 'ringkas' | 'normal' | 'detail'
    account_age_days: number
    last_active_days_ago: number
    visited_portals: string[]
    emotional_signal_last_session: string
    companion_memory_enabled: boolean
    matching_consent: boolean

    // Dari public.families
    family_name: string
    family_role: 'kepala_keluarga' | 'anggota' | 'single'
    family_members_count: number

    // Dari BAB XXII (cache liturgi)
    liturgical_context: LiturgicalContext

    // Dari companion.spiritual_memory (jika Bot 3 + E2E aktif)
    // Didekripsi di sisi CLIENT, dikirim sebagai plaintext dalam request
    // Request ini harus dikirim via HTTPS dan tidak di-log di server
    spiritual_journey_summary?: string

    // Dari public.umat_needs
    active_needs?: string[]
    intervention_status?: string

    // Runtime
    current_bot: 'bot1' | 'bot2' | 'bot3' | 'bot4' | 'bot5' | 'bot6' | 'bot7' | 'gate'
    session_id: string
    is_emergency: boolean
}
```

### 20.4 Deteksi Otomatis Preferensi Komunikasi

Middleware memperbarui `ai_user_profiles` secara pasif berdasarkan pola percakapan:

```typescript
// lib/ai/profile-updater.ts

async function updateCommunicationPreferences(
    userId: string,
    conversationHistory: Message[]
) {
    // Deteksi verbosity preference
    const avgUserMessageLength = calculateAvgLength(conversationHistory, 'user')
    const hasAskedForMoreDetail = conversationHistory.some(m =>
        /jelaskan lebih|bisa diperjelas|maksudnya apa/i.test(m.content))
    const hasCutOffResponse = conversationHistory.some(m =>
        /oke|ok|cukup|paham|ngerti/i.test(m.content) && isShortResponse(m))

    let verbosity = 'normal'
    if (hasAskedForMoreDetail) verbosity = 'detail'
    if (hasCutOffResponse && avgUserMessageLength < 30) verbosity = 'ringkas'

    // Deteksi preferred_address dari cara user memperkenalkan diri
    const selfIntroduction = conversationHistory.find(m =>
        /saya pak|saya bu|saya mas|panggil saya/i.test(m.content))
    // ... parsing logic

    await supabase
        .from('ai_user_profiles')
        .update({ bot_verbosity: verbosity, updated_at: new Date() })
        .eq('user_id', userId)
}
```

### 20.5 Matriks Deteksi Konteks per Tipe User

| Tipe User | Sinyal | Adaptasi AI |
|---|---|---|
| User baru (< 7 hari) | `account_age_days` < 7 | Gate Bot Mode 1, Bot 1 lebih eksplanatif |
| User re-aktivasi (> 30 hari tidak aktif) | `last_active_days_ago` > 30 | Gate Bot Mode 3, perkenalkan fitur baru |
| User dalam distress | `emotional_signal_last_session` = distress | Bot 3 langsung masuk mode sensitif |
| User lansia (terdeteksi dari pola bahasa) | kalimat pendek, sering typo, formal | Nada lebih sabar, jawaban lebih singkat |
| Pengurus aktif | `user_layer` ≥ 4 | Bot 4 & 5 aktif, data GAKIN sesuai scope |
| User tanpa keluarga terdaftar | `family_id` null | Bot 6 tawarkan buat/gabung keluarga |

---
