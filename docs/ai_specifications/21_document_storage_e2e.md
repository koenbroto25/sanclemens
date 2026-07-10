## BAB XXI — Arsitektur Penyimpanan Dokumen & Chat E2E {#bab-xxi}

### 21.1 Tiga Kategori Data dalam Ekosistem AI

Data dalam sistem ini dibagi menjadi tiga kategori berdasarkan sensitivitasnya:

```
KATEGORI A — DATA PUBLIK / OPERASIONAL
  Siapa yang bisa baca: AI + Server + Admin sesuai layer
  Enkripsi: TLS in transit, AES-256 at rest (Supabase default)
  Contoh: jadwal misa, Q&A, pengumuman, lowongan kerja

KATEGORI B — DATA PERSONAL NON-ROHANI
  Siapa yang bisa baca: AI + Server (sesuai scope layer user)
  Enkripsi: TLS + RLS (Row Level Security) Supabase
  Contoh: profil user, data keluarga, umat_needs, ai_user_profiles,
          data GAKIN (akses terbatas per layer)

KATEGORI C — DATA ROHANI E2E (SANGAT SENSITIF)
  Siapa yang bisa baca: HANYA user sendiri
  Enkripsi: E2E — kunci tidak pernah menyentuh server
  Contoh: isi percakapan Companion, spiritual_memory, catatan Examen
  Server hanya menyimpan ciphertext — bahkan Pastor pun tidak bisa membaca
```

### 21.2 Arsitektur Penyimpanan Knowledge Base (Dokumen Teologi)

```
LOKASI 1: Supabase Schema theology.*
├── theology.references     → teks dokumen resmi (KGK, KHK, Vatikan II, dll)
│   Fields: id, document_code, title, paragraph_number, content_text,
│           content_embedding (vector), source_url, approved_by, approved_at
├── theology.prayers        → doa-doa resmi
│   Fields: id, prayer_name, category, text_id (Indonesia), text_la (Latin),
│           occasion, approved_by
└── theology.prayer_guides  → panduan ibadat, Examen, Rosario, dll
    Fields: id, guide_name, steps_json, target_mode, approved_by

LOKASI 2: Supabase Storage bucket: ai-knowledge-base (private)
├── /raw/                   → dokumen sumber format PDF/DOCX (tidak diakses AI langsung)
├── /processed/             → versi Markdown yang sudah dikurasi Tim ICT
└── /approved/              → versi final yang sudah disetujui Pastor

LOKASI 3: GitHub repository docs/ai-knowledge/
└── Version control & backup — setiap perubahan tercatat dengan git blame
    Setiap file wajib memiliki header:
    # [KODE_DOKUMEN] [JUDUL]
    # Dikurasi: [nama Tim ICT] — [tanggal]
    # Disetujui: [nama Pastor] — [tanggal]
    # Berlaku: [tanggal mulai] s/d [tanggal berakhir atau 'berlaku selamanya']

ALUR KURASI DOKUMEN:
Tim ICT ambil teks dari sumber primer (vatican.va, kwi.or.id, dll)
  → Proses ke Markdown, masuk /processed/
    → Pastor review & approve, masuk /approved/
      → Tim ICT sync ke theology.* di Supabase (dengan embedding generation)
        → Tersedia untuk semantic search oleh AI
```

### 21.3 Arsitektur Chat E2E — Schema `companion.*`

#### Prinsip Dasar E2E dalam Konteks Ini

```
1. Enkripsi terjadi di SISI CLIENT (browser/app), SEBELUM data dikirim ke server
2. Server hanya menerima dan menyimpan ciphertext (data terenkripsi)
3. Kunci enkripsi (derived dari PIN user) TIDAK PERNAH meninggalkan perangkat user
4. Jika PIN hilang → data tidak bisa dipulihkan. Ini disengaja.
5. Saat sesi aktif: client mendekripsi data, mengirim plaintext spiritual_journey_summary
   hanya dalam body request HTTPS. Request ini tidak di-log di server.
```

#### Skema Database

```sql
-- Schema khusus untuk data Companion E2E
-- RLS: hanya user yang authenticated dengan user_id cocok yang bisa query

CREATE SCHEMA companion;

-- Riwayat percakapan (isi pesan terenkripsi)
CREATE TABLE companion.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),

    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode_sequence TEXT[],
    -- Urutan mode yang aktif dalam sesi: ['Normal','Lamentasi','Normal']
    -- INI TIDAK TERENKRIPSI — hanya urutan mode, bukan isi

    message_count INTEGER DEFAULT 0,
    -- Jumlah pesan dalam sesi — TIDAK TERENKRIPSI

    messages_encrypted BYTEA NOT NULL,
    -- Seluruh isi percakapan, terenkripsi AES-256-GCM di sisi client
    -- Server tidak bisa membaca ini

    iv TEXT NOT NULL,
    -- Initialization Vector untuk AES-GCM (bukan kunci, aman di server)

    has_emergency_flag BOOLEAN DEFAULT FALSE,
    -- Jika TRUE: sesi ini mengandung Emergency mode
    -- TIDAK TERENKRIPSI — diperlukan untuk monitoring pastoral (tanpa baca isi)
    -- Pastor hanya tahu "ada sesi darurat", bukan isinya

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ringkasan perjalanan rohani antar sesi (Spiritual Memory)
CREATE TABLE companion.spiritual_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,

    memory_encrypted BYTEA NOT NULL,
    -- JSON spiritual_journey_summary (lihat §7.8), terenkripsi E2E

    iv TEXT NOT NULL,

    last_updated_session_id UUID REFERENCES companion.chat_sessions(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log Emergency (non-E2E — untuk kepentingan pastoral)
CREATE TABLE companion.emergency_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    session_id UUID REFERENCES companion.chat_sessions(id),

    detected_at TIMESTAMPTZ DEFAULT NOW(),
    keyword_triggered TEXT NOT NULL,
    -- Kata kunci apa yang memicu Emergency mode
    -- BUKAN isi percakapan

    pastor_notified BOOLEAN DEFAULT FALSE,
    pastor_notified_at TIMESTAMPTZ,
    pastoral_followup_status TEXT DEFAULT 'pending' CHECK (
        pastoral_followup_status IN ('pending','contacted','resolved','declined'))
);
```

