# AI Knowledge System — Dokumentasi Lengkap

## Ringkasan Sistem

Sistem AI Paroki Santo Klemens Sepinggan dibangun di atas **3 pilar utama**:

1. **Theological Source Framework** (BAB XXVII-XXX)
2. **Backend Knowledge Infrastructure** (migrations + API)
3. **Bot Prompt Architecture** ( dengan Theological Access Law)

---

## 1. Theological Source Framework

### 1.1 Hierarki Sumber (5 Tier)

| Tier | Otoritas | Akses Bot | Relevance Score |
|------|----------|-----------|----------------|
| **TIER 1** | Divine Revelation & Magisterium Solemne (KKG, Alkitab, Ensiklik, Vatikan II) | Semua Bot | 1.0 |
| **TIER 2** | Magisterium Ordinarium (Gereja Bapa, Doktor Gereja, Konsili Daerah) | Semua Bot + disclaimer | 0.95 |
| **TIER 3** | Canon Law & Liturgical Books (Kode Kanon, LJI, LHO, Rituale) | Semua Bot | 0.90 |
| **TIER 4** | Approved Spiritual Writers & Saints (dengan Imprimatur) | Bot 3 & Bot 1 (terbatas) + disclaimer | 0.70-0.85 |
| **TIER 5** | Pastoral Local (Surat Pastor, SOP Paroki, App Overview) | Semua Bot untuk konteks lokal | 0.60-0.70 |

### 1.2 Access Rules

**Prinsip Dasar:**
- **Rule of Double Source**: Untuk pertanyaan doctrinal, WAJIB引用 min 2 sumber (1 Tier 1 + 1 Tier 2)
- **Disclaimer Mandatory**: Untuk Tier 2-4, WAJIB sertakan disclaimer
- **Prohibited Sources**: Private revelations non-akui, sumber katolik yang bertentangan dengan Magisterium

**Decision Tree:**
```
 USER QUERY
    ↓
[CLASSIFY] → DOCTRINAL / LITURGICAL / SPIRITUAL / HAGIOGRAPHY / CANONICAL / GENERAL
    ↓
[SELECT TIER] → Sesuai klasifikasi
    ↓
[RETRIEVE] → retrieve_knowledge dengan document_code yang sesuai
    ↓
[VALIDATE] → Cek apakah Tier 2-4? → Tambah disclaimer
    ↓
[RESPOND] → Format sesuai tier + citation
```

---

## 2. Backend Knowledge Infrastructure

### 2.1 Database Schema

**Tabel Utama:**
- `theology.references` — Dokumen teologis dengan embeddings
- `public.app_overview_qna` — Q&A tentang aplikasi
- `public.learning_paths` — Jalur pembelajaran (tahap lanjutan)
- `public.learning_progress_records` — Progress user (tahap lanjutan)

### 2.2 API Endpoints

**Knowledge Retriever:** `POST /api/ai/knowledge-retriever`

**Request Parameters:**
```typescript
{
  query: string
  target_document_code?: string[]
  theology_topic?: string
  max_results?: number
  bot_mode?: string
  learning_depth?: string
}
```

**Response:**
```typescript
{
  snippets: Array<{
    content_text: string
    document_code: string
    paragraph_number?: string
    title?: string
    relevance_score: number
    source_type: 'theology' | 'app_overview'
  }>
  total_found: number
  query_embedding_time_ms: number
  search_time_ms: number
}
```

### 2.3 Migration Files

**Key migrations for AI system:**
- `20260618_ai_clm_knowledge_retriever.sql` — theology schema + ai_user_profiles
- `049_fase7_admin_system.sql` — admin system (telah diperbaiki)

---

## 3. Bot Prompt Architecture

### 3.1 Daftar Bot

