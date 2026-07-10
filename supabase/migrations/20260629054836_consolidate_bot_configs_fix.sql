-- Migration: Consolidate bot_configs recreation and seeding
-- Created: 29 June 2026
-- Purpose: Resolve bot_configs schema and seeding issues by dropping, recreating, and seeding the table in one migration.

SET search_path = public, extensions;

-- ============================================================
-- 1. DROP TABLE: public.bot_configs (with CASCADE)
-- ============================================================
DROP TABLE IF EXISTS public.bot_configs CASCADE;

-- ============================================================
-- 2. CREATE TABLE: public.bot_configs (Correct Schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bot_configs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id                      TEXT NOT NULL UNIQUE,
    bot_name                    TEXT NOT NULL,
    access_level_required       INTEGER NOT NULL DEFAULT 0,
    rag_top_k_initial           INTEGER NOT NULL DEFAULT 15,
    rag_top_k_after_relevance   INTEGER NOT NULL DEFAULT 10,
    rag_top_k_final             INTEGER NOT NULL DEFAULT 5,
    min_confidence_threshold    FLOAT NOT NULL DEFAULT 0.70,
    use_llm_cross_encoder       BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_cross_domains       TEXT[],
    fallback_response_template  TEXT NOT NULL,
    max_turns_per_session       INTEGER DEFAULT 30,
    cooldown_suggestion_at_turn INTEGER DEFAULT 25,
    active_system_prompt_id     UUID, -- FK to ai_prompts.id, to be added later if needed
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. INSERT DATA: public.bot_configs (Seed Data)
-- ============================================================
INSERT INTO public.bot_configs
    (bot_id, bot_name, access_level_required,
     rag_top_k_initial, rag_top_k_after_relevance, rag_top_k_final,
     min_confidence_threshold, use_llm_cross_encoder,
     allowed_cross_domains, fallback_response_template,
     max_turns_per_session, cooldown_suggestion_at_turn)
VALUES
('bot_1', 'Klemen Penjaga Pintu', 0,
    10, 7, 3, 0.70, FALSE,
    ARRAY['system_guidance'],
    'Maaf, saya belum dapat menjawab pertanyaan ini. Silakan hubungi Sekretariat Paroki di [jam_operasional].',
    50, NULL),

('bot_bisnis', 'Bot Bisnis dan Lowongan Kerja', 0,
    15, 10, 5, 0.65, FALSE,
    ARRAY['charity_social'],
    'Saya tidak menemukan informasi yang relevan saat ini. Coba kata kunci lain atau perluas area pencarian.',
    50, NULL),

('bot_3', 'Bot Companion Rohani', 2,
    28, 15, 5, 0.72, TRUE,
    ARRAY['theology', 'catechism_module', 'renungan_harian'],
    'Maaf, saya tidak memiliki cukup konteks untuk mendampingi Anda pada topik ini. Saya sarankan untuk berbicara langsung dengan Pastor [nama] atau konselor paroki kami.',
    30, 25),

('bot_6', 'Bot Klemen Keluarga', 2,
    10, 7, 3, 0.70, FALSE,
    NULL,
    'Maaf, data yang Anda minta tidak dapat saya akses saat ini. Silakan hubungi Sekretariat Paroki atau Ketua Lingkungan Anda.',
    40, NULL),

('bot_7', 'Bot Klemen Kerja', 2,
    18, 12, 5, 0.65, FALSE,
    ARRAY['charity_social'],
    'Saya tidak menemukan kecocokan yang relevan saat ini. Data kami diperbarui secara berkala — coba lagi besok atau perluas kriteria pencarian.',
    40, NULL),

('bot_8', 'Bot Learn Catholic', 0,
    28, 15, 5, 0.72, TRUE,
    ARRAY['theology', 'catechism_module', 'renungan_harian'],
    'Maaf, saya tidak memiliki informasi resmi dari sumber Gereja mengenai topik ini. Silakan konsultasikan langsung dengan Pastor atau Ahli Teologi paroki kami.',
    50, NULL),

('bot_5', 'Bot Lingkungan', 4,
    12, 8, 4, 0.70, FALSE,
    ARRAY['public_info', 'admin_documents'],
    'Informasi yang Anda minta berada di luar akses saya. Silakan konsultasikan dengan Sekretariat Paroki.',
    40, NULL),

('bot_2', 'Bot CS Sekretariat', 2,
    12, 8, 4, 0.70, FALSE,
    ARRAY['public_info'],
    'Prosedur yang Anda tanyakan belum terdokumentasi dalam sistem saya. Silakan hubungi Sekretariat Paroki langsung di [jam_operasional].',
    50, NULL),

('bot_4', 'Bot Asisten DPP', 5,
    15, 10, 5, 0.70, FALSE,
    ARRAY['public_info', 'admin_documents', 'admin_lingkungan'],
    'Data yang diperlukan tidak tersedia dalam sistem saya saat ini. Silakan hubungi Bendahara atau Sekretariat untuk data lebih detail.',
    50, NULL),

('bot_pastor', 'Pastor Paroki Bot', 9,
    20, 12, 5, 0.68, FALSE,
    ARRAY['theology', 'admin_parish', 'admin_lingkungan'],
    'Tidak ada data terkini yang relevan yang relevan untuk pertanyaan ini.',
    50, NULL),

('bot_superadmin', 'Super Admin Bot', 10,
    10, 7, 5, 0.60, FALSE,
    ARRAY['admin_parish', 'system_guidance'],
    'Tidak ada data sistem yang tersedia.',
    50, NULL);

-- ============================================================
-- 4. RECREATE TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_bot_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_bot_configs_updated_at
BEFORE UPDATE ON public.bot_configs
FOR EACH ROW EXECUTE FUNCTION update_bot_configs_updated_at();