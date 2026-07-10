-- Create the saints_collection table
-- Requires pgvector extension (enabled in 085_enable_pgvector.sql)
CREATE TABLE public.saints_collection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saint_name TEXT NOT NULL,
    type TEXT,
    feast_day TEXT,
    biography TEXT,
    patronage TEXT[],
    visual_attributes TEXT[],
    access_level_min INTEGER DEFAULT 0,
    domain TEXT DEFAULT 'catechism_module',
    bot_access TEXT[] DEFAULT ARRAY[]::TEXT[],
    embedding extensions.VECTOR(768),
    embedding_outdated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saints_collection_domain ON public.saints_collection USING btree (domain);
CREATE INDEX IF NOT EXISTS idx_saints_collection_access_level_min ON public.saints_collection USING btree (access_level_min);
CREATE INDEX IF NOT EXISTS idx_saints_collection_type ON public.saints_collection USING btree (type);
CREATE INDEX IF NOT EXISTS idx_saints_collection_saint_name ON public.saints_collection USING btree (saint_name);

-- Create an IVFFLAT index for the embedding column for vector similarity search
-- Requires at least 100 rows for optimal results; lists is set to 100 for a moderate-sized dataset
CREATE INDEX IF NOT EXISTS idx_saints_collection_embedding ON public.saints_collection USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saints_collection ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read (assuming default access_level_min 0 for public content)
CREATE POLICY "Allow authenticated and public read access to saints_collection" ON public.saints_collection
FOR SELECT USING (
    -- Public content (access_level_min = 0) is always visible
    (access_level_min = 0)
    OR
    -- Authenticated users can see content with their access level or lower
    (auth.uid() IS NOT NULL AND auth.jwt() ->> 'user_id' IS NOT NULL AND (auth.jwt() ->> 'access_level')::int >= access_level_min)
);

-- Policy to allow 'service_role' to insert, update, and delete
CREATE POLICY "Allow service_role to manage saints_collection" ON public.saints_collection
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Function to update updated_at and set embedding_outdated on change
CREATE OR REPLACE FUNCTION public.update_saints_collection_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    IF OLD.biography IS DISTINCT FROM NEW.biography OR
       OLD.patronage IS DISTINCT FROM NEW.patronage OR
       OLD.visual_attributes IS DISTINCT FROM NEW.visual_attributes THEN
        NEW.embedding_outdated = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
CREATE TRIGGER trg_update_saints_collection_timestamps
BEFORE UPDATE ON public.saints_collection
FOR EACH ROW EXECUTE FUNCTION public.update_saints_collection_timestamps();

-- Set ownership for security (adjust 'authenticated' role if needed)
ALTER TABLE public.saints_collection OWNER TO postgres;
REVOKE ALL ON TABLE public.saints_collection FROM anon, authenticated;
GRANT ALL ON TABLE public.saints_collection TO postgres;
GRANT SELECT ON TABLE public.saints_collection TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.saints_collection TO service_role;

-- Optional: Add a comment to the table
COMMENT ON TABLE public.saints_collection IS 'Collection of Saints data for RAG and Q&A system.';