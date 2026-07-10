## BAB XXIV — Prompt Versioning & A/B Testing {#bab-xxiv}

### 24.1 Skema `public.ai_prompts` (Extended)

```sql
-- Tambahan kolom dari v4.0 (tanpa mengubah kolom yang sudah ada)
ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    version INTEGER DEFAULT 1;

ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    is_active BOOLEAN DEFAULT FALSE;

ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    is_ab_test BOOLEAN DEFAULT FALSE;

ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    ab_test_percentage INTEGER DEFAULT 0 CHECK (ab_test_percentage BETWEEN 0 AND 100);
-- Persentase user yang mendapat prompt versi ini dalam A/B test

ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    change_notes TEXT;
-- Catatan perubahan: "Rev1.0: Tambah chain-of-thought, formula penolakan resmi"

ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    approved_by UUID REFERENCES public.profiles(id);
-- User_id Pastor atau Super Admin yang menyetujui prompt ini

ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    approved_at TIMESTAMPTZ;

ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS
    performance_notes TEXT;
-- Catatan performa setelah dipakai: "Abuse log turun 30%, satisfaction naik"
```

### 24.2 Alur Persetujuan Prompt Baru

```
Developer buat prompt baru (is_active=false, is_ab_test=false)
  → Tim ICT review
    → Pastor review (untuk bot yang menyangkut teologi/pastoral)
      → Super Admin set approved_by + approved_at
        → Developer set is_ab_test=true, ab_test_percentage=10
          → Monitor 7 hari: bandingkan abuse_log & session_quality
            → Jika hasil baik: is_ab_test=false, is_active=true (versi lama dinonaktifkan)
            → Jika hasil buruk: is_ab_test=false, is_active=false (rollback otomatis)
```

### 24.3 Middleware Pemilihan Prompt

```typescript
// lib/ai/prompt-selector.ts

async function selectPrompt(botType: string, userId: string): Promise<string> {
    // Ambil semua versi aktif atau A/B test untuk bot ini
    const { data: prompts } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('bot_code', botType)
        .or('is_active.eq.true,is_ab_test.eq.true')

    const abTestPrompt = prompts?.find(p => p.is_ab_test)
    const activePrompt = prompts?.find(p => p.is_active && !p.is_ab_test)

    // Tentukan apakah user ini masuk ke kelompok A/B test
    if (abTestPrompt && isInABTestGroup(userId, abTestPrompt.ab_test_percentage)) {
        return abTestPrompt.prompt_text
    }

    return activePrompt?.prompt_text ?? getFallbackPrompt(botType)
}

function isInABTestGroup(userId: string, percentage: number): boolean {
    // Deterministic hash dari userId — user yang sama selalu dapat versi yang sama
    const hash = simpleHash(userId) % 100
    return hash < percentage
}
```

---
