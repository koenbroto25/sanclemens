import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import google.genai as genai
from google.genai import types
import asyncio
import math

gemini_key = os.environ.get("GOOGLE_API_KEY_1")

QUERY = "Apa pendapat Santo Thomas Aquinas tentang keberadaan Tuhan?"
QUERY_EN = "What is Saint Thomas Aquinas's view on the existence of God?"

# Teks persis dari chunk yang KITA TAHU seharusnya sangat relevan
# (muncul di hasil pencarian "Apa itu Ekaristi?" -- Summa Theologica I, Q2, tentang
# apakah keberadaan Tuhan itu self-evident)
RELEVANT_TEXT = """Objection 1: It seems that the existence of God is self-evident. Now
those things are said to be self-evident to us the knowledge of which
is naturally implanted in us, as we can see in regard to first principles."""

def magnitude(vec):
    return math.sqrt(sum(v * v for v in vec))

def true_cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (magnitude(a) * magnitude(b))

async def embed(text, dim):
    client = genai.Client(api_key=gemini_key, http_options={"api_version": "v1beta"})
    if dim is None:
        result = await client.aio.models.embed_content(
            model="models/gemini-embedding-2", contents=text)
    else:
        result = await client.aio.models.embed_content(
            model="models/gemini-embedding-2", contents=text,
            config=types.EmbedContentConfig(output_dimensionality=dim))
    return result.embeddings[0].values

async def test_dimension(dim_label, dim):
    q_vec = await embed(QUERY, dim)
    q_en_vec = await embed(QUERY_EN, dim)
    r_vec = await embed(RELEVANT_TEXT, dim)

    sim_id = true_cosine_similarity(q_vec, r_vec)
    sim_en = true_cosine_similarity(q_en_vec, r_vec)

    print(f"\n--- Dimensi: {dim_label} (panjang vektor: {len(q_vec)}) ---")
    print(f"  Cosine sim (query ID vs chunk relevan):  {sim_id:.4f}")
    print(f"  Cosine sim (query EN vs chunk relevan):  {sim_en:.4f}")
    return sim_id, sim_en

async def main():
    print(f"QUERY ID: {QUERY}")
    print(f"QUERY EN: {QUERY_EN}")
    print(f"CHUNK RELEVAN (Summa Theologica I, Q2 -- keberadaan Tuhan self-evident)")

    results = {}
    for label, dim in [("768 (saat ini dipakai sistem)", 768), ("1536", 1536), ("penuh/default", None)]:
        try:
            sim_id, sim_en = await test_dimension(label, dim)
            results[label] = (sim_id, sim_en)
        except Exception as e:
            print(f"\n--- Dimensi: {label} -- GAGAL: {e} ---")

    print("\n" + "="*60)
    print("RINGKASAN")
    print("="*60)
    for label, (sim_id, sim_en) in results.items():
        print(f"  {label}: ID={sim_id:.4f}  EN={sim_en:.4f}")

asyncio.run(main())
