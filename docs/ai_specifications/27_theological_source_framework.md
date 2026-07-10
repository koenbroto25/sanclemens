# BAB XXVII — Theological Source Framework: Hierarki & Access Control

## 27.1 Prinsip Dasar: Hierarki Sumber Teologis Katolik

Berdasarkan prinsip *Magisterium Ecclesiae* dan *Lex Orandi, Lex Credendi*, semua data theologis dikategorikan dalam 5 Tier Otoritas:

### TIER 1: Divine Revelation & Solemn Magisterium (Binding Authority)
**Relevance Score: 1.0 | Access: Universal**

*   **ALKITAB (Sacred Scripture)**
    *   Terjemahan Resmi Gereja (GBK untuk Bahasa Indonesia)
    *   Liturgical Edition (untuk penggunaan liturgi)
*   **TRADISI APOSTOLIK (Sacred Tradition)**
    *   Didache, Apostolic Fathers
    *   Early Church Councils (Nicaea I, Constantinople I, Ephesus, Chalcedon)
*   **MAGISTERIUM SOLEMNE**
    *   Ensiklik Pope (*Encyclicae*): *Rerum Novarum*, *Evangelii Gaudium*, *Laudato Si'*, *Fratelli Tutti*
    *   Apostolic Constitution (*Constitutiones Apostolicae*): *Fidei Depositum*, *Divinus Perkins*
    *   Bull/Papal Bull: *Aeterni Patris*
    *   **Konsili Ekumenik Vatikan I & II**:
      * *Pastor Aeternus* (Primacy/Infallibility)
      * *Lumen Gentium* (Ecclesiology)
      * *Dei Verbum* (Revelation)
      * *Sacrosanctum Concilium* (Liturgy)
      * *Gaudium et Spes* (Church in Modern World)

### TIER 2: Magisterium Ordinarium & Universal (Authoritative)
**Relevance Score: 0.95 | Access: All Bots**

*   **Magisterium Pope (Ordinary)**
    *   Apostolic Exhortation (*Exhortationes Apostolicae*): *Christifideles Laici*, *Pastores Gregis*
    *   Rescripta / Motu Proprio: *Spiritus Domini*, *Traditionis Custodes*
    *   Discorsi & Allocuzioni (dari public address)
*   **Kongregasi Romawi (Congregations)**
    *   **CDF**: *Dominus Iesus*, *Persona Humana*, *Donum Vitae*, *Veritatis Splendor*
    *   **CDWDS**: *Missale Romanum* (1969, 2002), *Rituale Romanum*, GIRM
    *   **CCD**: Instruction on Liturgy, Sacraments
    *   **CICLSAL**:docs on consecrated life
*   **Konsili Daerah (Particular Councils)**
  * **Konsili Plenarium KWI**: Keputusan dengan *Recognitio* dari Roma
  * **Bishop Conferences** (majority decisions, but not universally binding unless confirmed by Rome)

### TIER 3: Canon Law & Liturgical Books
**Relevance Score: 0.90 | Access: All Bots (Priority for Sakramen/Liturgy queries)**

*   **KODE KANON 1983** (Codex Iuris Canonici - Latin Church)
  * Terjemahan Resmi: "Kodekan" by Wicaksono & Tim (USAID/UST), atau Liturgical Institute Indonesia
*   **KODE KANON 1990** (Oriental Churches)
*   **MISSALE ROMANUM** (Liturgi Jamuan Indonesia - LJI)
*   **RITUALE ROMANUM** (Baptis, Nikah, Pengurapan, dll.)
*   **LITURGY OF THE HOURS (LHO)** dalam Bahasa Indonesia
*   **Cæremoniale Episcoporum**

### TIER 4: Approved Theological Commentary & Spiritual Writers
**Relevance Score: 0.70-0.85 | Access: Penjelajah_Iman mode only (with disclaimer)**

*   **GEREJA BAPA (Church Fathers)** - Dengan catatan: ini adalah interpretasi pribadi, bukan dokumen magisterial
  * St. Augustine: *Confessions*, *De Trinitate*, *City of God*
  * St. John Chrysostom: *Homilies*
  * St. Gregory the Great: *Pastoral Rule*
  * St. Basil the Great, St. Ambrose, St. Jerome
