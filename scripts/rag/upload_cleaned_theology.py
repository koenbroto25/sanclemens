#!/usr/bin/env python3
"""
Pipeline: chunk -> embed -> upload R2 + Supabase
Untuk 34 dokumen data/cleaned/ (Kitab Suci, Kanonik, Konsili, Kepausan, KGK, Patristik/Skolastik)
Kategori & authority_level mengikuti rag_data_governance_master.md bagian 3.1
Tanpa simpan ke disk - hemat RAM
Usage:
    python upload_cleaned_theology.py          # semua dokumen
    python upload_cleaned_theology.py small    # dokumen kecil saja (<200KB)
    python upload_cleaned_theology.py large    # dokumen besar saja (>=200KB)
"""
import os, uuid, re, sys, logging, boto3
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

R2_BUCKET     = os.environ.get('R2_BUCKET_NAME', 'paroki-klemens-rag-content')
PREVIEW_LEN   = 150
CHUNK_SIZE    = 800
CHUNK_OVERLAP = 100

CLEANED_DIR = Path(__file__).resolve().parents[2] / 'data' / 'cleaned'

# Metadata per dokumen sesuai rag_data_governance_master.md bagian 3.1
DOC_META = {
    'ALKITAB_Kitab_Suci_Katolik': {
        'nama': 'Alkitab (Kitab Suci Katolik)', 'penulis': 'Para Penulis Kitab Suci',
        'cat': '1', 'auth': 'highest', 'kategori': 'kitab_suci',
        'topic': ['kitab_suci', 'wahyu_ilahi'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Alkitab (Kitab Suci Katolik)', 'domain': 'theology'
    },
    'Kitab_Hukum_Kanonik': {
        'nama': 'Kitab Hukum Kanonik (Codex Iuris Canonici)', 'penulis': 'Gereja Katolik',
        'cat': '2', 'auth': 'medium', 'kategori': 'hukum_kanonik',
        'topic': ['hukum_kanonik', 'codex_iuris_canonici'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Kitab Hukum Kanonik', 'domain': 'theology'
    },
    'Dei_Verbum': {
        'nama': 'Dei Verbum', 'penulis': 'Konsili Vatikan II',
        'cat': '3', 'auth': 'highest', 'kategori': 'konsili_ekumenis',
        'topic': ['konsili_vatikan_ii', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Dei Verbum (Konsili Vatikan II)', 'domain': 'theology'
    },
    'Gaudium_et_Spes': {
        'nama': 'Gaudium et Spes', 'penulis': 'Konsili Vatikan II',
        'cat': '3', 'auth': 'highest', 'kategori': 'konsili_ekumenis',
        'topic': ['konsili_vatikan_ii', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Gaudium et Spes (Konsili Vatikan II)', 'domain': 'theology'
    },
    'nostra_aetate': {
        'nama': 'Nostra Aetate', 'penulis': 'Konsili Vatikan II',
        'cat': '3', 'auth': 'highest', 'kategori': 'konsili_ekumenis',
        'topic': ['konsili_vatikan_ii', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Nostra Aetate (Konsili Vatikan II)', 'domain': 'theology'
    },
    'Sacrosanctum_Concilium': {
        'nama': 'Sacrosanctum Concilium', 'penulis': 'Konsili Vatikan II',
        'cat': '3', 'auth': 'highest', 'kategori': 'konsili_ekumenis',
        'topic': ['konsili_vatikan_ii', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Sacrosanctum Concilium (Konsili Vatikan II)', 'domain': 'theology'
    },
    'Unitatis_Redintegratio': {
        'nama': 'Unitatis Redintegratio', 'penulis': 'Konsili Vatikan II',
        'cat': '3', 'auth': 'highest', 'kategori': 'konsili_ekumenis',
        'topic': ['konsili_vatikan_ii', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Unitatis Redintegratio (Konsili Vatikan II)', 'domain': 'theology'
    },
    'Deus_Caritas_Est': {
        'nama': 'Deus Caritas Est', 'penulis': 'Paus Benediktus XVI',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Deus Caritas Est (Paus Benediktus XVI)', 'domain': 'theology'
    },
    'Ecclesia_de_Eucharistia': {
        'nama': 'Ecclesia de Eucharistia', 'penulis': 'Paus Yohanes Paulus II',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Ecclesia de Eucharistia (Paus Yohanes Paulus II)', 'domain': 'theology'
    },
    'Evangelii_Gaudium_cleaned': {
        'nama': 'Evangelii Gaudium', 'penulis': 'Paus Fransiskus',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Evangelii Gaudium (Paus Fransiskus)', 'domain': 'theology'
    },
    'Fides_et_Ratio': {
        'nama': 'Fides et Ratio', 'penulis': 'Paus Yohanes Paulus II',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Fides et Ratio (Paus Yohanes Paulus II)', 'domain': 'theology'
    },
    'Humani_Generis': {
        'nama': 'Humani Generis', 'penulis': 'Paus Pius XII',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Humani Generis (Paus Pius XII)', 'domain': 'theology'
    },
    'lumen_fidei': {
        'nama': 'Lumen Fidei', 'penulis': 'Paus Fransiskus',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Lumen Fidei (Paus Fransiskus)', 'domain': 'theology'
    },
    'Mulieris_Dignitatem': {
        'nama': 'Mulieris Dignitatem', 'penulis': 'Paus Yohanes Paulus II',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Mulieris Dignitatem (Paus Yohanes Paulus II)', 'domain': 'theology'
    },
    'Mysterium_Fidei': {
        'nama': 'Mysterium Fidei', 'penulis': 'Paus Paulus VI',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Mysterium Fidei (Paus Paulus VI)', 'domain': 'theology'
    },
    'Redemptoris_Mater': {
        'nama': 'Redemptoris Mater', 'penulis': 'Paus Yohanes Paulus II',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Redemptoris Mater (Paus Yohanes Paulus II)', 'domain': 'theology'
    },
    'spe_salvi': {
        'nama': 'Spe Salvi', 'penulis': 'Paus Benediktus XVI',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Spe Salvi (Paus Benediktus XVI)', 'domain': 'theology'
    },
    'Veritatis_Splendor': {
        'nama': 'Veritatis Splendor', 'penulis': 'Paus Yohanes Paulus II',
        'cat': '4', 'auth': 'high', 'kategori': 'dokumen_kepausan',
        'topic': ['ensiklik_kepausan', 'magisterium'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Veritatis Splendor (Paus Yohanes Paulus II)', 'domain': 'theology'
    },
    'Catechism_of_the_Catholic_Church': {
        'nama': 'Katekismus Gereja Katolik', 'penulis': 'Gereja Katolik',
        'cat': '6', 'auth': 'highest', 'kategori': 'katekismus',
        'topic': ['katekismus', 'kgk'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Katekismus Gereja Katolik', 'domain': 'theology'
    },
    'Compendium_of_the_Catechism': {
        'nama': 'Kompendium Katekismus Gereja Katolik', 'penulis': 'Gereja Katolik',
        'cat': '6', 'auth': 'highest', 'kategori': 'katekismus',
        'topic': ['katekismus', 'kgk'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Kompendium Katekismus Gereja Katolik', 'domain': 'theology'
    },
    'Adversus_Haereses': {
        'nama': 'Adversus Haereses (Melawan Ajaran-Ajaran Sesat)', 'penulis': 'St. Ireneus dari Lyon',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Adversus Haereses (St. Ireneus)', 'domain': 'theology'
    },
    'De Trinitate (St. Agustinus)': {
        'nama': 'De Trinitate', 'penulis': 'St. Agustinus dari Hippo',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'De Trinitate (St. Agustinus)', 'domain': 'theology'
    },
    'De_Civitate_Dei': {
        'nama': 'De Civitate Dei (Kota Allah)', 'penulis': 'St. Agustinus dari Hippo',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'De Civitate Dei (St. Agustinus)', 'domain': 'theology'
    },
    'Homili_St._Yohanes_Krisostomus_1': {
        'nama': 'Homili St. Yohanes Krisostomus (Bagian 1)', 'penulis': 'St. Yohanes Krisostomus',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Homili St. Yohanes Krisostomus (Bagian 1)', 'domain': 'theology'
    },
    'Homili_St._Yohanes_Krisostomus_2': {
        'nama': 'Homili St. Yohanes Krisostomus (Bagian 2)', 'penulis': 'St. Yohanes Krisostomus',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Homili St. Yohanes Krisostomus (Bagian 2)', 'domain': 'theology'
    },
    'Homili_St._Yohanes_Krisostomus_3': {
        'nama': 'Homili St. Yohanes Krisostomus (Bagian 3)', 'penulis': 'St. Yohanes Krisostomus',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Homili St. Yohanes Krisostomus (Bagian 3)', 'domain': 'theology'
    },
    'Homili_St._Yohanes_Krisostomus_4': {
        'nama': 'Homili St. Yohanes Krisostomus (Bagian 4)', 'penulis': 'St. Yohanes Krisostomus',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Homili St. Yohanes Krisostomus (Bagian 4)', 'domain': 'theology'
    },
    'Summa_Contra_Gentiles': {
        'nama': 'Summa Contra Gentiles', 'penulis': 'St. Thomas Aquinas',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Summa Contra Gentiles (St. Thomas Aquinas)', 'domain': 'theology'
    },
    'Summa_Theologica _1': {
        'nama': 'Summa Theologica (Bagian 1)', 'penulis': 'St. Thomas Aquinas',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Summa Theologica (Bagian 1, St. Thomas Aquinas)', 'domain': 'theology'
    },
    'Summa_Theologica_2': {
        'nama': 'Summa Theologica (Bagian 2)', 'penulis': 'St. Thomas Aquinas',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Summa Theologica (Bagian 2, St. Thomas Aquinas)', 'domain': 'theology'
    },
    'Summa_Theologica_3': {
        'nama': 'Summa Theologica (Bagian 3)', 'penulis': 'St. Thomas Aquinas',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Summa Theologica (Bagian 3, St. Thomas Aquinas)', 'domain': 'theology'
    },
    'Summa_Theologica _4': {
        'nama': 'Summa Theologica (Bagian 4)', 'penulis': 'St. Thomas Aquinas',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Summa Theologica (Bagian 4, St. Thomas Aquinas)', 'domain': 'theology'
    },
    'Super Boethium De Trinitate': {
        'nama': 'Super Boethium De Trinitate', 'penulis': 'St. Thomas Aquinas',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Super Boethium De Trinitate (St. Thomas Aquinas)', 'domain': 'theology'
    },
    'Tome of Leo (St. Leo Agung)': {
        'nama': 'Tome of Leo (Tomus Leonis)', 'penulis': 'St. Leo Agung',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Tome of Leo (St. Leo Agung)', 'domain': 'theology'
    },
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
                logger.error(f'  Embed error (key {key_index}): {type(e).__name__}: {e!r}')
                key_index = (key_index + 1) % len(gemini_keys)
                await asyncio.sleep(0.5)
    raise Exception('All keys exhausted (last errors logged above)')

def normalize_embedding(vec):
    mag = sum(v * v for v in vec) ** 0.5
    return [v / mag for v in vec] if mag > 0 else vec

def chunk_text(text):
    sections = re.split(r'\n(?=#{1,3} |\n)', text)
    chunks = []
    for section in sections:
        if not section.strip():
            continue
        if len(section) <= CHUNK_SIZE:
            chunks.append(section.strip())
        else:
            start = 0
            while start < len(section):
                end = start + CHUNK_SIZE
                if end < len(section):
                    boundary = section.rfind('. ', start, end)
                    if boundary > start:
                        end = boundary + 1
                chunk = section[start:end].strip()
                if chunk:
                    chunks.append(chunk)
                if end >= len(section):
                    break
                next_start = end - CHUNK_OVERLAP
                start = next_start if next_start > start else end
    return [c for c in chunks if len(c.strip()) >= 50]

def already_uploaded(conn, doc_key, idx):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM public.ai_knowledge_base WHERE document_code=%s AND chunk_index=%s",
            (doc_key, idx))
        return cur.fetchone() is not None

async def process_file(conn, r2, filepath: Path):
    doc_key = filepath.stem
    m = DOC_META.get(doc_key, {
        'nama': doc_key, 'penulis': 'Unknown',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8'], 'ref': doc_key,
        'domain': 'theology'
    })

    logger.info(f'Reading {filepath.name} ({filepath.stat().st_size // 1024}KB)...')
    text = filepath.read_text(encoding='utf-8', errors='replace')
    chunks = chunk_text(text)
    logger.info(f'{doc_key}: {len(chunks)} chunks')

    up = skip = err = 0
    for idx, chunk in enumerate(chunks):
        if already_uploaded(conn, doc_key, idx):
            skip += 1
            continue

        chunk_id = str(uuid.uuid4())
        r2_key   = f'chunks/theological/{chunk_id}.txt'
        preview  = chunk[:PREVIEW_LEN].rstrip() + '...' if len(chunk) > PREVIEW_LEN else chunk

        try:
            embedding = await embed_text(chunk)
            embedding = normalize_embedding(embedding)
        except Exception as e:
            logger.error(f'Embed failed {doc_key}[{idx}]: {e}')
            err += 1
            continue

        try:
            r2.put_object(Bucket=R2_BUCKET, Key=r2_key,
                Body=chunk.encode('utf-8'), ContentType='text/plain; charset=utf-8')
        except Exception as e:
            logger.error(f'R2 failed {doc_key}[{idx}]: {e}')
            err += 1
            continue

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.theological_chunks
                        (id,content_r2_key,content_preview,content_embedding,
                         chunk_source_domain,source_document,source_reference,
                         category_code,authority_level,embedding_outdated)
                    VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,FALSE)
                    ON CONFLICT (id) DO NOTHING
                """, (chunk_id,r2_key,preview,str(embedding),
                      'theology',m['nama'],m['ref'],m['cat'],m['auth']))
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.ai_knowledge_base
                        (id,document_code,chunk_index,content_type,
                         chunk_table_ref,chunk_id,qa_pair_id,
                         domain,bot_access,access_level_min,status,
                         source_reference,chunk_quality_score,
                         question_type_classification,
                         nama_dokumen,penulis,kategori,theology_topic)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (document_code,chunk_index) DO NOTHING
                """, (str(uuid.uuid4()),doc_key,idx,'rag_chunk',
                      'theological_chunks',chunk_id,
                      m['domain'],m['bot'],0,'approved',
                      m['ref'],4,'theological_document',
                      m['nama'],m['penulis'],m['kategori'],m['topic']))
            conn.commit()
            up += 1
        except Exception as e:
            conn.rollback()
            logger.error(f'DB failed {doc_key}[{idx}]: {e}')
            err += 1

        if (up+err) % 50 == 0 and (up+err) > 0:
            logger.info(f'  {doc_key}: {up} up, {skip} skip, {err} err')

    logger.info(f'DONE {doc_key}: {up} up, {skip} skip, {err} err')
    return up, err

BATCH_FILES = {
    'batch1': [
        'Summa_Theologica_2', 'Homili_St._Yohanes_Krisostomus_4', 'Summa_Contra_Gentiles',
    ],
    'batch2': [
        'Summa_Theologica _4', 'Summa_Theologica _1', 'Kitab_Hukum_Kanonik',
    ],
    'batch3': [
        'Homili_St._Yohanes_Krisostomus_3', 'Homili_St._Yohanes_Krisostomus_2',
        'Evangelii_Gaudium_cleaned', 'Gaudium_et_Spes',
    ],
    'batch4': [
        'Homili_St._Yohanes_Krisostomus_1', 'Summa_Theologica_3',
        'Super Boethium De Trinitate', 'Veritatis_Splendor',
    ],
}
async def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    SIZE_LIMIT   = 200 * 1024    # 200KB  - batas small / medium
    MEDIUM_LIMIT = 3500 * 1024   # 3500KB - batas medium / verylarge

    all_files = sorted(CLEANED_DIR.glob('*.*'))

    if mode == 'small':
        files = [f for f in all_files if f.stat().st_size < SIZE_LIMIT]
    elif mode == 'medium':
        files = [f for f in all_files if SIZE_LIMIT <= f.stat().st_size < MEDIUM_LIMIT]
    elif mode == 'verylarge':
        files = [f for f in all_files if f.stat().st_size >= MEDIUM_LIMIT]
    elif mode == 'large':
        files = [f for f in all_files if f.stat().st_size >= SIZE_LIMIT]
    elif mode in BATCH_FILES:
        files = [f for f in all_files if f.stem in BATCH_FILES[mode]]
    elif mode in [f.stem for f in all_files]:
        files = [f for f in all_files if f.stem == mode]
    else:
        files = all_files

    logger.info(f'Mode: {mode} | Files: {len(files)}')
    for f in files:
        logger.info(f'  {f.name} ({f.stat().st_size//1024}KB)')

    conn = get_db()
    r2   = get_r2()
    total_up = total_err = 0

    for filepath in files:
        try:
            up, err = await process_file(conn, r2, filepath)
            total_up  += up
            total_err += err
        except (KeyboardInterrupt, asyncio.CancelledError):
            logger.error(f'Dihentikan manual (Ctrl+C) saat memproses {filepath.name}')
            conn.rollback()
            raise
        except Exception as e:
            import traceback
            logger.error(f'Fatal error {filepath.name}: {type(e).__name__}: {e!r}')
            logger.error(traceback.format_exc())
            conn.rollback()

    conn.close()
    logger.info(f'FINISHED: {total_up} total uploaded, {total_err} errors')

if __name__ == '__main__':
    asyncio.run(main())
