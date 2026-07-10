DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'theology' AND table_name = 'references') THEN
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS chunk_index INTEGER;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS penulis TEXT;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS kategori TEXT;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS theology_topic TEXT[];
  END IF;
END $$;