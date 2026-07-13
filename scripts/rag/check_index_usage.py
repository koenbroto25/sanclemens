import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2

conn = psycopg2.connect(
    host=os.environ["COCKROACHDB_HOST"], port=26257,
    dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
    password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
cur = conn.cursor()

cur.execute("SELECT content_embedding FROM theological_chunks LIMIT 1")
sample = cur.fetchone()[0]

cur.execute(
    "EXPLAIN SELECT id FROM theological_chunks ORDER BY content_embedding <-> %s::vector LIMIT 5",
    (sample,)
)
print("=== HASIL EXPLAIN ===")
for row in cur.fetchall():
    print(row[0])

conn.close()
