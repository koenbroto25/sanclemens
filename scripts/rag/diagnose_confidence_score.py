import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2
import google.genai as genai
from google.genai import types
import asyncio
import math

gemini_key = os.environ.get("GOOGLE_API_KEY_1")

async def embed(text):
    client = genai.Client(api_key=gemini_key, http_options={"api_version": "v1beta"})
    result = await client.aio.models.embed_content(
        model="models/gemini-embedding-2", contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768))
    return result.embeddings[0].values

def magnitude(vec):
    return math.sqrt(sum(v * v for v in vec))

def true_cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (magnitude(a) * magnitude(b))

def parse_vector(s):
    return [float(x) for x in s.strip("[]").split(",")]

def format_vector(vec):
    return "[" + ",".join(repr(v) for v in vec) + "]"

async def main():
    conn = psycopg2.connect(
        host=os.environ["COCKROACHDB_HOST"], port=26257,
        dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
        password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
    cur = conn.cursor()

    # 1. Ambil 1 chunk yang KITA TAHU relevan -- cari Summa Theologica soal keberadaan Tuhan
    cur.execute("""
        SELECT tc.id, tc.content_embedding, tc.content_preview
        FROM theological_chunks tc
        WHERE tc.source_document ILIKE '%Summa Theologica%'
          AND tc.content_preview ILIKE '%God%'
        LIMIT 1
    """)
    row = cur.fetchone()
    if not row:
        print("Tidak ketemu chunk contoh, coba kriteria lain")
        conn.close()
        return

    chunk_id, chunk_embedding_str, preview = row
    print("Chunk contoh:", preview[:150])

    chunk_vec = parse_vector(chunk_embedding_str)
    print(f"Magnitude chunk tersimpan: {magnitude(chunk_vec):.6f}  (harus ~1.0 kalau normalisasi berhasil)")

    # 2. Generate query embedding PERSIS seperti yang dipakai route.ts (generateQueryEmbedding)
    query_text = "Apa pendapat Santo Thomas Aquinas tentang keberadaan Tuhan?"
    query_vec = await embed(query_text)
    print(f"Magnitude query embedding (dari generateQueryEmbedding): {magnitude(query_vec):.6f}")

    # 3. Cosine similarity SUNGGUHAN (ground truth, tidak bergantung asumsi normalisasi)
    true_sim = true_cosine_similarity(query_vec, chunk_vec)
    print(f"\nTrue cosine similarity (dihitung manual, akurat): {true_sim:.6f}")

    # 4. Skor yang dihasilkan rumus search_rag_chunks() (1 - L2^2/2) -- pakai <-> asli dari DB
    cur.execute(
        "SELECT 1.0 - (power(content_embedding <-> %s::vector, 2.0) / 2.0) FROM theological_chunks WHERE id = %s",
        (format_vector(query_vec), chunk_id)
    )
    formula_score = cur.fetchone()[0]
    print(f"Skor formula search_rag_chunks() (1 - L2^2/2): {formula_score:.6f}")

    print(f"\nSelisih: {abs(true_sim - formula_score):.6f}")
    if abs(true_sim - formula_score) > 0.05:
        print(">> ADA DISTORSI SIGNIFIKAN antara skor formula vs cosine similarity asli.")
        print(">> Kemungkinan besar: query embedding TIDAK ternormalisasi, chunk SUDAH ternormalisasi.")
    else:
        print(">> Skor formula konsisten dengan cosine similarity asli -- bukan masalah matematis.")

    conn.close()

asyncio.run(main())
