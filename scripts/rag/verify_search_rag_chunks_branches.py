import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2

conn = psycopg2.connect(
    host=os.environ["COCKROACHDB_HOST"], port=26257,
    dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
    password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
cur = conn.cursor()

cur.execute("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'search_rag_chunks'")
definisi = cur.fetchone()[0]

print("Jumlah UNION ALL:", definisi.count("UNION ALL"))
print("Ada daily_reflections:", "daily_reflections" in definisi)

conn.close()
