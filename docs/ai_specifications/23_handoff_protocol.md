## BAB XXIII — Handoff Protocol Antar Bot {#bab-xxiii}

### 23.1 Mengapa Handoff Protocol Penting

Tanpa handoff yang formal, user yang berpindah dari Bot 3 ke Bot 7 harus mengulangi seluruh ceritanya. Ini tidak hanya melelahkan, tapi bisa terasa tidak menghargai apa yang sudah mereka ceritakan.

### 23.2 Jenis Handoff

| Dari | Ke | Trigger | Konteks yang Dibawa |
|---|---|---|---|
| Bot 3 (Companion) | Bot 7 (Kerja) | User setuju matching | intent, confidence, keahlian terdeteksi |
| Bot 7 (Kerja) | Bot 3 (Companion) | User tampak distress saat di Bot 7 | emotional_signal |
| Gate Bot | Bot 3 / Bot 7 / Bot 6 | User minta layanan spesifik | none — hanya routing |
| Bot 6 (Keluarga) | Bot 3 (Companion) | User bawa urusan rohani | none — hanya routing |
| Bot 2 (CS) | Bot 3 (Companion) | User tampak emosional saat urus administrasi | emotional_signal |

### 23.3 Struktur Handoff Payload

```typescript
interface BotHandoffPayload {
    from_bot: string
    to_bot: string
    user_id: string
    session_id: string

    handoff_reason: string
    // Deskripsi singkat mengapa handoff terjadi — TIDAK dibagikan ke user

    context_summary: string
    // Ringkasan konteks yang relevan untuk bot tujuan
    // Contoh: "User menyatakan kesulitan ekonomi, keahlian cat tembok,
    //          confidence 0.82, belum ada matching. User dalam kondisi cemas ringan."

    emotional_signal?: string
    intent_detected?: string[]
    confidence_score?: number
    detected_skills?: string[]
}
```

### 23.4 Script Transisi ke User

Bot yang "menyerahkan" percakapan wajib menggunakan script ini (tidak harus verbatim, tapi harus mencakup tiga elemen):

```
[1. VALIDASI] Akui apa yang sudah dibicarakan
[2. PENGHUBUNG] Jelaskan mengapa berpindah — tanpa menyebut nama bot
[3. TAWARAN] Beri user pilihan untuk setuju atau tidak

Contoh Bot 3 → Bot 7:
"Saya dengar dan mencatat situasi Bapak.
Untuk kebutuhan pekerjaan yang Bapak ceritakan,
ada layanan khusus yang bisa bantu carikan solusi lebih konkret.
Mau saya hubungkan sekarang?"

Contoh Bot 7 → Bot 3:
"Saya lihat Bapak sedang dalam situasi yang tidak mudah.
Selain urusan pekerjaan, mungkin ada baiknya berbicara
dengan Klemen Companion untuk sisi yang lebih pribadi.
Mau saya bantu arahkan?"
```

### 23.5 Implementasi di Middleware

```typescript
// lib/ai/handoff.ts

async function initiateHandoff(payload: BotHandoffPayload): Promise<void> {
    // 1. Simpan handoff payload ke session store
    await sessionStore.setHandoffContext(payload.user_id, payload)

    // 2. Bot tujuan akan membaca handoff_context di awal sesi berikutnya
    // dan menggunakannya sebagai context awal — bukan ditampilkan ke user

    // 3. Update emotional_signal di ai_user_profiles
    if (payload.emotional_signal) {
        await supabase
            .from('ai_user_profiles')
            .update({
                emotional_signal_last_session: payload.emotional_signal,
                emotional_signal_updated_at: new Date()
            })
            .eq('user_id', payload.user_id)
    }
}
```

---
