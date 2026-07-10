-- FUNGSI PENCARIAN SEMANTIK (depends on ai_knowledge_base)
-- FUNGSI PENCARIAN SEMANTIK
CREATE OR REPLACE FUNCTION public.cari_sumber_relevan(
  query_embedding extensions.vector(1536),
  jumlah_hasil     INTEGER DEFAULT 5,
  min_similarity   FLOAT DEFAULT 0.72,
  filter_kategori  TEXT DEFAULT NULL
)
RETURNS TABLE (
  id            UUID,
  nama_dokumen  TEXT,
  penulis       TEXT,
  kategori      TEXT,
  teks          TEXT,
  similarity    FLOAT
)
LANGUAGE SQL STABLE SET search_path = public, extensions AS $$
  SELECT akb.id, akb.nama_dokumen, akb.penulis, akb.kategori, akb.content_for_rag,
         1 - (akb.content_embedding <=> query_embedding) AS similarity
  FROM public.ai_knowledge_base akb
  WHERE (filter_kategori IS NULL OR akb.kategori = filter_kategori)
    AND akb.content_embedding IS NOT NULL
    AND 1 - (akb.content_embedding <=> query_embedding) > min_similarity
    AND akb.status = 'approved'
  ORDER BY akb.content_embedding <=> query_embedding
  LIMIT jumlah_hasil;
$$;