* **DOKTOR GEREJA (Doctors of the Church)** - Karya-karya yang memiliki *Imprimatur*
  * St. Thomas Aquinas: *Summa Theologica* (selected parts, dengan catatan bahwa ini adalah karya pribadi)
  * St. Bonaventure: *Breviloquium*
  * St. Teresa of Ávila: *Interior Castle*, *Way of Perfection*
  * St. John of the Cross: *Dark Night of the Soul*, *Ascent of Mount Carmel*
  * St. Thérèse of Lisieux: *Story of a Soul*
  * St. Catherine of Siena: *Dialogue*
* **TEOLOG MODERN TERKEMUKA** (dengan *Imprimatur* atau *Nihil Obstat*)
  * Peter Kreeft
  * Scott Hahn
  * Hans Urs von Balthasar (selected works with imprimatur)
  * Joseph Ratzinger (Benedict XVI) - sebelum menjadi pope (teologis)

### TIER 5: Pastoral & Spiritual Writings (Local Context)
**Relevance Score: 0.60-0.70 | Access: Guest & Umat (with clear attribution)**

*   **SURAT PASTORAL BISHOP** (Indonesian Bishops)
  * Surat Pastor Keuskupan Samarinda
  * Surat Lingkungan
* **MATERI KATEKISIS** (dari lembaga resmi Gereja)
  * Lembaga Katekisasi Nasional (LKN)
  * Lembaga Liturgi Indonesia (LLI)
* **PADUAN SUARA & HYMNS** dengan persetujuan formal Gereja
* **KISAH SANTO-SANTO** yang diakui Gereja (dengan *Acta Sanctorum* atau sumber resmi VATikan)

---

## 27.2 The AI Access Law: Kerangka Berpikir untuk Retrieval

### Prinsip Dasar:
**"Quod semper, quod ubique, quod ab omnibus creditum est"** (What has been believed always, everywhere, and by all) - St. Vincent of Lérins

### Decision Tree untuk AI Access:

```
USER QUERY
    ↓
[CLASSIFY QUERY TYPE]
    ↓
    ├─ DOCTRINAL (Iman, Moral, Sakramen) → TIER 1 + TIER 2 (dengan disclaimer)
    │   └─ PRIMARY SOURCE: KKG, Ensiklik, Dokumen Vatikan II
    │   └─ SECONDARY: Gereja Bapa (sejarah pengembangan doktrin)
    │
    ├─ LITURGICAL (Misa, Doa, Liturgi Jamuan) → TIER 3
    │   └─ PRIMARY: LJI, Missale Romanum, Rituale Romanum
    │   └─ CONTEXTUAL: Current liturgical day/season
    │
    ├─ SPIRITUAL (Doa, Spiritual growth, Guidance) → TIER 3 + TIER 4 (dengan disclaimer)
    │   └─ Approved spiritual writers ONLY
    │   └─ ALWAYS include: "Ini adalah pandangan spiritual pribadi [author], bukan dokumen magisterial"
    │
    ├─ HAGIOGRAPHY (Santo, Kisah hidup) → TIER 4 + TIER 5
    │   └─ ONLY from Vatican-approved sources (Acta Sanctorum, Vatican.va)
    │   └─ NEVER from unverified internet sources
    │
    ├─ CANONICAL (Hukum Gereja, Administrasi) → TIER 3 (Kode Kanon)
    │   └─ Kode Kanon 1983 sebagai primary
    │   └─ Interpretasi dari Kongregasi Romawi sebagai secondary
    │
    └─ GENERAL/APP_INFO → TIER 5 (App Overview Q&A)
        └─ Public info about application features
```

### Access Priority Rules:

1. **RULE OF DOUBLE SOURCE**: Untuk pertanyaan doctrinals, AI WAJIB menyertakan minimal 2 sumber:
   - 1 sumber Tier 1 (KKG atau Ensiklik)
   - 1 sumber Tier 2 (Konsili atau Gereja Bapa - sebagai referensi historis)

