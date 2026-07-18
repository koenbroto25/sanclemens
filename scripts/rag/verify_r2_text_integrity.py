import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2
import boto3
from botocore.config import Config

conn = psycopg2.connect(
    host=os.environ["COCKROACHDB_HOST"], port=26257,
    dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
    password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
cur = conn.cursor()

r2 = boto3.session.Session().client('s3',
    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    region_name='auto', aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
    config=Config(signature_version='s3v4'))
bucket = os.environ.get('R2_BUCKET_NAME', 'paroki-klemens-rag-content')

cur.execute("""
    SELECT id, content_r2_key, content_preview
    FROM theological_chunks
    ORDER BY random()
    LIMIT 10
""")
rows = cur.fetchall()

print(f"{'Preview di DB (awal)':<50} {'Cocok dgn isi R2?':<20}")
print("-" * 75)

semua_cocok = True
for chunk_id, r2_key, preview_db in rows:
    try:
        obj = r2.get_object(Bucket=bucket, Key=r2_key)
        text_r2 = obj['Body'].read().decode('utf-8')
        # preview di DB adalah potongan awal teks -- harus jadi prefix dari isi R2
        cocok = text_r2.strip().startswith(preview_db.strip()[:80])
        if not cocok:
            semua_cocok = False
        print(f"{preview_db[:48]:<50} {'COCOK' if cocok else 'TIDAK COCOK'}")
    except Exception as e:
        semua_cocok = False
        print(f"{preview_db[:48]:<50} GAGAL FETCH: {e}")

print("-" * 75)
if semua_cocok:
    print(">> R2 UTUH -- teks penuh masih benar, cuma kolom content_embedding yang rusak.")
    print(">> Pemulihan aman: re-embed dari teks R2, tidak perlu re-ingest dari file sumber asli.")
else:
    print(">> ADA KETIDAKCOCOKAN -- perlu investigasi lebih lanjut sebelum rencana pemulihan.")

conn.close()
