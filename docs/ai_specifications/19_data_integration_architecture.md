## BAB XIX — Arsitektur Pemanggilan Data & Integrasi Tiga Portal {#bab-xix}

### 19.1 Arsitektur Umum (rev1.0)

```
User Input
  → [SERVER-SIDE] Emergency Keyword Check (sebelum semua proses)
      → Jika emergency: Notif WA Pastor + teruskan ke Bot 3 (bypass filter)
  → Filter Input 4 Lapis (BAB XIII)
  → Build AIRequestContext (BAB XX §20.3)
      → Ambil User Profile dari public.profiles + public.ai_user_profiles
      → Ambil Liturgical Context dari cache (BAB XXII)
      → Jika Bot 3 + E2E aktif: decrypt spiritual_journey_summary (client-side)
  → Pilih Bot (berdasarkan portal + layer)
  → Load System Prompt dari public.ai_prompts (versi aktif)
  → Inject Context Variables (Appendix C)
  → AI Model (z-ai/glm-4.5-air)
      → Chain-of-Thought internal (tidak dikirim ke user)
      → Respons
  → Post-processing:
      → Deteksi intent → update umat_needs (jika Bot 3/Bot 7)
      → Trigger matching (jika Bot 7 + confidence ≥ 0.5)
      → Notifikasi via WA/FCM jika perlu
      → Log ke ai_conversation_logs (non-E2E portion)
```

### 19.2 Perubahan dari v4.0 ke rev1.0/rev1.1

| Komponen | v4.0 | rev1.0/rev1.1 |
|---|---|---|
| Domain | paroki-santo-klemens.org | sanclemens.com |
| SSO Token Exchange | Ada | Tidak diperlukan |
| Portal 3 | Domain terpisah | Sub-route /pasar-kasih |
| Gate Hub | Tidak ada | Ada (Gate Bot) |
| Bot Keluarga | Tidak ada | Bot 6 Klemen Keluarga |
| Bot Matching | Tidak ada | Bot 7 Klemen Kerja |
| Input Filter | Tidak ada | 4 Lapis |
| Intent Detection | Tidak ada | Ada (umat_needs) |
| Confidence Scoring | Tidak ada | Ada |
| Verifikasi Manusia | Tidak ada | Ada (KL, Komsos, Pastor) |
| Emergency Detection | Di system prompt Bot 3 | Server-side hardcoded + system prompt |
| Liturgical Context | Tidak ada | Injeksi otomatis via cache harian (BAB XXII) |
| User Profile | Minimal (`profiles`) | Extended `ai_user_profiles` (BAB XX) |
| Chain-of-Thought | Tidak ada | Ada di semua bot (§1.7) |
| Formula Penolakan | Tidak terdefinisi | Formula resmi verbatim (§1.6) |
| Spiritual Memory | Tidak ada | Opt-in E2E (Bot 3 §7.8) |
| Gate Bot Mode | 2 mode | 3 mode (+ Re-aktivasi) |
| Bot 7 Expiry Check | Tidak ada | Wajib cek expires_at sebelum tawarkan |
| Handoff Protocol | Tidak ada | Formal (BAB XXIII) |
| Prompt Versioning | Basic | A/B Testing (BAB XXIV) |

---