#### Alur Enkripsi/Dekripsi di Sisi Client

```typescript
// lib/companion/e2e.ts (berjalan HANYA di browser/app, tidak di server)

// Setup: saat user buat PIN pertama kali
async function setupCompanionE2E(pin: string, userId: string): Promise<void> {
    // Derive encryption key dari PIN + userId (tidak bisa reverse)
    const key = await deriveKey(pin, userId)
    // Simpan key di memori saja — TIDAK di localStorage, TIDAK di server
    sessionStore.setCompanionKey(key)
}

// Enkripsi sebelum kirim ke server
async function encryptForStorage(plaintext: string): Promise<EncryptedPayload> {
    const key = sessionStore.getCompanionKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
    )
    return { ciphertext: new Uint8Array(ciphertext), iv }
}

// Dekripsi saat load sesi
async function decryptFromStorage(payload: EncryptedPayload): Promise<string> {
    const key = sessionStore.getCompanionKey()
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: payload.iv },
        key,
        payload.ciphertext
    )
    return new TextDecoder().decode(plaintext)
}

// Saat memanggil Bot 3 API:
// 1. Dekripsi spiritual_memory di client
// 2. Kirim spiritual_journey_summary sebagai plaintext dalam request body
// 3. Setelah respons diterima, enkripsi ulang update memory sebelum simpan ke server
// 4. Server TIDAK menyimpan plaintext di mana pun
```

### 21.4 Akses Data oleh Bot — Matriks Lengkap

| Data | Bot 1 | Bot 2 | Bot 3 | Bot 4 | Bot 5 | Bot 6 | Bot 7 | Gate |
|---|---|---|---|---|---|---|---|---|
| Q&A database | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| theology.* | ❌ | ✅ (KHK,SOP) | ✅ (semua) | ✅ (GDD,STATUTA) | ❌ | ❌ | ❌ | ❌ |
| public.profiles | ❌ | ✅ (user sendiri) | ✅ (user sendiri) | ✅ (scope layer) | ✅ (lingkungan) | ✅ (keluarga) | ✅ (user sendiri) | ✅ (user sendiri) |
| ai_user_profiles | ❌ | Sebagian | ✅ | Sebagian | Sebagian | Sebagian | Sebagian | ✅ |
| families | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| umat_needs | ❌ | ❌ | ✅ (write: detect) | ✅ (read: scope) | ✅ (lingkungan) | ❌ | ✅ (read+write) | ❌ |
| lowongan_kerja | ❌ | ❌ | ❌ | ✅ (Komsos+) | ❌ | ❌ | ✅ | ❌ |
| tenaga_kerja | ❌ | ❌ | ❌ | ✅ (Komsos+) | ❌ | ❌ | ✅ | ❌ |
| donatur_potensial | ❌ | ❌ | ❌ | ✅ (Komsos+) | ❌ | ❌ | ✅ (anonim) | ❌ |
| data_gakin | ❌ | ❌ | ❌ | ✅ (scope layer) | ✅ (lingkungan) | ❌ | ❌ | ❌ |
| companion.chat_sessions | ❌ | ❌ | ✅ (ciphertext only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| companion.spiritual_memory | ❌ | ❌ | ✅ (plaintext via client) | ❌ | ❌ | ❌ | ❌ | ❌ |
| companion.emergency_logs | ❌ | ❌ | ✅ (write) | ✅ (read, Layer 9) | ❌ | ❌ | ❌ | ❌ |
| liturgical_context cache | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 21.5 Kebijakan Retensi Data

| Data | Retensi | Alasan |
|---|---|---|
| Q&A, theology.* | Permanen | Referensi doktrinal |
| ai_user_profiles | Selama akun aktif + 1 tahun | Kebutuhan operasional |
| umat_needs | 1 tahun sejak last_detected | Analisis pastoral |
| ai_abuse_logs | 90 hari | Monitoring keamanan |
| companion.chat_sessions | 90 hari (default) atau sesuai pilihan user | Privasi rohani |
| companion.spiritual_memory | Selama user aktif atau hingga user hapus | User-controlled |
| companion.emergency_logs | 1 tahun | Kepentingan pastoral & keselamatan |
| lowongan_kerja | 30 hari setelah expires_at | Kebersihan data |

---
