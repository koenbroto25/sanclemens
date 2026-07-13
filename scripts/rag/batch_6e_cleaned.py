#!/usr/bin/env python3
"""
Batch 6e: Homili_4, Kitab_Hukum_Kanonik, Mulieris_Dignitatem
"""
import os,uuid,re,sys,logging,asyncio,json
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(__file__),'..'))
from rag._shared import get_cockroach_db_connection, get_r2_client, R2_BUCKET, PREVIEW_LEN
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)
CHUNK_SIZE = 800; CHUNK_OVERLAP = 100
CLEANED_DIR = Path(__file__).resolve().parents[2] / 'data' / 'cleaned'
CHECKPOINT_FILE = Path(__file__).with_suffix('.checkpoint.json')
checkpoint_state = set()
if CHECKPOINT_FILE.exists():
    try: checkpoint_state = set(tuple(item) for item in json.loads(CHECKPOINT_FILE.read_text()))
    except: pass
def save_checkpoint(d,i): checkpoint_state.add((d,i)); CHECKPOINT_FILE.write_text(json.dumps(list(checkpoint_state)))
DOC_META = {
    'Homili_St._Yohanes_Krisostomus_4': {'nama':'Homili St. Yohanes Krisostomus (Bagian 4)','penulis':'St. Yohanes Krisostomus','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Homili St. Yohanes Krisostomus (Bagian 4)','domain':'theology'},
    'Kitab_Hukum_Kanonik': {'nama':'Kitab Hukum Kanonik (Codex Iuris Canonici)','penulis':'Gereja Katolik','cat':'2','auth':'medium','kategori':'hukum_kanonik','topic':['hukum_kanonik','codex_iuris_canonici'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Kitab Hukum Kanonik','domain':'theology'},
    'Mulieris_Dignitatem': {'nama':'Mulieris Dignitatem','penulis':'Paus Yohanes Paulus II','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Mulieris Dignitatem (Paus Yohanes Paulus II)','domain':'theology'},
}
TARGET_FILES = list(DOC_META.keys())
def chunk_text(text):
    sections = re.split(r'\n(?=#{1,3} |\n)', text); chunks = []
    for section in sections:
        if not section.strip(): continue
        if len(section) <= CHUNK_SIZE: chunks.append(section.strip())
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
def already_uploaded(conn, dk, idx):
    if (dk, idx) in checkpoint_state: return True
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM public.ai_knowledge_base WHERE document_code=%s AND chunk_index=%s", (dk, idx))
        return cur.fetchone() is not None
async def process_file(conn, r2, fp):
    dk = fp.stem; m = DOC_META.get(dk)
    if not m: return 0,0
    logger.info(f'Reading {fp.name} ({fp.stat().st_size//1024}KB)...')
    text = fp.read_text(encoding='utf-8', errors='replace')
    from rag._shared import embed_text
    chunks = chunk_text(text)
    logger.info(f'{dk}: {len(chunks)} chunks')
    up=skip=err=0
    for idx, chunk in enumerate(chunks):
        if already_uploaded(conn, dk, idx): skip+=1; continue
        cid=str(uuid.uuid4()); r2k=f'chunks/theological/{cid}.txt'
        preview=chunk[:PREVIEW_LEN].rstrip()+'...' if len(chunk)>PREVIEW_LEN else chunk
        try: emb=await embed_text(chunk)
        except Exception as e: logger.error(f'Embed fail {dk}[{idx}]: {e}'); err+=1; continue
        try: r2.put_object(Bucket=R2_BUCKET, Key=r2k, Body=chunk.encode('utf-8'), ContentType='text/plain; charset=utf-8')
        except Exception as e: logger.error(f'R2 fail {dk}[{idx}]: {e}'); err+=1; continue
        try:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO public.theological_chunks (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_document,source_reference,category_code,authority_level,embedding_outdated) VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,FALSE) ON CONFLICT (id) DO NOTHING", (cid,r2k,preview,str(emb),'theology',m['nama'],m['ref'],m['cat'],m['auth']))
                cur.execute("INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic) VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING", (str(uuid.uuid4()),dk,idx,'rag_chunk','theological_chunks',cid,m['domain'],m['bot'],0,'approved',m['ref'],4,'theological_document',m['nama'],m['penulis'],m['kategori'],m['topic']))
            conn.commit(); save_checkpoint(dk,idx); up+=1
        except Exception as e: conn.rollback(); logger.error(f'DB fail {dk}[{idx}]: {e}'); err+=1
        if (up+err)%50==0 and (up+err)>0: logger.info(f'  {dk}: {up} up, {skip} skip, {err} err')
    logger.info(f'DONE {dk}: {up} up, {skip} skip, {err} err')
    return up,err
async def main():
    all_files=sorted([f for f in CLEANED_DIR.glob('*.*') if f.stem in TARGET_FILES])
    logger.info(f'Batch 6e: {len(all_files)} files'); [logger.info(f'  {f.name} ({f.stat().st_size//1024}KB)') for f in all_files]
    conn=get_cockroach_db_connection(); r2=get_r2_client(); total_up=total_err=0
    for fp in all_files:
        try: u,e=await process_file(conn,r2,fp); total_up+=u; total_err+=e
        except (KeyboardInterrupt, asyncio.CancelledError): logger.error(f'Interrupted at {fp.name}'); conn.rollback(); raise
        except Exception as ex: import traceback; logger.error(f'Fatal {fp.name}: {type(ex).__name__}: {ex!r}'); logger.error(traceback.format_exc()); conn.rollback()
    conn.close(); logger.info(f'FINISHED: {total_up} uploaded, {total_err} errors')
if __name__=='__main__': asyncio.run(main())