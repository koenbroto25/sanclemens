# BAB XXIX — Saints, Hagiography, and Spiritual Figures

## 29.1 Data Structure for Saints

### A. Comprehensive Saint Profile Schema

```typescript
interface Saint {
  id: string
  saint_code: string  // 'SANCTUS_AUGUSTINE', 'SANCTUS_TERESA_AVILA'
  
  // Basic Information
  name: string  // "St. Augustine of Hippo"
  birth_name?: string  // "Aurelius Augustinus"
  birth_year: number
  birth_place?: string
  death_year: number
  death_place?: string
  
  // Status & Recognition
  status: 'SAINT' | 'BLESSED' | 'VENERABLE' | 'SERVANT_OF_GOD'
  canonized_by?: string  // "Pope Francis"
  canonization_date?: Date
  beatification_date?: Date
  
  // Role & Patronage
  patronage: string[]  // ["Theologians", "Printers", "Converts"]
  title?: string  // "Doctor of the Church", "Martyr", "Bishop"
  
  // Life & Ministry
  biography: {
    early_life: string
    conversion?: string
    ministry: string
    legacy: string
    key_events: Array<{
      date: string
      event: string
      location: string
    }>
  }
  
  // Writings & Works
  writings: Array<{
    title: string
    year: number
    type: 'BOOK' | 'LETTER' | 'SERMON' | 'POEM' | 'SPIRITUAL_TREATISE'
    description: string
    has_imprimatur: boolean
    source_link?: string
  }>
  
  // Spirituality & Teaching
  spirituality: {
    key_themes: string[]  // ['Grace', 'Interiority', 'Trinity', 'Eucharist']
    major_quotes: Array<{
      quote: string
      source: string
      context: string
    }>
    mystical_experiences?: Array<{
      description: string
      date?: string
      location?: string
    }>
  }
  
  // Liturgical Recognition
  liturgical: {
    feast_day: string  // "August 28"
    rank: 'SOLEMNITY' | 'FEAST' | 'MEMORIAL' | 'OPTIONAL_MEMORIAL'
    proper_prayers?: {
      collect?: string
      antiphons?: string[]
      hymns?: string[]
    }
  }
  
  // Canonical Sources
  official_sources: {
    vatican_bio?: string  // URL from vatican.va
    acta_sanctorum?: string
    papal_decree?: string
  }
  
  // Metadata
  theology_topic: string[]  // ['SPIRITUALITY', 'DOCTRINE', 'CHURCH_HISTORY']
  language: string[]  // ['la', 'it', 'en', 'id']
  cultural_context: 'UNIVERSAL' | 'EUROPE' | 'ASIA' | 'AFRICA' | 'INDONESIA'
  
  // AI
  ai_access_tier: 1 | 2 | 3 | 4 | 5
  relevance_score: number
  
  created_at: Date
  updated_at: Date
}
```

---

## 29.2 Priority Saints List

### Tier 1: Doctors of the Church (Must Have)

**Early Church Fathers (1-5 centuries):**
1. **St. Augustine of Hippo (354-430)**
   - Writings: *Confessions*, *De Trinitate* (On the Trinity), *City of God*, *Enchiridion*
   - Key Themes: Grace, Original Sin, Trinity, Interiority
   - Patronage: Theologians, printers, converts
   - Feast: August 28

2. **St. Ambrose of Milan (340-397)**
   - Writings: *De Officiis* (On Duties), *Exposition of the Faith*
   - Key Themes: Liturgy, Penance, Hierarchy
   - Patronage: Bee keepers, catechumens
   - Feast: December 7

3. **St. Jerome (342-420)**
   - Writings: *Vulgate* (Bible translation), *De Viris Illustribus*
   - Key Themes: Scripture, Asceticism
   - Patronage: Translators, librarians
   - Feast: September 30

