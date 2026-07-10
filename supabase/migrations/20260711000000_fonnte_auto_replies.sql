-- ============================================================================
-- Fonnte Auto-Replies — Dynamic configuration for WhatsApp bot
-- Created: 2026-07-11
-- Deskripsi: Tabel auto_replies untuk menyimpan aturan balasan otomatis Fonnte.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. public.auto_replies
--    Aturan balasan otomatis Fonnte untuk pesan masuk WhatsApp.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auto_replies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword             TEXT UNIQUE NOT NULL, -- Kata kunci pemicu balasan (bisa regex)
  response_message    TEXT NOT NULL,
  response_type       TEXT NOT NULL DEFAULT 'text', -- 'text', 'button', 'list', 'file'
  file_url            TEXT, -- URL file jika response_type adalah 'file'/'image'/'audio'/'video'
  file_filename       TEXT, -- Nama file jika mengirim file
  button_options      JSONB, -- Konfigurasi untuk pesan tombol/list
  priority            INTEGER DEFAULT 0, -- Prioritas jika ada beberapa keyword yang cocok
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES public.profiles(id),
  updated_by          UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_auto_replies_keyword ON public.auto_replies USING btree (keyword);
CREATE INDEX IF NOT EXISTS idx_auto_replies_active ON public.auto_replies USING btree (is_active);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_auto_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_replies_updated_at ON public.auto_replies;
CREATE TRIGGER trg_auto_replies_updated_at
  BEFORE UPDATE ON public.auto_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_auto_replies_updated_at();

-- ----------------------------------------------------------------------------
-- 2. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.auto_replies ENABLE ROW LEVEL SECURITY;

-- Hanya Super Admin yang bisa CRUD
DROP POLICY IF EXISTS auto_replies_admin_all ON public.auto_replies;
CREATE POLICY auto_replies_admin_all ON public.auto_replies
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Anonim tidak boleh membaca
DROP POLICY IF EXISTS auto_replies_anon_none ON public.auto_replies;
CREATE POLICY auto_replies_anon_none ON public.auto_replies
  FOR SELECT TO anon USING (false);

COMMENT ON TABLE public.auto_replies IS
  'Tabel untuk mengelola aturan balasan otomatis Fonnte WhatsApp bot, dikelola oleh Super Admin.';