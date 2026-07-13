import os, time
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2

conn = psycopg2.connect(
    host=os.environ["COCKROACHDB_HOST"], port=26257,
    dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
    password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
conn.autocommit = True
cur = conn.cursor()

def parse_vector(s):
    return [float(x) for x in s.strip('[]').split(',')]

def format_vector(vec):
    return '[' + ','.join(repr(v) for v in vec) + ']'

def execute_with_retry(sql, params=None, max_retry=5):
    for attempt in range(max_retry):
        try:
            cur.execute(sql, params)
            return
        except psycopg2.errors.SerializationFailure:
            if attempt == max_retry - 1:
                raise
            time.sleep(1 * (attempt + 1))
            conn.rollback()

BATCH_SIZE = 500
last_id = '00000000-0000-0000-0000-000000000000'
total_processed = 0
total_normalized = 0

print("Mulai backfill normalisasi theological_chunks...")

while True:
    execute_with_retry(
        "SELECT id, content_embedding FROM theological_chunks WHERE id > %s ORDER BY id LIMIT %s",
        (last_id, BATCH_SIZE)
    )
    rows = cur.fetchall()
    if not rows:
        break

    for row_id, embedding_str in rows:
        vec = parse_vector(embedding_str)
        mag = sum(v * v for v in vec) ** 0.5
        last_id = row_id
        if abs(mag - 1.0) < 1e-6:
            continue  # sudah ternormalisasi -- skip, idempoten
        norm_vec = [v / mag for v in vec] if mag > 0 else vec
        execute_with_retry(
            "UPDATE theological_chunks SET content_embedding = %s::vector WHERE id = %s",
            (format_vector(norm_vec), row_id)
        )
        total_normalized += 1

    total_processed += len(rows)
    print(f"  Diproses: {total_processed} baris ({total_normalized} dinormalisasi)...")

print(f"SELESAI. Total diproses: {total_processed}, dinormalisasi: {total_normalized}")
conn.close()