4. **St. Basil the Great (330-379)**
   - Writings: *On the Holy Spirit*, *Monastic Rules*
   - Key Themes: Trinity, Monasticism, Social Justice
   - Feast: January 1 (with St. Gregory Nazianzen)

5. **St. Gregory the Great (540-604)**
   - Writings: *Pastoral Rule*, *Dialogues* (St. Benedict)
   - Key Themes: Papacy, Liturgy, Pastoral care
   - Feast: September 3

6. **St. John Chrysostom (349-407)**
   - Writings: *Homilies* on Matthew, John, Paul
   - Key Themes: Liturgy, Social Justice, Marriage
   - Feast: September 13

**Medieval Doctors:**
7. **St. Thomas Aquinas (1225-1274)**
   - Writings: *Summa Theologica*, *Summa Contra Gentiles*
   - Key Themes: Thomism, Natural Law, Eucharist
   - Feast: January 28
   - Note: Works are theological/personal reflection, not magisterial

8. **St. Bonaventure (1221-1274)**
   - Writings: *Breviloquium*, *Journey of the Mind to God*
   - Key Themes: Franciscan theology, Mysticism
   - Feast: July 15

**Modern Doctors:**
9. **St. Teresa of Ávila (1515-1582)**
   - Writings: *Interior Castle*, *Way of Perfection*
   - Key Themes: Carmelite spirituality, Mysticism, Prayer
   - Feast: October 15

10. **St. John of the Cross (1542-1591)**
    - Writings: *Dark Night of the Soul*, *Ascent of Mount Carmel*
    - Key Themes: Mystical theology, Dark night, Divine union
    - Feast: December 14

11. **St. Thérèse of Lisieux (1873-1897)**
    - Writings: *Story of a Soul* ( Autobiography)
    - Key Themes: Little Way, Trust, Childhood spirituality
    - Feast: October 1

12. **St. Catherine of Siena (1347-1380)**
    - Writings: *Dialogue*, *Letters*
    - Key Themes: Mysticism, Church reform, Divine love
    - Feast: April 29

### Tier 2: Apostles & Early Martyrs

**Apostles:**
1. **St. Peter** (d. 64-68) - Feast: June 29
2. **St. Paul** (d. 64-68) - Feast: June 29
3. **St. John the Evangelist** (d. 100) - Feast: December 27
4. **St. James the Greater** (d. 44) - Feast: July 25
5. **St. James the Less** (d. 62) - Feast: May 3

**Early Martyrs:**
6. **St. Stephen** (d. 34) - First martyr - Feast: December 26
7. **St. Polycarp** (69-155) - Feast: February 23
8. **St. Perpetua and Felicity** (203) - Feast: March 7

### Tier 3: Modern & Indonesian Saints

**Modern Saints (post-1800):**
1. **St. Joseph** (d. 1st century) - Feast: March 19 (Patron of Universal Church)
2. **St. Mary, Mother of God** - Feast: January 1
3. **St. Francis of Assisi** (1181-1226) - Feast: October 4
4. **St. Dominic** (1170-1221) - Feast: August 8
5. **St. Ignatius of Loyola** (1491-1556) - Feast: July 31
6. **St. Francis Xavier** (1506-1552) - Feast: December 3
7. **St. John Paul II** (1920-2005) - Feast: October 22
8. **St. Pio of Pietrelcina (Padre Pio)** (1887-1968) - Feast: September 23

**Asian/Indonesian Context:**
1. **St. Francis Xavier** - Missionary to Asia (Malacca, Japan, China)
2. **St. Peter Canisius** (1521-1597) - Dutch Jesuit, Catechism author
3. **Blessed Otto of Verona** - Missionary in Indonesia (1490s)
4. **Blessed Thevar Parambil** - Indian martyr in Indonesia
5. **St. Lawrence (Lautan) & Bl. Redemptus** - Martyrs in Indonesia (1350s)

### Tier 4: Popular Catholic Figures (with Approval)