| Bot | Nama | Layer | Fungsi | Theological Access |
|-----|------|-------|--------|-------------------|
| **Bot 1** | Info Publik | 0 (Guest) | Informasi paroki | Tier 1-3 (terbatas), Tier 4 + disclaimer |
| **Bot 2** | CS Sekretariat | 2+ | Administrasi | Tier 1-3 (Kode Kanon priority) |
| **Bot 3** | Companion Rohani | 2+ | Spiritual companion | **FULL ACCESS** (Tier 1-5) |
| **Bot 4** | DPP Assistant | 4+ | Keuangan/Kegiatan | Tier 3 (Kode Kanon), Tier 5 (SOP) |
| **Bot 5** | Environment Bot | 3+ | Lingkungan | Tier 5 (SOP Lingkungan) |
| **Bot 6** | Family Bot | 2+ | Keluarga | Tier 3 (Kanon keluarga), Tier 5 |
| **Bot 7** | Work Matching | 2+ | Pekerjaan | Tier 5 (SOP Pekerjaan) |

### 3.2 File Specifications

**Core Bot Specs:**
- `docs/ai_specifications/05_bot1_public_info.md` ✅ Revised
- `docs/ai_specifications/06_bot2_cs_secretariat.md` ✅ Revised
- `docs/ai_specifications/07_bot3_companion.md` ✅ Revised
- `docs/ai_specifications/08_bot4_dpp_assistant.md` ✅ Revised
- `docs/ai_specifications/09_bot5_environment_bot.md` ✅ Revised
- `docs/ai_specifications/10_bot6_family_bot.md` ✅ Revised
- `docs/ai_specifications/11_bot7_work_matching.md` ✅ Revised

**Architecture Documentation:**
- `docs/ai_specifications/27_theological_source_framework.md` ✅ Created
- `docs/ai_specifications/28_prayers_and_liturgy.md` ✅ Created
- `docs/ai_specifications/29_saints_and_hagiography.md` ✅ Created
- `docs/ai_specifications/30_bot_prompt_law_revision.md` ✅ Created

---

## 4. Content Strategy

### 4.1 Prioritas Pengumpulan Data

**Fase 1 (Bulan 1-2): Fondasi Doktrinal**
- [ ] KKG (CCC) — 2865 paragraf
- [ ] Kode Kanon 1983 — 1752 kanon
- [ ] Dokumen Vatikan II — 16 dokumen utama
- [ ] 5 Ensiklik Pope terbaru

**Fase 2 (Bulan 3-4): Liturgi & Doa**
- [ ] LJI (Liturgi Jamuan Indonesia)
- [ ] LHO (Liturgy of the Hours)
- [ ] Doa-doa Resmi (Rosary, Litany, dll.)
- [ ] Eucharistic Prayers I-IV
- [ ] Rituale Romanum

