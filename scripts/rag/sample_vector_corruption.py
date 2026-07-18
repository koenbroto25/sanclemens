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

    # Ambil 15 baris ACAK dari seluruh corpus (bukan cuma Summa Theologica)
    cur.execute("""
        SELECT id, content_embedding, content_preview, source_document
        FROM theological_chunks
        ORDER BY random()
        LIMIT 15
    """)
    rows = cur.fetchall()

    print(f"{'Dokumen':<45} {'Sim(tersimpan vs baru)':<10} Status")
    print("-" * 80)

    rusak = 0
    sehat = 0

    for chunk_id, stored_embedding_str, preview, source_doc in rows:
        stored_vec = parse_vector(stored_embedding_str)
        fresh_vec = await embed(preview)
        sim = true_cosine_similarity(stored_vec, fresh_vec)

        status = "RUSAK" if sim < 0.9 else "sehat"
        if sim < 0.9:
            rusak += 1
        else:
            sehat += 1

        doc_short = (source_doc or "")[:43]
        print(f"{doc_short:<45} {sim:<10.4f} {status}")

    print("-" * 80)
    print(f"Total sampel: {len(rows)} | Rusak: {rusak} | Sehat: {sehat} | Persentase rusak: {rusak/len(rows)*100:.1f}%")

    conn.close()

asyncio.run(main())
