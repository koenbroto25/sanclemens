#!/usr/bin/env python3
"""
Batch 5: Modul Katolisitas (21 file) + Prayers
Target: CockroachDB
Run in separate terminal.
"""
import os, uuid, re, sys, logging, asyncio, json
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from rag._shared import get_cockroach_db_connection, get_r2_client, R2_BUCKET, PREVIEW_LEN

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
MODUL_DIR = Path(__file__).resolve().parents[2] / 'data' / 'catholic source' / 'modul katolisitas' / 'final'
PRAYERS_JSON = Path(__file__).resolve().parents[2] / 'data' / 'prayers.json'

# Checkpoint file untuk resumability
CHECKPOINT_FILE = Path(__file__).with_suffix('.checkpoint.json')
checkpoint_state = set()
if CHECKPOINT_FILE.exists():
    try:
        loaded = json.loads(CHECKPOINT_FILE.read_text())
        checkpoint_state = set(tuple(item) for item in loaded)
        logger.info(f'Checkpoint ditemukan: {len(checkpoint_state)} chunk sudah selesai')
    except Exception:
        checkpoint_state = set()

def save_checkpoint(doc_key: str, chunk_idx: int):
    checkpoint_state.add((doc_key, chunk_idx))
    CHECKPOINT_FILE.write_text(json.dumps(list(checkpoint_state)))

# All 21 modul files - auto-detect from directory
MODUL_TITLES = {
    'modul_0_rev': 'Modul 0: Pengantar Umum',
    'modul_1_1_rev': 'Modul 1.1: Aku Percaya (Credo) - Bagian 1',
    'modul_1_2_rev': 'Modul 1.2: Aku Percaya (Credo) - Bagian 2',
    'modul_1_3_rev': 'Modul 1.3: Aku Percaya (Credo) - Bagian 3',
    'modul_1_4_rev': 'Modul 1.4: Aku Percaya (Credo) - Bagian 4',
    'modul_1_5_rev': 'Modul 1.5: Aku Percaya (Credo) - Bagian 5',
    'modul_2_1a_rev': 'Modul 2.1a: Liturgi & Sakramen - Bagian 1a',
    'modul_2_1b_rev': 'Modul 2.1b: Liturgi & Sakramen - Bagian 1b',
    'modul_2_2_rev': 'Modul 2.2: Liturgi & Sakramen - Bagian 2',
    'modul_2_3_rev': 'Modul 2.3: Liturgi & Sakramen - Bagian 3',
    'modul_2_4_rev': 'Modul 2.4: Liturgi & Sakramen - Bagian 4',
    'modul_2_5_rev': 'Modul 2.5: Liturgi & Sakramen - Bagian 5',
    'modul_2_6_rev': 'Modul 2.6: Liturgi & Sakramen - Bagian 6',
    'modul_3_1_rev': 'Modul 3.1: Moral Kristiani - Bagian 1',
    'modul_3_2a_rev': 'Modul 3.2a: Moral Kristiani - Bagian 2a',
    'modul_3_2b_rev': 'Modul 3.2b: Moral Kristiani - Bagian 2b',
    'modul_3_3_rev': 'Modul 3.3: Moral Kristiani - Bagian 3',
    'modul_3_4a_rev': 'Modul 3.4a: Moral Kristiani - Bagian 4a',
    'modul_3_4b_rev': 'Modul 3.4b: Moral Kristiani - Bagian 4b',
    'modul_3_5_rev': 'Modul 3.5: Moral Kristiani - Bagian 5',
    'modul_3_6_rev': 'Modul 3.6: Moral Kristiani - Bagian 6',
}

def chunk_text(text):
    sections = re.split(r'\n(?=#{1,3} |\n)', text)
    chunks = []
    for section in sections:
        if not section.strip(): continue
        if len(section) <= CHUNK_SIZE:
            chunks.append(section.strip())
        else:
            start = 0
            while start < len(section):
                end = start + CHUNK_SIZE
                if end < len(section):
                    boundary = section.rfind('. ', start, end)
                    if boundary > start: end = boundary + 1
                chunk = section[start:end].strip()
                if chunk: chunks.append(chunk)
                if end >= len(section): break
                next_start = end - CHUNK_OVERLAP
                start = next_start if next_start > start else end
    return [c for c in chunks if len(c.strip()) >= 50]

def already_uploaded(conn, doc_key, idx):
    if (doc_key, idx) in checkpoint_state:
        return True
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM public.ai_knowledge_base WHERE document_code=%s AND chunk_index=%s", (doc_key, idx))
        return cur.fetchone() is not None