1. **St. Faustina Kowalska** (1905-1938) - Divine Mercy - Feast: October 5
2. **St. Maximilian Kolbe** (1894-1941) - Martyr of Charity - Feast: August 14
3. **St. Teresa Benedicta of the Cross (Edith Stein)** (1891-1942) - Feast: August 9
4. **St. Josemaría Escrivá** (1902-1975) - Opus Dei founder - Feast: June 26
5. **St. Gianna Beretta Molla** (1922-1962) - Patron of doctors, mothers - Feast: April 28

---

## 29.3 Approved Hagiography Sources

### Primary Sources (Official):
1. **Acta Sanctorum** - Bollandists' official hagiography
2. **Vatican.va/biography** - Official Vatican biographies
3. **Lives of the Saints** series - Published by Vatican Press
4. **Butler's Lives of the Saints** (with Imprimatur edition)

### Secondary Sources (Approved):
1. **Saints books with Imprimatur** from diocesan bishop
2. **Pauline Books & Media** publications
3. **OSV (Our Sunday Visitor)** publications
4. **Ignatius Press** publications

### Citation Requirement:
All saint information must include:
- Source book/document
- Author/publisher
- Imprimatur status (if applicable)
- Year of publication

---

## 29.4 AI Hagiography Access Rules

### Tier Access:
- **TIER 1-2**: Only basic facts (name, dates, feast day)
- **TIER 3**: Full biography + spiritual themes (from approved sources)
- **TIER 4**: Quotes + mystical experiences (with *disclaimer*)

### Special Cases:
**Private Revelations:**
- **APPROVED by Church**: Fatima, Lourdes, Divine Mercy (Faustina)
- Can be accessed by AI only with explicit labeling:
  `"Source: Approved Private Revelation (Divinity, 1931)"`

**Local Saints & Blesseds:**
- Indonesian context saints (if any) get priority in Indonesian locale
- Must be verified through KWI or Vatican database

### Prohibited:
- Unapproved visions/apparitions (e.g., "Our Lady of [unapproved location]")
- Hagiography from non-Catholic sources
- Fan fiction or unverified "saint stories" from internet

---

## 29.5 Implementation Data Structure

