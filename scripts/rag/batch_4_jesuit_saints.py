#!/usr/bin/env python3
"""
Batch 4: Dokumen Jesuit + Saints
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
JESUIT_DIR = Path(__file__).resolve().parents[2] / 'data' / 'jesuit'
SAINTS_JSON = Path(__file__).resolve().parents[2] / 'data' / 'saints.json'

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

DOC_META = {
    'Apophthegmata Patrum': {
        'nama': 'Apophthegmata Patrum (Kata-Kata Para Bapa Padang Gurun)',
        'penulis': 'Para Bapa Padang Gurun',
        'cat': '7a', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Apophthegmata Patrum (Bapa Padang Gurun)', 'domain': 'theology'
    },
    'Autobiography of St Ignatius': {
        'nama': 'Autobiografi St. Ignatius dari Loyola',
        'penulis': 'St. Ignatius dari Loyola',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Autobiografi St. Ignatius dari Loyola', 'domain': 'theology'
    },
    'Constitutions of the Society of Jesus': {
        'nama': 'Konstitusi Serikat Yesus',
        'penulis': 'St. Ignatius dari Loyola',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Konstitusi Serikat Yesus (St. Ignatius)', 'domain': 'theology'
    },
    'Formula of the Institute 1540 1550': {
        'nama': 'Formula Institut Serikat Yesus 1540-1550',
        'penulis': 'St. Ignatius dari Loyola',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Formula Institut Serikat Yesus', 'domain': 'theology'
    },
    'GC32 Decree 2 Jesuits Today': {
        'nama': 'GC32 Dekret 2 - Yesuit Hari Ini',
        'penulis': 'Kongregasi Jenderal Serikat Yesus ke-32',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'GC32 Dekret 2 - Yesuit Hari Ini', 'domain': 'theology'
    },
    'GC34 Decree 1 United with Christ': {
        'nama': 'GC34 Dekret 1 - Bersatu dengan Kristus',
        'penulis': 'Kongregasi Jenderal Serikat Yesus ke-34',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'GC34 Dekret 1 - Bersatu dengan Kristus', 'domain': 'theology'
    },
    'GC35 Decree 2 Fire that Kindles': {
        'nama': 'GC35 Dekret 2 - Api yang Menyalakan',
        'penulis': 'Kongregasi Jenderal Serikat Yesus ke-35',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'GC35 Dekret 2 - Api yang Menyalakan', 'domain': 'theology'
    },
    'GC36 Decrees': {
        'nama': 'GC36 Dekret-Dekret',
        'penulis': 'Kongregasi Jenderal Serikat Yesus ke-36',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'GC36 Dekret-Dekret Serikat Yesus', 'domain': 'theology'
    },
    'Imitation of Christ Thomas a Kempis': {
        'nama': 'Imitasi Kristus',
        'penulis': 'Thomas a Kempis',
        'cat': '7a', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Imitasi Kristus (Thomas a Kempis)', 'domain': 'theology'
    },
    'Selected Letters of St Ignatius': {
        'nama': 'Surat-Surat Pilihan St. Ignatius dari Loyola',
        'penulis': 'St. Ignatius dari Loyola',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Surat-Surat Pilihan St. Ignatius', 'domain': 'theology'
    },
    'Spiritual Diary of St Ignatius': {
        'nama': 'Buku Harian Rohani St. Ignatius',
        'penulis': 'St. Ignatius dari Loyola',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Buku Harian Rohani St. Ignatius dari Loyola', 'domain': 'theology'
    },
    'Spiritual Exercises Ignatius Loyola (Mullan trans)': {
        'nama': 'Latihan Rohani St. Ignatius dari Loyola',
        'penulis': 'St. Ignatius dari Loyola',
        'cat': '7b', 'auth': 'reference',
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Latihan Rohani St. Ignatius dari Loyola', 'domain': 'theology'
    },
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
                    if boundary > start:
                        end = boundary + 1
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

async def process_jesuit_file(conn, r2, filepath: Path):
    doc_key = filepath.stem
    m = DOC_META.get(doc_key)
    if not m:
        logger.warning(f'Skipping {doc_key}: no metadata'); return 0, 0
    logger.info(f'Reading {filepath.name} ({filepath.stat().st_size // 1024}KB)...')
    text = filepath.read_text(encoding='utf-8', errors='replace')
    from rag._shared import embed_text
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
                """, (chunk_id,r2_key,preview,str(embedding),'theology',m['nama'],m['ref'],m['cat'],m['auth']))
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                """, (str(uuid.uuid4()),doc_key,idx,'rag_chunk','theological_chunks',chunk_id,m['domain'],m['bot'],0,'approved',m['ref'],4,'theological_document',m['nama'],m['penulis'],'ignatian_spirituality',['ignatian','spirituality']))
            conn.commit()
            up += 1
        except Exception as e:
            conn.rollback(); logger.error(f'DB fail {doc_key}[{idx}]: {e}'); err += 1
        if (up+err) % 50 == 0: logger.info(f'  {doc_key}: {up} up, {skip} skip, {err} err')
    logger.info(f'DONE {doc_key}: {up} up, {skip} skip, {err} err')
    return up, err

async def process_saints(conn, r2):
    logger.info('Reading saints.json...')
    with open(SAINTS_JSON, encoding='utf-8') as f:
        saints = json.load(f)
    logger.info(f'Saints: {len(saints)} entries')
    from rag._shared import embed_text
    up = skip = err = 0
    for idx, saint in enumerate(saints):
        sid = saint.get('id', str(idx))
        doc_key = f'saint_{sid}'
        biography = saint.get('biography', '')
        if not biography.strip():
            skip += 1; continue
        if already_uploaded(conn, doc_key, 0):
            skip += 1; continue
        chunk_id = str(uuid.uuid4())
        r2_key = f'chunks/theological/{chunk_id}.txt'
        preview = biography[:PREVIEW_LEN].rstrip() + '...' if len(biography) > PREVIEW_LEN else biography
        try:
            embedding = await embed_text(biography)
        except Exception as e:
            logger.error(f'Embed fail saint {sid}: {e}'); err += 1; continue
        try:
            r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=biography.encode('utf-8'), ContentType='text/plain; charset=utf-8')
        except Exception as e:
            logger.error(f'R2 fail saint {sid}: {e}'); err += 1; continue
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.theological_chunks (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_document,source_reference,category_code,authority_level,embedding_outdated)
                    VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,FALSE) ON CONFLICT (id) DO NOTHING
                """, (chunk_id,r2_key,preview,str(embedding),'theology',saint.get('saint_name','Unknown'),saint.get('saint_name','Unknown'),'7a','reference'))
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                """, (str(uuid.uuid4()),doc_key,0,'rag_chunk','theological_chunks',chunk_id,'catechism_module',['bot_3','bot_8','bot_pastor'],0,'approved',saint.get('saint_name','Unknown'),4,'theological_document',saint.get('saint_name','Unknown'),'Unknown','hagiografi',['hagiografi']))
            conn.commit()
            up += 1
        except Exception as e:
            conn.rollback(); logger.error(f'DB fail saint {sid}: {e}'); err += 1
        if (up+err) % 50 == 0: logger.info(f'Saints: {up} up, {skip} skip, {err} err')
    logger.info(f'SAINTS DONE: {up} up, {skip} skip, {err} err')
    return up, err

async def main():
    files = sorted(JESUIT_DIR.glob('*.*'))
    logger.info(f'Batch 4 - Jesuit + Saints: {len(files)} jesuit files + 1 saints.json')
    conn = get_cockroach_db_connection()
    r2 = get_r2_client()
    total_up = total_err = 0
    for filepath in files:
        try:
            up, err = await process_jesuit_file(conn, r2, filepath)
            total_up += up; total_err += err
        except (KeyboardInterrupt, asyncio.CancelledError):
            logger.error(f'Interrupted at {filepath.name}'); conn.rollback(); raise
        except Exception as e:
            import traceback; logger.error(f'Fatal {filepath.name}: {type(e).__name__}: {e!r}')
            logger.error(traceback.format_exc()); conn.rollback()
    # Saints
    try:
        up, err = await process_saints(conn, r2)
        total_up += up; total_err += err
    except Exception as e:
        logger.error(f'Saints fatal: {e}')
    conn.close()
    logger.info(f'FINISHED: {total_up} uploaded, {total_err} errors')

if __name__ == '__main__':
    asyncio.run(main())