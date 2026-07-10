#!/usr/bin/env python3
import os, json, uuid, logging, boto3
from botocore.config import Config
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import google.genai as genai
from google.genai import types
import asyncio

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)
load_dotenv(Path(__file__).resolve().parents[2] / '.env.local')

R2_BUCKET = os.environ.get('R2_BUCKET_NAME', 'paroki-klemens-rag-content')
PREVIEW_LEN = 150
DATA_DIR = Path(__file__).resolve().parents[2] / 'data'

gemini_keys = [os.environ.get(f'GOOGLE_API_KEY_{i}') for i in range(1, 151) if os.environ.get(f'GOOGLE_API_KEY_{i}')]
key_index = 0

def get_r2():
    return boto3.session.Session().client('s3',
        endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        region_name='auto', aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
        config=Config(signature_version='s3v4'))

def get_db():
    return psycopg2.connect(
        host='aws-1-ap-southeast-1.pooler.supabase.com', port=6543,
        dbname='postgres', user='postgres.brfdzodjzoeoylbfzkry',
        password=os.environ.get('SUPABASE_DB_PASSWORD',''), sslmode='require')

async def embed_text(text):
    global key_index
    for _ in range(len(gemini_keys)):
        key = gemini_keys[key_index]
        try:
            client = genai.Client(api_key=key, http_options={'api_version':'v1beta'})
            result = await client.aio.models.embed_content(
                model='models/gemini-embedding-2', contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768))
            return result.embeddings[0].values
        except Exception as e:
            if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                key_index = (key_index + 1) % len(gemini_keys)
                await asyncio.sleep(1)
            else:
                key_index = (key_index + 1) % len(gemini_keys)
                await asyncio.sleep(0.5)
    raise Exception('All keys exhausted')

def already_uploaded(conn, idx):
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM public.ai_knowledge_base WHERE document_code='PRAYERS_KATOLIK' AND chunk_index=%s", (idx,))
        return cur.fetchone() is not None

async def main():
    conn = get_db()
    r2 = get_r2()
    total_up = total_skip = total_err = 0
    with open(DATA_DIR / 'prayers.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    prayers = data.get('prayers', data) if isinstance(data, dict) else data
    logger.info(f'Total prayers: {len(prayers)}')
    for idx, prayer in enumerate(prayers):
        if already_uploaded(conn, idx):
            total_skip += 1
            continue
        prayer_id = str(uuid.uuid4())
        name = prayer.get('prayer_name', '')
        text = f"{name}\n\n{prayer.get('indonesian_text','')}"
        if prayer.get('meaning'): text += f"\n\nMakna: {prayer['meaning']}"
        if prayer.get('context'): text += f"\n\nKonteks: {prayer['context']}"
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.prayers (id,prayer_name,prayer_type,latin_text,indonesian_text,meaning,context,category,source_reference,access_level_min,domain,bot_access)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
                """, (prayer_id,name,prayer.get('prayer_type',''),prayer.get('latin_text',''),prayer.get('indonesian_text',''),prayer.get('meaning',''),prayer.get('context',''),prayer.get('category',''),prayer.get('source_reference',''),0,'catechism_module',['bot_3','bot_8']))
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f'Prayer table failed {idx}: {e}')
            total_err += 1
            continue
        try:
            embedding = await embed_text(text[:1500])
        except Exception as e:
            logger.error(f'Embed failed prayer {idx}: {e}')
            total_err += 1
            continue
        chunk_id = str(uuid.uuid4())
        r2_key = f'chunks/structured_entity/{chunk_id}.txt'
        preview = text[:PREVIEW_LEN].rstrip() + '...' if len(text) > PREVIEW_LEN else text
        try:
            r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=text.encode('utf-8'), ContentType='text/plain; charset=utf-8')
        except Exception as e:
            logger.error(f'R2 failed prayer {idx}: {e}')
            total_err += 1
            continue
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.structured_entity_chunks (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_entity_id,source_entity_table,entity_category,entity_active,embedding_outdated)
                    VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,TRUE,FALSE) ON CONFLICT (id) DO NOTHING
                """, (chunk_id,r2_key,preview,str(embedding),'prayers',prayer_id,'prayers',prayer.get('prayer_type','doa_harian')))
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                """, (str(uuid.uuid4()),'PRAYERS_KATOLIK',idx,'rag_chunk','structured_entity_chunks',chunk_id,'catechism_module',['bot_3','bot_8'],0,'approved',prayer.get('source_reference','Doa Katolik'),4,'prayer_guidance',name,'Tradisi Gereja Katolik','liturgi_devosi'))
            conn.commit()
            total_up += 1
        except Exception as e:
            conn.rollback()
            logger.error(f'DB failed prayer {idx}: {e}')
            total_err += 1
        if (total_up+total_err) % 20 == 0 and (total_up+total_err) > 0:
            logger.info(f'Progress: {total_up} up, {total_skip} skip, {total_err} err')
    conn.close()
    logger.info(f'PRAYERS DONE: {total_up} up, {total_skip} skip, {total_err} err')

if __name__ == '__main__':
    asyncio.run(main())