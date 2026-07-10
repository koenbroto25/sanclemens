-- ============================================================
-- MIGRATION: 084_prayers_collection.sql
-- Tabel: public.prayers_collection
-- Koleksi doa-doa Katolik (Bapa Kami, Rosario, Angelus, dll)
-- Domain: catechism_module
-- Kompatibel dengan: rag_ai_v6.md, qna_hub_v6.md, ai_implementation_plan_v6.md
-- ============================================================

-- Enable pgvector extension (required for VECTOR columns)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Drop table jika sudah ada (untuk development)
DROP TABLE IF EXISTS public.prayers_collection CASCADE;

-- ============================================================
-- TABLE DEFINITION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prayers_collection (
    -- === IDENTIFIERS ===
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- === KONTEN DOA ===
    prayer_name         TEXT NOT NULL,
    -- Nama doa (e.g., "Doa Bapa Kami", "Doa Rosario")

    prayer_type         TEXT NOT NULL,
    -- Kategori: 'doa_harian' | 'doa_marian' | 'doa_eucharistic' |
    --           'doa_sakramen' | 'doa_penitential' | 'doa_liturgical' | 'other'

    latin_text          TEXT,
    -- Teks Latin lengkap (jika ada)

    indonesian_text     TEXT NOT NULL,
    -- Teks Indonesia lengkap

    meaning             TEXT,
    -- Makna dan penjelasan singkat

    context             TEXT,
    -- Kapan doa ini digunakan (e.g., "Sebelum Ekaristi", "Untuk orang sakit")

    category            TEXT,
    -- Kategori detail: 'Marian' | 'Eucharistic' | 'Penitential' | 'Liturgical' | dll

    -- === METADATA ===
    access_level_min    INTEGER NOT NULL DEFAULT 0,
    -- 0=publik (doa umum), 2=umat_aktif (doa spesifik)

    source_reference    TEXT,
    -- e.g., "Matius 6:9-13" untuk Bapa Kami

    -- === EMBEDDING (opsional, untuk search by context) ===
    embedding           extensions.vector(768),
    -- NULL → di-generate via pipeline jika perlu search by meaning

    embedding_outdated  BOOLEAN DEFAULT FALSE,

    -- === AUDIT ===
    approved_by         UUID REFERENCES public.profiles(id),
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Index untuk filtering
CREATE INDEX IF NOT EXISTS idx_prayers_type
    ON public.prayers_collection USING btree (prayer_type);

CREATE INDEX IF NOT EXISTS idx_prayers_category
    ON public.prayers_collection USING btree (category);

CREATE INDEX IF NOT EXISTS idx_prayers_access_level
    ON public.prayers_collection USING btree (access_level_min);

-- HNSW Index untuk similarity search (jika embedding diisi)
CREATE INDEX IF NOT EXISTS idx_prayers_embedding
    ON public.prayers_collection
    USING hnsw (embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
    WHERE embedding IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.prayers_collection ENABLE ROW LEVEL SECURITY;

-- Policy: Akses publik untuk doa dengan access_level_min = 0
CREATE POLICY "Public prayers"
    ON public.prayers_collection FOR SELECT
    USING (access_level_min = 0);

-- Policy: Akses terbatas berdasarkan access layer user
CREATE POLICY "Restricted prayers by access layer"
    ON public.prayers_collection FOR SELECT
    USING (
        access_level_min > 0
        AND get_current_user_access_layer() >= access_level_min
    );

-- Policy: Admin (access_layer >= 9) bisa write
CREATE POLICY "Admin can write"
    ON public.prayers_collection FOR ALL
    USING (get_current_user_access_layer() >= 9)
    WITH CHECK (get_current_user_access_layer() >= 9);

-- Policy: Service role (untuk API backend) bisa read/write
CREATE POLICY "Service role full access"
    ON public.prayers_collection FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prayers_collection_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_prayers_collection_updated_at
    BEFORE UPDATE ON public.prayers_collection
    FOR EACH ROW
    EXECUTE FUNCTION update_prayers_collection_updated_at();


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: get prayers by type (untuk API)
CREATE OR REPLACE FUNCTION get_prayers_by_type(
    p_prayer_type TEXT,
    p_access_level INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    prayer_name TEXT,
    prayer_type TEXT,
    latin_text TEXT,
    indonesian_text TEXT,
    meaning TEXT,
    context TEXT,
    category TEXT,
    access_level_min INTEGER,
    source_reference TEXT
)
LANGUAGE sql STABLE AS $$
    SELECT
        pc.id,
        pc.prayer_name,
        pc.prayer_type,
        pc.latin_text,
        pc.indonesian_text,
        pc.meaning,
        pc.context,
        pc.category,
        pc.access_level_min,
        pc.source_reference
    FROM public.prayers_collection pc
    WHERE pc.prayer_type = p_prayer_type
      AND pc.access_level_min <= p_access_level
    ORDER BY pc.prayer_name ASC;
$$;

-- Function: search prayers by context (similarity search)
-- Menggunakan embedding jika ada, jika tidak gunakan full-text search
CREATE OR REPLACE FUNCTION search_prayers_by_context(
    p_query_embedding VECTOR(768),
    p_bot_access TEXT,
    p_user_access_level INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    prayer_name TEXT,
    prayer_type TEXT,
    latin_text TEXT,
    indonesian_text TEXT,
    meaning TEXT,
    context TEXT,
    category TEXT,
    similarity_score FLOAT,
    access_level_min INTEGER
)
LANGUAGE sql STABLE AS $$
    SELECT
        pc.id,
        pc.prayer_name,
        pc.prayer_type,
        pc.latin_text,
        pc.indonesian_text,
        pc.meaning,
        pc.context,
        pc.category,
        1 - (pc.embedding <=> p_query_embedding) AS similarity_score,
        pc.access_level_min
    FROM public.prayers_collection pc
    WHERE pc.access_level_min <= p_user_access_level
      AND pc.embedding IS NOT NULL
      AND pc.embedding_outdated = FALSE
    ORDER BY pc.embedding <=> p_query_embedding
    LIMIT p_limit;
$$;

-- ============================================================
-- SAMPLE DATA (untuk testing)
-- ============================================================

INSERT INTO public.prayers_collection
    (prayer_name, prayer_type, latin_text, indonesian_text, meaning, context, category, access_level_min, source_reference)
VALUES
(
    'Doa Bapa Kami',
    'doa_harian',
    'Pater Noster, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum cotidianum da nobis hodie. Et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem, sed libera nos a malo. Amen.',
    'Bapa kami yang ada di surga, dimuliakanlah nama-Mu, datanglah kerajaan-Mu, jadilah kehendak-Mu di bumi seperti di surga. Berilah kami pada hari ini roti yang cukup untuk kami. Dan ampunilah kami pada kesalahan-kesalahan kami, sama seperti kami mengampuni orang yang bersalah kepada kami. Dan janganlah membawa kami ke dalam pencobaan, tetapi lepaskanlah kami dari yang jahat. Amin.',
    'Doa yang diajarkan langsung oleh Yesus Kristus (Matius 6:9-13). Terdiri dari 7 permintaan yang mencakup: pemuliaan Allah (3 permintaan), kerajaan Allah (1 permintaan), dan kebutuhan manusia (3 permintaan). Doa utama dalam Ekaristi dan kehidupan Katolik sehari-hari.',
    'Sebagai doa utama dalam Ekaristi, doa harian, dan doa persiapan sebelum sakramen',
    'Eucharistic',
    0,
    'Matius 6:9-13'
),
(
    'Doa Angelus',
    'doa_harian',
    'Angelus Domini nuntiavit Mariae, et concepit de Spiritu Sancto. Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.',
    'Malaikat Tuhanmemberitakan kepada Maria, dan ia mengandung dari Roh Kudus. Salam, Maria, penuh rahmat, Tuhan besamamu. Diberkatilah engkau di antara semua perempuan, dan diberkatilah buah rahimmu, Yesus. Santa Maria, Bunda Allah, doakanlah bagi kami yang berdosa, sekarang dan saat kematian kami. Amin.',
    'Doa yang diucapkan pada pagi (06:00), siang (12:00), dan sore (15:00) untuk memperingati Inkarnasi. Berisi inti dari Kabubahagian Sukacita dan doa Hail Mary.',
    'Pagi, siang, sore - menggantikan Doa Kerahiman Ilahi di musim Paskah',
    'Marian',
    0,
    'LK 1:26-38'
),
(
    'Doa Rosario (Kunci Ekaristi)',
    'doa_marian',
    'Credo... Deus, adiuva me... Domine, velociter exaudi...',
    'Aku Percaya... Allah, tolonglah aku... Tuhan, dengarlah aku dengan berseria...',
    'Doa Rosario terdiri dari: 1 Krde doa (Rasul), 1 Pater, 1 Ave per manik (20 per kesatuan), 1 Gloria, dan doa penutup. Diiringi renungan 15 Zaitun (Misteri) atau 20 Misteri Dukacita.',
    'Rosario dalam waktu luang, keluarga, persiapan sakramen, doa memori',
    'Marian',
    0,
    'Tradisi Gereja - Santo Dominikus'
),
(
    'Doa Salve Regina',
    'doa_marian',
    'Salve Regina, Mater misericordiae, vita, dulcedo, et spes nostra, salve. Ad te clamamus, exules, filii Evae. Ad te suspiramus, gementes et flentes in hac lacrimarum valle. Eia, ergo, Advocata nostra, illos tuos misericordes oculos ad nos converte. Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, O pia, O dulcis Virgo Maria.',
    'Salam, Ratu, Ibu Yang Maha Pengasih, hidup kami, kesenangan dan harapan kami, salam. Kepada-Mu kami berseru, anak-anak Buah Hati yang terbuang. Kepada-Mu kami merindukan, mengerang dan menangis di lembah air mata ini. Hai, Pembela kami, layangkanlah padamu rahmat-Mu yang Maha Penyayang. Dan tunjukkan kepada kami Yesus, buah berkat rahim-Mu, setelah kami berpulang. Wahai Pemurah, wahai Yang Murah Hati, wahai gadis Manis Maria.',
    'Doa marial untuk penghujung hari dan pada waktu maut. Menyatakan Maria sebagai Ratu dan Ibu yang Pengasih.',
    'Sekali pekan (Sabtu), waktu maut, waktu penguburan, doa harian',
    'Marian',
    0,
    'Tradisi Gereja'
),
(
    'Doa untuk Orang Sakit',
    'doa_sakramen',
    'Domine Iesu Christe, qui per beatum Iacobum Apostolum dixisti: Infirmatur quis inter vos? Inducat presbyteros Ecclesiae, et orent super eum, unguentes eum oleo in nomine Domini: et oratione fidei salvabit infirmus, et alleviabit eum Dominus: et si in peccatis sit, remittentur ei. Exaudi nos, Domine, et auxiliare nobis in infirmitate nostra...',
    'Tuhan Yesus Kristus, yang melalui Rasul Yakobus berkata: Adakah yang sakit di antara kamu? Panggillahkan para tua-tua Gereja, dan doakanlah untuknya, melumasinya dengan minyak atas nama Tuhan. Dan doa iman akan menyelamatkan orang sakit, dan Tuhan akan mengangkatnya. Jika ia berbuat dosa, akan diampuni baginya. Dengarlah kami, Tuhan, dan bantulah kami dalam kelemahan kami...',
    'Doa liturgis untuk administrasi sakramen Perejian Orang Sakit (Olean. Srius). Dilakukan oleh Pastor atau tua-tua Gereja yang diurapi.',
    'Sakramen Perejian Orang Sakit, kunjungan ke rumah sakit, pastoral rumah',
    'Penitential',
    2,
    'Yakobus 5:14-15'
);

-- ============================================================
-- GRANTS
-- ============================================================

-- Service role bisa akses penuh (untuk API)
GRANT ALL ON public.prayers_collection TO service_role;
GRANT ALL ON SEQUENCE prayers_collection_id_seq TO service_role;

-- Authenticated users bisa read doa publik
GRANT SELECT ON public.prayers_collection TO authenticated;

-- Anon users bisa read doa publik (access_level_min = 0)
GRANT SELECT ON public.prayers_collection TO anon;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.prayers_collection IS 'Koleksi doa-doa Katolik dari ekstensi Doa Harian Katolik. Digunakan untuk Bot 3 (Companion) dan Bot 8 (Learn Catholic). Domain: catechism_module.';
COMMENT ON COLUMN public.prayers_collection.prayer_name IS 'Nama doa (e.g., Doa Bapa Kami, Doa Rosario)';
COMMENT ON COLUMN public.prayers_collection.prayer_type IS 'Kategori doa: doa_harian, doa_marian, doa_eucharistic, doa_sakramen, doa_penitential, doa_liturgical, other';
COMMENT ON COLUMN public.prayers_collection.latin_text IS 'Teks Latin lengkap';
COMMENT ON COLUMN public.prayers_collection.indonesian_text IS 'Teks Indonesia lengkap (wajib)';
COMMENT ON COLUMN public.prayers_collection.meaning IS 'Makna dan penjelasan singkat doa';
COMMENT ON COLUMN public.prayers_collection.context IS 'Kapan doa digunakan (e.g., Sebelum Ekaristi, Untuk orang sakit)';
COMMENT ON COLUMN public.prayers_collection.category IS 'Kategori detail: Marian, Eucharistic, Penitential, Liturgical, dll';
COMMENT ON COLUMN public.prayers_collection.access_level_min IS '0=publik (doa umum), 2=umat_aktif (doa spesifik sakramen)';
COMMENT ON COLUMN public.prayers_collection.embedding IS 'Embedding untuk similarity search (VECTOR 768). NULL jika belum di-embed.';
COMMENT ON COLUMN public.prayers_collection.embedding_outdated IS 'TRUE jika konten diubah dan perlu re-embedding';
COMMENT ON COLUMN public.prayers_collection.source_reference IS 'Referensi Alkitab/Sumber Gereja (e.g., Matius 6:9-13)';