2. **DISCLAIMER MANDATORY**: Untuk sumber Tier 2-5, AI WAJIB menyertakan disclaimer:
   ```
   *Catatan Teologis: Informasi ini bersumber dari [NAMA DOKUMEN]
   yang merupakan [KATEGORI: dokumen magisterial / komentar teologis / tulisan spiritual].
   Untuk dokumen magisterial, pengkajian lebih lanjut disarankan melalui Pastor atau Penatar Gereja.*
   ```

3. **CONTEXTUAL FILTERING**: AI harus selalu mempertimbangkan:
   - **Lingkungan**: Adaptasi budaya lokal ( kat文体 )
   - **User Mode: Guest vs Umat Terdaftar vs Admin
   - **Bot Mode: Info Publik vs Pendidikan vs Companion

4. **PROHIBITED SOURCES** (Tidak boleh diakses AI):
   - **Private Revelations** yang belum diakui Gereja (tanpa *Imprimatur*)
   - **Theological opinions** yang bertentangan dengan Magisterium (misal: doktrin modernis yang ditolak CDF)
   - **Non-Catholic sources** yang bertentangan dengan Katolik (jika tidak untukComparative religion study)
   - **Internet random blogs/websites** tanpa verifikasi teologis

---

## 27.3 Metadata Structure untuk Theological References

```typescript
interface TheologyReference {
  id: string
  document_code: string  // 'KKG_1', 'VATII_LG', 'DOA_ROSARY', 'SANCTUS_AUGUSTINE'
  document_type: 'SCRIPTURE' | 'MAGISTERIUM' | 'LITURGY' | 'PRAYER' | 'SAINT' | 'CATECHISM' | 'CANON_LAW'
  
  title: string
  content_text: string
  paragraph_number?: string  // "845", "LG 16", "Sacrosanctum 56"
  subsection?: string
  
  // Theological Classification
  theology_topic: string  // 'TRINITY', 'MARIOLOGY', 'ETHICS', 'LITURGY', 'GRACE'
  sub_topic?: string  // 'EUCHARIST', 'CONFESSION'
  
  // Authority Indicators
  authority_level: 'SOLEMN' | 'ORDINARY' | 'ORDINARY_UNIVERSAL' | 'APPROVED' | 'PASTORAL'
  author_or_source: string  // "Pope Francis", "St. Augustine", "CCC", "KWI"
  publication_date?: Date
  has_imprimatur: boolean
  imprimatur_by?: string  // "Bishop of Samarinda"
  
  // AI Access Control
  ai_access_tier: 1 | 2 | 3 | 4 | 5
  relevance_score: number  // 0.0 - 1.0 (calculated by embedding similarity)
  bot_modes_allowed: string[]  // ['Penjelajah_Iman', 'Guest_Info', 'Pendamping_Doa']
  
  // Language & Cultural Context
  language: 'id' | 'la' | 'en'
  cultural_context?: 'universal' | 'indonesia' | 'paduan_suara'
  
  // Technical
  content_embedding: number[]  // Vector embedding for semantic search
  created_at: Date
  updated_at: Date
}
```

---

## 27.4 Categorized Document Code Reference

### A. Scripture & Tradition
*   `ALKITAB_AT` - Alkitab Terjemahan Baru (Old Testament)
*   `ALKITAB_NT` - Alkitab Terjemahan Baru (New Testament)
*   `TRADISI_APOSTOLIK` - Apostolic Fathers & Early Church

### B. Magisterium (Categorized by Document Type)
*   `MAG_POPE_ENSIKLIK` - Papal Encyclicals
*   `MAG_POPE_APOST_EXHORT` - Apostolic Exhortations
*   `MAG_POPE_RESCRIPT` - Rescripts & Motu Proprio
*   `MAG_KKG` - Katekismus Gereja Katolik (CCC)
*   `MAG_VATII` - Vatican II Documents (LG, DV, SC, GS, NA, DH, UR)
*   `MAG_CDF` - Congregation for Doctrine of the Faith
*   `MAG_KWI` - Konferensi Waligreja Indonesia
*   `MAG_BISHOP` - Bishop Letters (Samarinda)

### C. Canon Law
*   `KANON_1983` - Code of Canon Law (Latin Church)
*   `KANON_1990` - Code of Canons of Eastern Churches
*   `KANON_SAKRAMEN` - Canonical regulations for sacraments

