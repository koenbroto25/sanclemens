import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2
import google.genai as genai
from google.genai import types
import asyncio

gemini_key = os.environ.get("GOOGLE_API_KEY_1")

async def embed(text):
    client = genai.Client(api_key=gemini_key, http_options={"api_version": "v1beta"})
    result = await client.aio.models.embed_content(
        model="models/gemini-embedding-2", contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768))
    return result.embeddings[0].values

def format_vector(vec):
    return "[" + ",".join(repr(v) for v in vec) + "]"

async def main():
    conn = psycopg2.connect(
        host=os.environ["COCKROACHDB_HOST"], port=26257,
        dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
        password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
    cur = conn.cursor()

    queries = [
        "Apa pendapat Santo Thomas Aquinas tentang keberadaan Tuhan?",
        "What is Saint Thomas Aquinas's view on the existence of God?",  # versi EN, simulasi formalized_query_en
        "Apa itu Ekaristi?",
    ]

    for q in queries:
        print(f"\n{'='*70}\nQUERY: {q}\n{'='*70}")
        vec = await embed(q)
        cur.execute(
            "SELECT chunk_id, source_reference, similarity_score, boosted_score, content_preview "
            "FROM search_rag_chunks(%s::vector, %s, %s, %s, %s)",
            (format_vector(vec), "theology", "bot_8", 0, 5)
        )
        rows = cur.fetchall()
        if not rows:
            print("  (tidak ada hasil sama sekali)")
        for i, row in enumerate(rows, 1):
            chunk_id, source_ref, sim, boosted, preview = row
            print(f"\n  #{i} [{source_ref}] sim={sim:.4f} boosted={boosted:.4f}")
            print(f"      {preview[:200]}")

    conn.close()

asyncio.run(main())