async def process_modul(conn, r2):
    from rag._shared import embed_text
    files = sorted(MODUL_DIR.glob('modul_*.md'))
    logger.info(f'Modul files: {len(files)}')
    total_up = total_err = 0
    for filepath in files:
        doc_key = filepath.stem
        title = MODUL_TITLES.get(doc_key, doc_key)
        logger.info(f'Reading {filepath.name} ({filepath.stat().st_size // 1024}KB)...')
        text = filepath.read_text(encoding='utf-8', errors='replace')
        chunks = chunk_text(text)
        logger.info(f'{doc_key}: {len(chunks)} chunks')
        up = skip = err = 0
        for idx, chunk in enumerate(chunks):
            if already_uploaded(conn, doc_key, idx):
                skip += 1; continue
            chunk_id = str(uuid.uuid4())
            r2_key = f'chunks/theological/{chunk_id}.txt'
            preview = chunk[:PREVIEW_LEN].rstrip() + '...' if len(chunk) > PREVIEW_LEN else chunk
            try:
                embedding = await embed_text(chunk)
            except Exception as e:
                logger.error(f'Embed fail {doc_key}[{idx}]: {e}'); err += 1; continue
            try:
                r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=chunk.encode('utf-8'), ContentType='text/plain; charset=utf-8')
            except Exception as e:
                logger.error(f'R2 fail {doc_key}[{idx}]: {e}'); err += 1; continue
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO public.theological_chunks (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_document,source_reference,category_code,authority_level,embedding_outdated)
                        VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,FALSE) ON CONFLICT (id) DO NOTHING
                    """, (chunk_id,r2_key,preview,str(embedding),'theology',title,title,'9','devotional'))
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic)
                        VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                    """, (str(uuid.uuid4()),doc_key,idx,'rag_chunk','theological_chunks',chunk_id,'catechism_module',['bot_3','bot_8','bot_pastor'],0,'approved',title,4,'theological_document',title,'Tim Katekese Paroki','modul_katekese',['katekese','modul']))
                conn.commit()
                save_checkpoint(doc_key, idx)
                up += 1
            except Exception as e:
                conn.rollback(); logger.error(f'DB fail {doc_key}[{idx}]: {e}'); err += 1
            if (up+err) % 50 == 0: logger.info(f'  {doc_key}: {up} up, {skip} skip, {err} err')
        logger.info(f'DONE {doc_key}: {up} up, {skip} skip, {err} err')
        total_up += up; total_err += err
    return total_up, total_err

async def process_prayers(conn, r2):
    from rag._shared import embed_text
    with open(PRAYERS_JSON, encoding='utf-8') as f:
        data = json.load(f)
    prayers_list = data.get('prayers', [])
    logger.info(f'Prayers: {len(prayers_list)} entries')
    up = skip = err = 0
    for idx, prayer in enumerate(prayers_list):
        pname = prayer.get('prayer_name', 'Unknown')
        doc_key = f'prayer_{idx}'
        text = prayer.get('indonesian_text', prayer.get('text', ''))
        if not text.strip(): skip += 1; continue
        if already_uploaded(conn, doc_key, 0): skip += 1; continue
        chunk_id = str(uuid.uuid4())
        r2_key = f'chunks/theological/{chunk_id}.txt'
        preview = text[:PREVIEW_LEN].rstrip() + '...' if len(text) > PREVIEW_LEN else text
        try:
            embedding = await embed_text(text)
        except Exception as e:
            logger.error(f'Embed fail prayer {pname}: {e}'); err += 1; continue
        try:
            r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=text.encode('utf-8'), ContentType='text/plain; charset=utf-8')
        except Exception as e:
            logger.error(f'R2 fail prayer {pname}: {e}'); err += 1; continue
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.theological_chunks (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_document,source_reference,category_code,authority_level,embedding_outdated)
                    VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,FALSE) ON CONFLICT (id) DO NOTHING
                """, (chunk_id,r2_key,preview,str(embedding),'theology',pname,pname,'8','devotional'))
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                """, (str(uuid.uuid4()),doc_key,0,'rag_chunk','theological_chunks',chunk_id,'catechism_module',['bot_3','bot_8','bot_pastor'],0,'approved',pname,4,'theological_document',pname,'Unknown','doa',['doa','devosi']))
            conn.commit()
            save_checkpoint(doc_key, 0)
            up += 1
        except Exception as e:
            conn.rollback(); logger.error(f'DB fail prayer {pname}: {e}'); err += 1
        if (up+err) % 50 == 0: logger.info(f'Prayers: {up} up, {skip} skip, {err} err')
    logger.info(f'PRAYERS DONE: {up} up, {skip} skip, {err} err')
    return up, err

async def main():
    logger.info('Batch 5 - Modul Katolisitas + Prayers')
    conn = get_cockroach_db_connection()
    r2 = get_r2_client()
    total_up = total_err = 0
    try:
        up, err = await process_modul(conn, r2)
        total_up += up; total_err += err
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.error('Interrupted during modul'); conn.rollback(); raise
    except Exception as e:
        import traceback; logger.error(f'Modul fatal: {type(e).__name__}: {e!r}'); logger.error(traceback.format_exc()); conn.rollback()
    try:
        up, err = await process_prayers(conn, r2)
        total_up += up; total_err += err
    except Exception as e:
        logger.error(f'Prayers fatal: {e}')
    conn.close()
    logger.info(f'FINISHED: {total_up} uploaded, {total_err} errors')

if __name__ == '__main__':
    asyncio.run(main())