### D. Liturgy
*   `LIT_LJI` - Liturgi Jamuan Indonesia (full Missal)
*   `LIT_LHO` - Liturgy of the Hours (Divine Office)
*   `LIT_RITUALE` - Rituale Romanum (sacramental rites)
*   `LIT_CEREMONIAL` - Cæremoniale Episcoporum
*   `LIT_GIRM` - General Instruction of the Roman Missal

### E. Prayers & Devotions
*   `DOA_UMUM` - Common prayers (Our Father, Hail Mary, etc.)
*   `DOA_ROSARIUM` - Rosary prayers & mysteries
*   `DOA_LHO` - Liturgy of the Hours prayers
*   `DOA_DEVOTI` - Devotional prayers (Stations, Litany, etc.)
*   `DOA_SEKOLAH` - Prayer for daily life (meals, travel, exams)

### F. Saints & Hagiography
*   `SANCTUS_DOKTOR` - Doctors of the Church (with their major works)
*   `SANCTUS_APOSTEL` - Apostles & Early Saints
*   `SANCTUS_MODERN` - Modern Saints (post-1800)
*   `SANCTUS_INDONESIA` - Saints/Blissed related to Indonesia/Asia
*   `SANCTUS_QUOTE` - Approved quotes from saints

### G. Spiritual Theology
*   `SPIRIT_IGNATIUS` - Ignatian Spirituality
*   `SPIRIT_CARMEL` - Carmelite Spirituality
*   `SPIRIT_FRANCIS` - Franciscan Spirituality
*   `SPIRIT_SOS` - Social Spirituality (Catholic Social Teaching)

### H. Application Overview
*   `APP_OVERVIEW` - Q&A about application features
*   `APP_GUIDE` - User guides and tutorials

---

## 27.5 Implementation Checklist

### Immediate (Week 1-2):
- [ ] Create `theology.references` table schema (done in migration)
- [ ] Prepare metadata template for document ingestion
- [ ] Create document_type and authority_level enums
- [ ] Draft access control rules for AI retrieval API

### Short-term (Month 1):
- [ ] Recruit theological review team (1 Pastor + 1 Catechist)
- [ ] Acquire digital copies of:
  - [ ] KKG (CCC) in Indonesian
  - [ ] Kode Kanon 1983 (Indonesian translation)
  - [ ] LJI (Liturgi Jamuan Indonesia)
  - [ ] LHO (Liturgy of the Hours - Indonesian)
- [ ] Process and ingest Tier 1 documents into database
- [ ] Generate embeddings for all Tier 1 content

### Medium-term (Months 2-4):
- [ ] Ingest Tier 2 documents (Vatican II, Encyclicals, CDF documents)
- [ ] Ingest Tier 3 documents (Liturgical books)
- [ ] Develop automated quality check for *Imprimatur* validation
- [ ] Create AI training pipeline for authority-aware responses

### Long-term (Months 5-6):
- [ ] Ingest selected Tier 4 documents (approved theologians)
- [ ] Develop contextual adaptation engine (local culture + universal doctrine)
- [ ] Implement disclaimer auto-generation based on source tier
- [ ] Create "Theological Audit Log" for AI responses (trackability)

---

## 27.6 Quality Assurance Protocols

### Before any document enters the database:
1. **Theological Review** (*Nihil Obstat*) by appointed Pastor/Catechist
2. **Authority Verification**: Confirm document belongs to valid tier
3. **Metadata Validation**: Ensure `document_code`, `authority_level`, `ai_access_tier` are correctly set
4. **Embedding Quality**: Verify embedding captures theological semantics accurately
5. **RLS Testing**: Ensure RLS policies prevent unauthorized modifications

### Continuous Monitoring:
1. **AI Response Auditing**: Weekly review of AI-generated responses for doctrinal accuracy
2. **User Feedback Loop**: Flagged responses reviewed by theological team
3. **Source Citation Accuracy**: AI must always cite exact source (document + paragraph)
4. **Update cadence**: Magisterium documents checked quarterly for updates (new encyclicals, motu proprio, etc.)

---
**END OF CHAPTER 27**