```sql
CREATE TABLE theology.saints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    saint_code VARCHAR(100) UNIQUE NOT NULL,  -- 'SANCTUS_AUGUSTINE'
    name VARCHAR(200) NOT NULL,
    birth_name VARCHAR(200),
    birth_year INTEGER,
    birth_place VARCHAR(200),
    death_year INTEGER,
    death_place VARCHAR(200),
    
    -- Status
    status VARCHAR(50) NOT NULL,  -- 'SAINT', 'BLESSED', 'VENERABLE'
    canonized_by VARCHAR(200),
    canonization_date DATE,
    beatification_date DATE,
    
    -- Role
    title VARCHAR(200),  -- 'Doctor of the Church', 'Martyr', 'Bishop'
    patronage TEXT[],  -- ['Theologians', 'Printers']
    
    -- Content
    biography JSONB NOT NULL,
    writings JSONB,
    spirituality JSONB,
    
    -- Liturgical
    feast_day VARCHAR(50),  -- 'August 28'
    feast_rank VARCHAR(50),  -- 'MEMORIAL', 'FEAST'
    proper_prayers JSONB,
    
    -- Sources
    official_sources JSONB,
    has_imprimatur BOOLEAN DEFAULT FALSE,
    imprimatur_by VARCHAR(200),
    
    -- Classification
    theology_topic TEXT[],
    language TEXT[],
    cultural_context VARCHAR(50),
    
    -- AI
    ai_access_tier INTEGER DEFAULT 3,
    relevance_score DECIMAL(3,2) DEFAULT 0.8,
    bot_modes_allowed TEXT[],
    
    -- Technical
    content_embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 29.6 Sample Data Entry

### Example: St. Augustine of Hippo

```json
{
  "saint_code": "SANCTUS_AUGUSTINE",
  "name": "St. Augustine of Hippo",
  "birth_name": "Aurelius Augustinus",
  "birth_year": 354,
  "birth_place": "Thagaste, Numidia (modern Algeria)",
  "death_year": 430,
  "death_place": "Hippo Regius, Numidia",
  "status": "SAINT",
  "canonized_by": "Pope Clement VIII (1598, popular cultus confirmed)",
  "title": "Doctor of the Church",
  "patronage": ["Theologians", "Printers", "Converts", "Augustinians"],
  
  "biography": {
    "early_life": "...",
    "conversion": "...",
    "ministry": "...",
    "legacy": "...",
    "key_events": [...]
  },
  
  "writings": [
    {
      "title": "Confessions",
      "year": 397,
      "type": "BOOK",
      "has_imprimatur": true,
      "source_link": "..."
    },
    {
      "title": "De Trinitate",
      "year": 400,
      "type": "BOOK",
      "has_imprimatur": true
    },
    {
      "title": "City of God",
      "year": 426,
      "type": "BOOK",
      "has_imprimatur": true
    }
  ],
  
  "spirituality": {
    "key_themes": ["Grace", "Interiority", "Trinity", "Conversion"],
    "major_quotes": [
      {
        "quote": "You have made us for yourself, O God, and our hearts are restless until they rest in you.",
        "source": "Confessions 1.1",
        "context": "Opening of Confessions"
      }
    ]
  },
  
  "liturgical": {
    "feast_day": " August 28",
    "feast_rank": "MEMORIAL",
    "proper_prayers": {
      "collect": "O God, who fed the flock of Saint Augustine..."
    }
  },
  
  "official_sources": {
    "vatican_bio": "https://www.vatican.va/content/john-paul-ii/...",
    "acta_sanctorum": "August 28 volume"
  },
  
  "ai_access_tier": 4,
  "bot_modes_allowed": ["Penjelajah_Iman", "Pendamping_Rohani"]
}
```

---

## 29.7 Integrasi Data "Doa Harian Katolik" (Orang Kudus)

Data dari ekstensi VS Code "Doa Harian Katolik" akan diintegrasikan sebagai sumber referensi cepat untuk identitas santo-santa yang dirayakan setiap hari.

*   **Sumber Data**: `orangkudus.json` dari ekstensi akan di-*porting* ke `src/data/liturgi/orangkudus.json`.
*   **Akses**: Diakses melalui `src/lib/liturgi/orangKudusUtils.ts` yang menyediakan fungsi:
    *   `getSaintsByDate(date: Date)`: Mengambil daftar santo/santa yang dirayakan pada tanggal tertentu.
    *   `getSaintByName(name: string)`: Mengambil detail lengkap santo/santa berdasarkan nama.
*   **Penggunaan**:
    *   **Halaman Utama (Gerbang Rohani)**: Menampilkan peringatan santo-santa hari ini.
    *   **Personal Notifikasi**: Membandingkan nama baptis pengguna dengan data ini untuk mengirim ucapan dan doa harapan khusus hari peringatan santo pelindung.
    *   **Learn Catholic & AI Bot**: Menjadi referensi cepat untuk bot ketika ditanyakan "Siapa santo yang dirayakan hari ini?" atau "Ceritakan tentang St. [Nama]".

---

## 29.8 Quality Checklist

Before ingesting saint data:
1. **Status Verification**: Confirm canonization/beatification through Vatican
2. **Source Verification**: Only from Acta Sanctorum or official Vatican publications
3. **Theological Accuracy**: Ensure no heterodox teachings in biography
4. **Imprimatur Check**: For writings section
5. **Cultural Sensitivity**: For local saints (Indonesia context)
6. **Data Consistency**: Ensure data from `orangkudus.json` aligns with official church calendar and recognized hagiography.

---
**END OF CHAPTER 29**
