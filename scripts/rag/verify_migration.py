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

def execute_with_retry(sql, max_retry=5):
    """CockroachDB terdistribusi -- bisa kena ReadWithinUncertaintyIntervalError
    kalau ada write bersamaan (mis. ingest sedang jalan). Retry singkat, ini normal."""
    for attempt in range(max_retry):
        try:
            cur.execute(sql)
            return
        except psycopg2.errors.SerializationFailure:
            if attempt == max_retry - 1:
                raise
            time.sleep(0.5 * (attempt + 1))
            conn.rollback()

print("=== 1. JUMLAH BARIS TIAP TABEL ===")
tabel_list = ['theological_chunks','ai_knowledge_base','saints_chunks','saints_index',
              'prayers','prayers_collection','structured_entity_chunks','operational_chunks',
              'internal_admin_chunks','qa_pairs','daily_reflections']
for t in tabel_list:
    execute_with_retry(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t}: {cur.fetchone()[0]}")

print("\n=== 2. FUNGSI YANG TERDAFTAR ===")
execute_with_retry("select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by proname")
for row in cur.fetchall():
    print(f"  {row[0]}")

print("\n=== 3. TRIGGER YANG AKTIF ===")
execute_with_retry("select tgname, tgrelid::regclass as tabel from pg_trigger")
rows = cur.fetchall()
if not rows:
    print("  KOSONG - tidak ada trigger aktif!")
for row in rows:
    print(f"  {row[0]} pada {row[1]}")

print("\n=== 4. FOREIGN KEY INTERNAL ===")
execute_with_retry("""
    select tc.table_name, kcu.column_name, ccu.table_name as referenced_table
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
    where tc.constraint_type = 'FOREIGN KEY'
""")
for row in cur.fetchall():
    print(f"  {row[0]}.{row[1]} -> {row[2]}")

print("\n=== 5. APAKAH INDEX VEKTOR BENAR-BENAR DIPAKAI QUERY? (paling penting) ===")
execute_with_retry("SELECT content_embedding FROM theological_chunks LIMIT 1")
sample = cur.fetchone()
if sample:
    execute_with_retry(f"""
        EXPLAIN SELECT id FROM theological_chunks
        ORDER BY content_embedding <=> '{sample[0]}'::vector LIMIT 5
    """)
    for row in cur.fetchall():
        print(f"  {row[0]}")
else:
    print("  Tidak ada data di theological_chunks untuk dites")

print("\n=== 6. CONTOH R2_KEY UNTUK VERIFIKASI R2 (ambil 3 acak) ===")
execute_with_retry("SELECT content_r2_key FROM theological_chunks WHERE content_r2_key IS NOT NULL LIMIT 3")
r2_keys = [r[0] for r in cur.fetchall()]
for k in r2_keys:
    print(f"  {k}")

conn.close()

print("\n=== 7. VERIFIKASI R2 BISA DIAKSES (via boto3, bukan AWS CLI) ===")
import boto3
from botocore.config import Config
r2 = boto3.session.Session().client('s3',
    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    region_name='auto', aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
    config=Config(signature_version='s3v4'))
bucket = os.environ.get('R2_BUCKET_NAME', 'paroki-klemens-rag-content')
for k in r2_keys:
    try:
        obj = r2.get_object(Bucket=bucket, Key=k)
        text = obj['Body'].read().decode('utf-8')
        print(f"  OK ({len(text)} char): {k}")
    except Exception as e:
        print(f"  GAGAL: {k} -- {e}")

print("\nSELESAI")
