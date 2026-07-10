-- AKTIFKAN PGVECTOR EXTENSION
CREATE EXTENSION IF NOT EXISTS vector;

-- TABEL RAG — theology_references (sebelumnya di skema theology, sekarang public)
CREATE TABLE IF NOT EXISTS public.theology_references (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_index   INTEGER NOT NULL,
  document_code TEXT NOT NULL,             -- Singkatan: KGK, KHK, LG, DV, GS, SC, dll
  nama_dokumen  TEXT NOT NULL,
  penulis       TEXT NOT NULL,
  kategori      TEXT NOT NULL,             -- kitab_suci, katekismus, hukum_gereja, konsili_vatikan_ii, ensiklik, bapa_gereja, doktor_gereja, ignatian_tulisan_primer, ignatian_konstitusi, ignatian_kongregasi, patristik_gurun, spiritualitas_klasik
  teks          TEXT NOT NULL,
  embedding     extensions.vector(1536),
  theology_topic TEXT[],                   -- Topics array: ['sacraments', 'eucharist', 'mary']
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- idx_theology_embedding: dinonaktifkan, dimensi embedding (3008) melebihi limit hnsw/ivfflat (2000). Sequential scan digunakan.

CREATE INDEX IF NOT EXISTS idx_theology_kategori ON public.theology_references (kategori);
CREATE INDEX IF NOT EXISTS idx_theology_document_code ON public.theology_references (document_code);

-- TABEL LOG INTERAKSI AI
CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id), -- Asumsi public.profiles sudah ada
  bot_id TEXT NOT NULL,
  user_question TEXT NOT NULL,
  ai_raw_response TEXT NOT NULL,
  rag_context_used JSONB,
  liturgical_context_used JSONB,
  emotional_state TEXT,
  review_status TEXT DEFAULT 'pending' 
    CHECK (review_status IN ('pending', 'in_review', 'approved', 'rejected', 'red_note')),
  red_note_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL ANTRIAN FEEDBACK untuk Ahli Teologi
CREATE TABLE IF NOT EXISTS public.ai_feedback_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES public.ai_interaction_logs(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id), -- Asumsi public.profiles sudah ada
  proposed_answer TEXT,
  feedback_notes TEXT,
  review_priority TEXT DEFAULT 'normal' 
    CHECK (review_priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT DEFAULT 'open' 
    CHECK (status IN ('open', 'in_progress', 'completed')),
  assigned_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL JAWABAN YANG SUDAH DISETUJUI Ahli Teologi
CREATE TABLE IF NOT EXISTS public.ai_approved_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL UNIQUE,
  answer_text TEXT NOT NULL,
  answer_embedding extensions.vector(1536),
  source_log_id UUID REFERENCES public.ai_interaction_logs(id),
  document_references TEXT[],
  category TEXT,
  theology_topic TEXT,
  approved_by UUID REFERENCES public.profiles(id), -- Asumsi public.profiles sudah ada
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL CACHE LITURGI
CREATE TABLE IF NOT EXISTS public.cache_liturgi (
  tanggal           DATE PRIMARY KEY,
  perayaan          TEXT,
  tingkat_perayaan  TEXT,
  warna_liturgi     TEXT,
  is_minggu         BOOLEAN,
  musim_liturgi     TEXT,
  bacaan_list       TEXT[],
  url_sumber        TEXT,
  bacaan_lengkap    BOOLEAN DEFAULT false,
  discrape_pada     TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL BATCH KURASI
CREATE TABLE IF NOT EXISTS public.batch_kurasi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  status_batch    TEXT DEFAULT 'draft'
    CHECK (status_batch IN ('draft', 'dalam_review', 'sebagian_disetujui', 'selesai')),
  deadline_kurasi TIMESTAMPTZ,
  catatan_batch   TEXT,
  dibuat_pada     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tanggal_mulai)
);

-- TABEL RENUNGAN HARIAN
CREATE TABLE IF NOT EXISTS public.renungan_harian (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal             DATE NOT NULL,
  mode_persona        TEXT NOT NULL DEFAULT 'ignas',

  -- Metadata liturgi
  perayaan            TEXT NOT NULL,
  tingkat_perayaan    TEXT NOT NULL,
  warna_liturgi       TEXT NOT NULL,
  musim_liturgi       TEXT,
  tema_renungan       TEXT NOT NULL,
  bacaan_utama        TEXT NOT NULL,
  sumber_digunakan    TEXT[] DEFAULT '{}',

  -- Konten Bruder Ignas
  pengantar           TEXT,
  pintu_sabda         TEXT,
  suara_tradisi       TEXT,
  cermin_kehidupan    TEXT,
  doa_penutup         TEXT,

  -- Konten Pater Anton
  cerita_pendek       TEXT,
  ayat_sabda          TEXT,
  pertanyaan_refleksi TEXT,
  undangan_hening     TEXT,
  resonansi_minggu    TEXT,

  -- Display fields
  teks_lengkap            TEXT NOT NULL,
  ringkasan_150_kata       TEXT NOT NULL,
  kutipan_unggulan         TEXT NOT NULL,
  resonansi_untuk_notifikasi TEXT,

  -- Metadata variasi (untuk sistem rotasi)
  tipe_sapaan         TEXT,
  tipe_pintu_sabda    TEXT,
  tipe_kutipan        TEXT,
  tipe_penutup        TEXT,
  tipe_doa            TEXT,
  tipe_resonansi      CHAR(1), -- 'A' | 'B' | 'C' | 'D' | 'E'

  -- Sistem Skoring Teologis
  skor_kristologis    INTEGER,  -- 0–35
  skor_doktrinal      INTEGER,  -- 0–30
  skor_pastoral       INTEGER,  -- 0–20
  skor_sumber         INTEGER,  -- 0–10
  skor_liturgi        INTEGER,  -- 0–5
  skor_total          INTEGER,  -- 0–100
  lulus_validasi      BOOLEAN DEFAULT false,
  catatan_validasi    TEXT,

  -- Sistem Kurasi Pastoral
  batch_id            UUID REFERENCES public.batch_kurasi(id),
  status_kurasi       TEXT DEFAULT 'menunggu'
    CHECK (status_kurasi IN ('menunggu', 'disetujui', 'revisi', 'ditolak')),
  catatan_kurator     TEXT,
  dikurasi_oleh       TEXT,
  waktu_kurasi        TIMESTAMPTZ,
  versi_revisi        INTEGER DEFAULT 1,

  -- Status publikasi
  status              TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived', 'rejected')),
  waktu_generate      TIMESTAMPTZ DEFAULT NOW(),
  model_digunakan     TEXT DEFAULT 'gemini-2.5-flash', -- Diperbarui sesuai kesepakatan
  created_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tanggal, mode_persona)
);

