import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2
import google.genai as genai
from google.genai import types
import asyncio
import math

gemini_key = os.environ.get("GOOGLE_API_KEY_1")

def magnitude(vec):
    return math.sqrt(sum(v * v for v in vec))

def true_cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (magnitude(a) * magnitude(b))

def parse_vector(s):
    return [float(x) for x in s.strip("[]").split(",")]

async def embed(text):
    client = genai.Client(api_key=gemini_key, http_options={"api_version": "v1beta"})
    result = await client.aio.models.embed_content(
        model="models/gemini-embedding-2", contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768))
    return result.embeddings[0].values

async def main():
    conn = psycopg2.connect(
        host=os.environ["COCKROACHDB_HOST"], port=26257,
        dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
        password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
    cur = conn.cursor()

    # Cari chunk Summa Theologica I, Q2 -- "existence of God is self-evident"
    cur.execute("""
        SELECT id, content_embedding, content_preview, content_r2_key
        FROM theological_chunks
        WHERE source_document ILIKE '%Summa Theologica%'
          AND content_preview ILIKE '%existence of God is self-evident%'
        LIMIT 1
    """)
    row = cur.fetchone()
    if not row:
        print("Tidak ketemu chunk itu persis, coba kriteria lebih longgar...")
        cur.execute("""
            SELECT id, content_embedding, content_preview, content_r2_key
            FROM theological_chunks
            WHERE content_preview ILIKE '%self-evident%' AND content_preview ILIKE '%existence of God%'
            LIMIT 1
        """)
        row = cur.fetchone()

    if not row:
        print("Tetap tidak ketemu. Berhenti.")
        conn.close()
        return

    chunk_id, stored_embedding_str, preview, r2_key = row
    print(f"Chunk ID: {chunk_id}")
    print(f"R2 key: {r2_key}")
    print(f"Preview tersimpan: {preview}")

    stored_vec = parse_vector(stored_embedding_str)
    print(f"\nMagnitude vektor tersimpan: {magnitude(stored_vec):.6f}")

    # Generate embedding BARU untuk teks preview yang SAMA PERSIS
    fresh_vec = await embed(preview)
    print(f"Magnitude vektor baru (teks sama persis): {magnitude(fresh_vec):.6f}")

    # Ini yang paling penting: seberapa mirip vektor TERSIMPAN vs vektor BARU
    # untuk TEKS YANG SAMA PERSIS. Harusnya mendekati 1.0 (nyaris identik).
    sim = true_cosine_similarity(stored_vec, fresh_vec)
    print(f"\nCosine similarity (vektor tersimpan vs vektor baru, teks SAMA): {sim:.6f}")

    if sim < 0.9:
        print(">> RUSAK: vektor tersimpan TIDAK merepresentasikan teksnya sendiri dengan benar.")
        print(">> Kemungkinan besar proses backfill_normalize_embeddings.py merusak arah vektor.")
    else:
        print(">> Vektor tersimpan konsisten dengan teksnya -- bukan masalah korupsi data.")

    conn.close()

asyncio.run(main())
