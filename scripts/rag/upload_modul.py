#!/usr/bin/env python3
import os, uuid, re, logging, boto3
from botocore.config import Config
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import google.genai as genai
from google.genai import types
import asyncio
import sys
import gc

_client_cache = {}
def get_client(key):
    if key not in _client_cache:
        _client_cache[key] = genai.Client(api_key=key, http_options={'api_version':'v1beta'})
    return _client_cache[key]

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)
load_dotenv(Path(__file__).resolve().parents[2] / '.env.local')

R2_BUCKET = os.environ.get('R2_BUCKET_NAME', 'paroki-klemens-rag-content')
PREVIEW_LEN = 150
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
MODUL_DIR = Path(__file__).resolve().parents[2] / 'data' / 'modul katolisitas'

MODUL_META = {
    'modul_0_rev':    {'title':'Modul 0 - Pintu Masuk','pillar':'pilar_00_pengantar'},
    'modul_1_1_rev':  {'title':'Modul 1.1 - Diciptakan untuk Cinta','pillar':'pilar_01_credo'},
    'modul_1_2_rev':  {'title':'Modul 1.2 - Siapa Yesus','pillar':'pilar_01_credo'},
    'modul_1_3_rev':  {'title':'Modul 1.3 - Kebangkitan','pillar':'pilar_01_credo'},
    'modul_1_4_rev':  {'title':'Modul 1.4 - Gereja','pillar':'pilar_01_credo'},
    'modul_1_5_rev':  {'title':'Modul 1.5 - Roh Kudus','pillar':'pilar_01_credo'},
    'modul_2_1a_rev': {'title':'Modul 2.1a - Liturgi Pengantar','pillar':'pilar_02_liturgi_sakramen'},
    'modul_2_1b_rev': {'title':'Modul 2.1b - Ekaristi','pillar':'pilar_02_liturgi_sakramen'},
    'modul_2_2_rev':  {'title':'Modul 2.2 - Baptis & Krisma','pillar':'pilar_02_liturgi_sakramen'},
    'modul_2_3_rev':  {'title':'Modul 2.3 - Tobat & Pengurapan','pillar':'pilar_02_liturgi_sakramen'},
    'modul_2_4_rev':  {'title':'Modul 2.4 - Pernikahan & Tahbisan','pillar':'pilar_02_liturgi_sakramen'},
    'modul_2_5_rev':  {'title':'Modul 2.5 - Tahun Liturgi','pillar':'pilar_02_liturgi_sakramen'},
    'modul_2_6_rev':  {'title':'Modul 2.6 - Doa Liturgis','pillar':'pilar_02_liturgi_sakramen'},
    'modul_3_1_rev':  {'title':'Modul 3.1 - Moral Dasar','pillar':'pilar_03_moral'},
    'modul_3_2a_rev': {'title':'Modul 3.2a - Hati Nurani','pillar':'pilar_03_moral'},
    'modul_3_2b_rev': {'title':'Modul 3.2b - Dosa & Rahmat','pillar':'pilar_03_moral'},
    'modul_3_3_rev':  {'title':'Modul 3.3 - Sepuluh Perintah','pillar':'pilar_03_moral'},
    'modul_3_4a_rev': {'title':'Modul 3.4a - Ajaran Sosial Gereja','pillar':'pilar_03_moral'},
    'modul_3_4b_rev': {'title':'Modul 3.4b - Lingkungan & Ekologi','pillar':'pilar_03_moral'},
    'modul_3_5_rev':  {'title':'Modul 3.5 - Doa','pillar':'pilar_04_doa'},
    'modul_3_6_rev':  {'title':'Modul 3.6 - Maria & Para Kudus','pillar':'pilar_05_mariologi'},
}

gemini_keys = [os.environ.get(f'GOOGLE_API_KEY_{i}') for i in range(1, 151) if os.environ.get(f'GOOGLE_API_KEY_{i}')]
key_index = 0

def get_r2():
    return boto3.session.Session().client('s3',
        endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        region_name='auto', aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
        config=Config(signature_version='s3v4'))

def get_db():
    # SSL mode 'prefer' untuk menghindari certificate verify failed di Windows
    return psycopg2.connect(
        host='aws-1-ap-southeast-1.pooler.supabase.com', port=6543,
        dbname='postgres', user='postgres.brfdzodjzoeoylbfzkry',
        password=os.environ.get('SUPABASE_DB_PASSWORD',''), sslmode='prefer')