CREATE INDEX IF NOT EXISTS idx_renungan_tanggal ON public.renungan_harian (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_renungan_mode ON public.renungan_harian (mode_persona);
CREATE INDEX IF NOT EXISTS idx_renungan_status ON public.renungan_harian (status);
CREATE INDEX IF NOT EXISTS idx_renungan_batch ON public.renungan_harian (batch_id);


-- TABEL LOG VALIDASI
CREATE TABLE IF NOT EXISTS public.renungan_log_validasi (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal          DATE NOT NULL,
  mode_persona     TEXT NOT NULL,
  attempt_ke       INTEGER NOT NULL DEFAULT 1,
  skor_total       INTEGER,
  skor_kristologis INTEGER,
  skor_doktrinal   INTEGER,
  alasan_gagal     TEXT,
  lulus            BOOLEAN NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL RIWAYAT REVISI KONTEN
CREATE TABLE IF NOT EXISTS public.renungan_revisi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renungan_id   UUID REFERENCES public.renungan_harian(id) ON DELETE CASCADE,
  versi         INTEGER NOT NULL,
  field_diubah  TEXT NOT NULL,
  nilai_lama    TEXT,
  nilai_baru    TEXT,
  diubah_oleh   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);



-- RLS POLICIES (Example, needs full review and customization)
-- Note: These RLS policies are examples and should be reviewed thoroughly
--       by the user's security team to ensure they meet exact requirements.
ALTER TABLE public.renungan_harian         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theology_references     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renungan_log_validasi   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renungan_revisi         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_kurasi            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_liturgi           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_approved_answers     ENABLE ROW LEVEL SECURITY;

-- Contoh Kebijakan RLS (perlu disesuaikan lebih lanjut)
-- Public read access for published renungan
DROP POLICY IF EXISTS "renungan_publik_read" ON public.renungan_harian;
CREATE POLICY "renungan_publik_read" ON public.renungan_harian
  FOR SELECT USING (status = 'published');

-- Authenticated users (curators) can read all renungan
DROP POLICY IF EXISTS "renungan_kurator_read" ON public.renungan_harian;
CREATE POLICY "renungan_kurator_read" ON public.renungan_harian
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users (curators) can update draft renungan
DROP POLICY IF EXISTS "renungan_kurator_update" ON public.renungan_harian;
CREATE POLICY "renungan_kurator_update" ON public.renungan_harian
  FOR UPDATE USING (auth.role() = 'authenticated' AND status = 'draft');

-- Service role for all backend operations (e.g., for RAG pipeline, CRON jobs)
DROP POLICY IF EXISTS "service_role_all_access_theology_references" ON public.theology_references;
CREATE POLICY "service_role_all_access_theology_references" ON public.theology_references
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_ai_interaction_logs" ON public.ai_interaction_logs;
CREATE POLICY "service_role_all_access_ai_interaction_logs" ON public.ai_interaction_logs
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_ai_feedback_queue" ON public.ai_feedback_queue;
CREATE POLICY "service_role_all_access_ai_feedback_queue" ON public.ai_feedback_queue
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_ai_approved_answers" ON public.ai_approved_answers;
CREATE POLICY "service_role_all_access_ai_approved_answers" ON public.ai_approved_answers
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_cache_liturgi" ON public.cache_liturgi;
CREATE POLICY "service_role_all_access_cache_liturgi" ON public.cache_liturgi
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_batch_kurasi" ON public.batch_kurasi;
CREATE POLICY "service_role_all_access_batch_kurasi" ON public.batch_kurasi
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_renungan_harian" ON public.renungan_harian;
CREATE POLICY "service_role_all_access_renungan_harian" ON public.renungan_harian
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_renungan_log_validasi" ON public.renungan_log_validasi;
CREATE POLICY "service_role_all_access_renungan_log_validasi" ON public.renungan_log_validasi
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_access_renungan_revisi" ON public.renungan_revisi;
CREATE POLICY "service_role_all_access_renungan_revisi" ON public.renungan_revisi
  FOR ALL USING (auth.role() = 'service_role');