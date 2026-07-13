#!/usr/bin/env python3
"""
Batch 2: 4 Summa Theologica (1-4) + De Civitate Dei + De Trinitate + Homili 2
Target: CockroachDB (CockroachDB Cloud)
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
CLEANED_DIR = Path(__file__).resolve().parents[2] / 'data' / 'cleaned'

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
    'De_Civitate_Dei': {
        'nama': 'De Civitate Dei (Kota Allah)', 'penulis': 'St. Agustinus dari Hippo',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'De Civitate Dei (St. Agustinus)', 'domain': 'theology'
    },
    'De Trinitate (St. Agustinus)': {
        'nama': 'De Trinitate', 'penulis': 'St. Agustinus dari Hippo',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'De Trinitate (St. Agustinus)', 'domain': 'theology'
    },
    'Homili_St._Yohanes_Krisostomus_2': {
        'nama': 'Homili St. Yohanes Krisostomus (Bagian 2)', 'penulis': 'St. Yohanes Krisostomus',
        'cat': '7a', 'auth': 'reference', 'kategori': 'patristik_skolastik',
        'topic': ['patristik', 'skolastik'],
        'bot': ['bot_3', 'bot_8', 'bot_pastor'],
        'ref': 'Homili St. Yohanes Krisostomus (Bagian 2)', 'domain': 'theology'
    },
}

TARGET_FILES = list(DOC_META.keys())

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
    if (doc_key, idx) in checkpoint_state:
        return True
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM public.ai_knowledge_base WHERE document_code=%s AND chunk_index=%s",
            (doc_key, idx))
        return cur.fetchone() is not None

async def process_file(conn, r2, filepath: Path):
    doc_key = filepath.stem
    m = DOC_META.get(doc_key)
    if not m:
        logger.warning(f'Skipping {doc_key}: no metadata')
        return 0, 0

    logger.info(f'Reading {filepath.name} ({filepath.stat().st_size // 1024}KB)...')
    text = filepath.read_text(encoding='utf-8', errors='replace')
    from rag._shared import embed_text
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
            save_checkpoint(doc_key, idx)
            up += 1
        except Exception as e:
            conn.rollback()
            logger.error(f'DB failed {doc_key}[{idx}]: {e}')
            err += 1

        if (up+err) % 50 == 0 and (up+err) > 0:
            logger.info(f'  {doc_key}: {up} up, {skip} skip, {err} err')

    logger.info(f'DONE {doc_key}: {up} up, {skip} skip, {err} err')
    return up, err

async def main():
    all_files = sorted([f for f in CLEANED_DIR.glob('*.*') if f.stem in TARGET_FILES])
    logger.info(f'Batch 2 - Summae + De Civitate + Homili 2: {len(all_files)} files')
    for f in all_files:
        logger.info(f'  {f.name} ({f.stat().st_size//1024}KB)')

    conn = get_cockroach_db_connection()
    r2   = get_r2_client()
    total_up = total_err = 0

    for filepath in all_files:
        try:
            up, err = await process_file(conn, r2, filepath)
            total_up += up
            total_err += err
        except (KeyboardInterrupt, asyncio.CancelledError):
            logger.error(f'Dihentikan manual saat {filepath.name}')
            conn.rollback()
            raise
        except Exception as e:
            import traceback
            logger.error(f'Fatal {filepath.name}: {type(e).__name__}: {e!r}')
            logger.error(traceback.format_exc())
            conn.rollback()

    conn.close()
    logger.info(f'FINISHED: {total_up} uploaded, {total_err} errors')

if __name__ == '__main__':
    asyncio.run(main())