async def embed_text(text):
    global key_index
    for _ in range(len(gemini_keys)):
        key = gemini_keys[key_index]
        try:
            client = get_client(key)
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

def normalize_embedding(vec):
    mag = sum(v * v for v in vec) ** 0.5
    return [v / mag for v in vec] if mag > 0 else vec

def chunk_text(text):
    sections = re.split(r'\n(?=#{1,3} )', text)
    chunks = []
    for section in sections:
        if len(section) <= CHUNK_SIZE:
            if section.strip(): chunks.append(section.strip())
        else:
            start = 0
            while start < len(section):
                end = min(start + CHUNK_SIZE, len(section))
                if end < len(section):
                    boundary = section.rfind('. ', start, end)
                    if boundary > start + (CHUNK_SIZE // 2):
                        end = boundary + 1
                chunk = section[start:end].strip()
                if chunk: chunks.append(chunk)
                if end >= len(section):
                    break
                new_start = end - CHUNK_OVERLAP
                start = max(new_start, start + 1)
    return [c for c in chunks if len(c.strip()) >= 50]

def already_uploaded(conn, doc_key, idx):
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM public.ai_knowledge_base WHERE document_code=%s AND chunk_index=%s", (doc_key, idx))
        return cur.fetchone() is not None

async def main():
    target_modul = sys.argv[1] if len(sys.argv) > 1 else None
    conn = get_db()
    r2 = get_r2()
    total_up = total_skip = total_err = 0
    for md_file in sorted(MODUL_DIR.glob('*.md')):
        doc_key = md_file.stem
        if target_modul and doc_key != target_modul:
            continue
        meta = MODUL_META.get(doc_key, {'title': doc_key, 'pillar': 'pilar_00_pengantar'})
        text = md_file.read_text(encoding='utf-8')
        chunks = chunk_text(text)
        logger.info(f'{doc_key}: {len(chunks)} chunks')
        for idx, chunk in enumerate(chunks):
            if already_uploaded(conn, doc_key, idx):
                total_skip += 1
                continue
            chunk_id = str(uuid.uuid4())
            r2_key = f'chunks/theological/{chunk_id}.txt'
            preview = chunk[:PREVIEW_LEN].rstrip() + '...' if len(chunk) > PREVIEW_LEN else chunk
            try:
                embedding = await embed_text(chunk)
                embedding = normalize_embedding(embedding)
            except Exception as e:
                logger.error(f'Embed failed {doc_key}[{idx}]: {e}')
                total_err += 1
                continue
            try:
                r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=chunk.encode('utf-8'), ContentType='text/plain; charset=utf-8')
            except Exception as e:
                logger.error(f'R2 failed {doc_key}[{idx}]: {e}')
                total_err += 1
                continue
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO public.theological_chunks
                            (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_document,source_reference,category_code,authority_level,pillar,source_types,embedding_outdated)
                        VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,%s,%s,FALSE) ON CONFLICT (id) DO NOTHING
                    """, (chunk_id,r2_key,preview,str(embedding),'catechism_module',meta['title'],f"Learn Catholic: {meta['title']}",'9','devotional',meta['pillar'],['kitab_suci','magisterium','tradisi_suci']))
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO public.ai_knowledge_base
                            (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic)
                        VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                    """, (str(uuid.uuid4()),doc_key,idx,'rag_chunk','theological_chunks',chunk_id,'catechism_module',['bot_8'],0,'approved',f"Learn Catholic: {meta['title']}",4,'catechism_explanation',meta['title'],'Tim Katolisitas','katekismus',['catechism','faith']))
                conn.commit()
                total_up += 1
            except Exception as e:
                conn.rollback()
                logger.error(f'DB failed {doc_key}[{idx}]: {e}')
                total_err += 1
            if (total_up+total_err) % 20 == 0 and (total_up+total_err) > 0:
                logger.info(f'Progress: {total_up} up, {total_skip} skip, {total_err} err')
                gc.collect()
    conn.close()
    logger.info(f'MODUL DONE: {total_up} up, {total_skip} skip, {total_err} err')

if __name__ == '__main__':
    asyncio.run(main())