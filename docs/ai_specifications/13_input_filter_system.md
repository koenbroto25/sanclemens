## BAB XIII — Sistem Filter Input 4 Lapis {#bab-xiii}

### 13.1 Lapisan 0: Filter Server-Side (Sebelum AI)

```typescript
// lib/ai/input-filter.ts
// Berjalan SEBELUM prompt dikirim ke model

type FilterResult = {
    action: 'block' | 'sanitize' | 'pass' | 'emergency'
    response?: string
    sanitized_input?: string
    emergency_type?: 'sos' | 'self_harm'
}

// Priority 1: Emergency Detection (sebelum semua filter lain)
const EMERGENCY_KEYWORDS = [
    'bunuh diri', 'mati saja', 'tidak mau hidup lagi',
    'ingin mati', 'lebih baik mati', 'tidak ada gunanya hidup',
    'mau mengakhiri', 'tidak kuat lagi hidup', 'capek hidup'
]

// Priority 2: Block Patterns
const BLOCKED_PATTERNS = [
    /(^|\s)(babi|anjing|setan|iblis|sialan|kampret|bangsat)(\s|$)/i,
    /(jual|beli|cari)\s+(narkoba|obat terlarang|senjata|film biru|bokep)/i,
    /^(test|tes|halo){5,}$/i,
]

// Priority 3: Sanitize Patterns
const SANITIZE_PATTERNS = [
    /tolol|bodoh|goblok|idiot|sial/g,
]

// PENTING: Emergency TIDAK diblock — langsung diteruskan ke Bot 3
// dengan flag emergency=true dan notifikasi WA dikirim bersamaan
```

### 13.2 Lapisan 1: Sensor di System Prompt

Setiap bot memiliki aturan ini (sudah tercantum di masing-masing system prompt §5.2, §6.2, dst):

```
ATURAN INPUT OFENSIF — PERTANYAAN MENYERANG:
Jika user bertanya dengan nada menyerang tentang iman/Gereja:
1. JANGAN membela atau berdebat
2. JANGAN mengutip ayat untuk melawan
3. Jawab tenang: "Saya menghargai pertanyaan Anda. Setiap orang
   punya latar belakang masing-masing. Jika Anda ingin memahami
   ajaran Katolik tentang [topik], saya bisa bantu cari referensinya.
   Namun untuk diskusi mendalam, Pastor kami lebih tepat."
4. Jika terus memprovokasi: "Sepertinya diskusi ini kurang produktif.
   Ada informasi paroki lain yang bisa saya bantu?"

ATURAN CURHAT/KELUHAN PRIBADI:
1. Validasi emosi dulu — jangan langsung solusi
2. Jangan menghakimi
3. "Saya turut prihatin. Apakah Anda ingin bercerita lebih?
   Atau mau saya hubungkan dengan seseorang yang bisa membantu?"
4. Tawarkan solusi nyata setelah validasi

ATURAN RANDOM/SPAM:
1. Jangan menghakimi
2. "Maaf, saya asisten digital Paroki Santo Klemens.
   Saya hanya bisa membantu informasi paroki dan iman Katolik."
3. Jika 2x → alihkan ke topik positif
```

### 13.3 Lapisan 2: Abuse Feedback Log

```sql
CREATE TABLE public.ai_abuse_logs (
    id BIGSERIAL PRIMARY KEY,
    bot_type TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    original_input TEXT NOT NULL,
    filter_action TEXT NOT NULL CHECK (filter_action IN
        ('block','sanitize','pass','emergency')),
    filter_reason TEXT,
    response_given TEXT,
    emergency_sos BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.4 Lapisan 3: Graduated Response

| Level | Syarat | Dampak |
|---|---|---|
| 0 | Normal | ✅ Semua bot normal |
| 1 | ≥ 3 filtered dalam 24 jam | ⚠️ Bot 1 diblokir sementara. Hanya akses Bot 2+ |
| 2 | ≥ 5 filtered dalam 7 hari | ⚠️ Semua bot publik dibatasi. Wajib login |
| 3 | ≥ 10 filtered dalam 30 hari | ❌ Lapor admin + pembatasan akun |
| — | Emergency SOS terdeteksi | Bot 3 TETAP aktif, semua filter dinonaktifkan untuk sesi ini |

---