**Fase 3 (Bulan 5-6): Spiritualitas & Santo**
- [ ] Gereja Bapa (Confessions, De Trinitate, dll.)
- [ ] Doktor Gereja (Summa Theologica, Interior Castle, dll.)
- [ ] Lives of the Saints (Butler's with Imprimatur)
- [ ] Spiritual writers (Kreeft, Hahn)

**Fase 4 (Bulan 7): Kontekstualisasi Lokal**
- [ ] Konsili Plenarium KWI
- [ ] Surat Pastor Bishop Samarinda
- [ ] Materi Katekisasi LKN/LLI

### 4.2 Document Code Reference

**Scripture & Tradition:**
- `ALKITAB_AT` — Old Testament
- `ALKITAB_NT` — New Testament
- `TRADISI_APOSTOLIK` — Apostolic Fathers

**Magisterium:**
- `MAG_POPE_ENSIKLIK` — Encyclicals
- `MAG_VATII_LG` — Lumen Gentium
- `MAG_VATII_DV` — Dei Verbum
- `MAG_KKG` — Catechism
- `MAG_CDF` — Congregation documents

**Canon Law:**
- `KANON_1983` — Code of Canon Law
- `KANON_SAKRAMEN` — Sacramental regulations

**Liturgy:**
- `LIT_LJI` — Liturgi Jamuan Indonesia
- `LIT_LHO` — Liturgy of the Hours
- `LIT_RITUALE` — Rituale Romanum

**Prayers:**
- `DOA_UMUM` — Basic prayers
- `DOA_ROSARIUM` — Rosary
- `DOA_LHO` — Divine Office prayers

**Saints:**
- `SANCTUS_DOKTOR` — Doctors of the Church
- `SANCTUS_APOSTEL` — Apostles
- `SANCTUS_MODERN` — Modern saints

**Spirituality:**
- `SPIRIT_IGNATIUS` — Ignatian
- `SPIRIT_CARMEL` — Carmelite
- `SPIRIT_FRANCIS` — Franciscan

---

## 5. Implementation Checklist

### Immediate (Week 1-2):
- [x] Create theological source framework doc
- [x] Create prayers & liturgy doc
- [x] Create saints & hagiography doc
- [x] Create bot prompt revision doc
- [x] Revise Bot 1 prompt
- [x] Revise Bot 2 prompt
- [x] Revise Bot 3 prompt
- [ ] Update Knowledge Retriever API with tier filtering
- [ ] Create theological access validator middleware

### Short-term (Month 1):
- [ ] Populate Tier 1 documents (KKG, Kode Kanon)
- [ ] Populate Tier 2 (Vatican II, Encyclicals)
- [ ] Populate Tier 3 (LJI, LHO)
- [ ] Recruit theological review team
- [ ] Implement disclaimer auto-generation

### Medium-term (Months 2-3):
- [ ] Populate Tier 4 (Saints, spiritual writers)
- [ ] Implement double-source rule enforcement
- [ ] Create liturgical calendar engine
- [ ] Build contextual prayer system

### Long-term (Months 4-6):
- [ ] Populate Tier 5 (local context)
- [ ] Develop theological audit dashboard
- [ ] Implement multi-language support
- [ ] Create AI training pipeline for authority-aware responses

---

## 6. Quality Assurance

### Pre-deployment:
1. **Theological Review** (*Nihil Obstat*) — Mandatory for all documents
2. **Test Cases** — 50 per bot covering all tiers
3. **Disclaimer Injection Test** — 100% compliance for Tier 2-4
4. **Source Citation Test** — Every theological response must cite

### Runtime:
1. **Weekly Audit** — Theological accuracy review
2. **User Feedback Loop** — Flagged responses reviewed
3. **Source Tier Distribution** — Monitor % per tier
4. **Escalation Rate** — Track pastor escalation vs independent answers

---

## 7. Referensi Dokumen

**Main Documentation:**
- `docs/ai_specifications/01_ai_principles.md` — Prinsip dasar AI
- `docs/ai_specifications/02_knowledge_base.md` — Arsitektur knowledge base
- `docs/ai_specifications/27_theological_source_framework.md` — Hierarki sumber
- `docs/ai_specifications/28_prayers_and_liturgy.md` — Doa & liturgi
- `docs/ai_specifications/29_saints_and_hagiography.md` — Santo & hagiografi
- `docs/ai_specifications/30_bot_prompt_law_revision.md` — Revisi prompt bot

**Backend Documentation:**
- `docs/backend/schema_overview.md` — Gambaran umum skema
- `docs/backend/migration_history_summary.md` — Riwayat migrasi
- `docs/backend/rls_policies_summary.md` — Kebijakan RLS
- `docs/backend/functions_overview.md` — Fungsi database

**Architecture:**
- `docs/ai_architecture/ai_knowledge_retriever_tool.md` — Knowledge Retriever design

---

## 8. Contact & Responsibility

**Theological Review Board:**
- Pastor Paroki Santo Klemens Sepinggan
- Catechist / Dokumentalis
- Tim ICT (technical implementation)

**Last Updated:** 2026-06-17
**Version:** 1.0.0

---
**END OF DOCUMENTATION**