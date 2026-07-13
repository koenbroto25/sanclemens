#!/usr/bin/env python3
"""
Retry script: All documents EXCEPT modul and prayers.
This covers:
  - ALKITAB, Kitab Hukum Kanonik, Adversus Haereses, Summa Contra Gentiles, Super Boethium, Tome of Leo, Homili 1, Dei Verbum
  - 4 Summa Theologica, De Civitate Dei, De Trinitate, Homili 2
  - Sacrosanctum, Gaudium, Unitatis, Nostra, Catechism, Compendium, various papal encyclicals, Homili 3-4
  - 12 Jesuit documents
  - All saints from saints.json

Uses checkpoint to skip completed chunks and retry failed ones.
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
JESUIT_DIR = Path(__file__).resolve().parents[2] / 'data' / 'jesuit'
SAINTS_JSON = Path(__file__).resolve().parents[2] / 'data' / 'saints.json'

# Checkpoint
CHECKPOINT_FILE = Path(__file__).with_suffix('.checkpoint.json')
checkpoint_state = set()
if CHECKPOINT_FILE.exists():
    try:
        checkpoint_state = set(tuple(item) for item in json.loads(CHECKPOINT_FILE.read_text()))
        logger.info(f'Checkpoint loaded: {len(checkpoint_state)} chunks already done')
    except Exception:
        checkpoint_state = set()

def save_checkpoint(doc_key, chunk_idx):
    checkpoint_state.add((doc_key, chunk_idx))
    CHECKPOINT_FILE.write_text(json.dumps(list(checkpoint_state)))

# === DOCUMENT METADATA ===
# Batch 1: Large cleaned docs
DOC_META_BATCH1 = {
    'ALKITAB_Kitab_Suci_Katolik': {'nama':'Alkitab (Kitab Suci Katolik)','penulis':'Para Penulis Kitab Suci','cat':'1','auth':'highest','kategori':'kitab_suci','topic':['kitab_suci','wahyu_ilahi'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Alkitab (Kitab Suci Katolik)','domain':'theology'},
    'Dei_Verbum': {'nama':'Dei Verbum','penulis':'Konsili Vatikan II','cat':'3','auth':'highest','kategori':'konsili_ekumenis','topic':['konsili_vatikan_ii','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Dei Verbum (Konsili Vatikan II)','domain':'theology'},
    'Kitab_Hukum_Kanonik': {'nama':'Kitab Hukum Kanonik (Codex Iuris Canonici)','penulis':'Gereja Katolik','cat':'2','auth':'medium','kategori':'hukum_kanonik','topic':['hukum_kanonik','codex_iuris_canonici'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Kitab Hukum Kanonik','domain':'theology'},
    'Adversus_Haereses': {'nama':'Adversus Haereses (Melawan Ajaran-Ajaran Sesat)','penulis':'St. Ireneus dari Lyon','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Adversus Haereses (St. Ireneus)','domain':'theology'},
    'Summa_Contra_Gentiles': {'nama':'Summa Contra Gentiles','penulis':'St. Thomas Aquinas','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Summa Contra Gentiles (St. Thomas Aquinas)','domain':'theology'},
    'Super Boethium De Trinitate': {'nama':'Super Boethium De Trinitate','penulis':'St. Thomas Aquinas','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Super Boethium De Trinitate (St. Thomas Aquinas)','domain':'theology'},
    'Tome of Leo (St. Leo Agung)': {'nama':'Tome of Leo (Tomus Leonis)','penulis':'St. Leo Agung','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Tome of Leo (St. Leo Agung)','domain':'theology'},
    'Homili_St._Yohanes_Krisostomus_1': {'nama':'Homili St. Yohanes Krisostomus (Bagian 1)','penulis':'St. Yohanes Krisostomus','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Homili St. Yohanes Krisostomus (Bagian 1)','domain':'theology'},
    'Compendium_of_the_Catechism': {'nama':'Kompendium Katekismus Gereja Katolik','penulis':'Gereja Katolik','cat':'6','auth':'highest','kategori':'katekismus','topic':['katekismus','kgk'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Kompendium Katekismus Gereja Katolik','domain':'theology'},
    # Batch 2: Summae + De Civitate + Homili 2
    'Summa_Theologica _1': {'nama':'Summa Theologica (Bagian 1)','penulis':'St. Thomas Aquinas','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Summa Theologica (Bagian 1, St. Thomas Aquinas)','domain':'theology'},
    'Summa_Theologica_2': {'nama':'Summa Theologica (Bagian 2)','penulis':'St. Thomas Aquinas','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Summa Theologica (Bagian 2, St. Thomas Aquinas)','domain':'theology'},
    'Summa_Theologica_3': {'nama':'Summa Theologica (Bagian 3)','penulis':'St. Thomas Aquinas','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Summa Theologica (Bagian 3, St. Thomas Aquinas)','domain':'theology'},
    'Summa_Theologica _4': {'nama':'Summa Theologica (Bagian 4)','penulis':'St. Thomas Aquinas','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Summa Theologica (Bagian 4, St. Thomas Aquinas)','domain':'theology'},
    'De_Civitate_Dei': {'nama':'De Civitate Dei (Kota Allah)','penulis':'St. Agustinus dari Hippo','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'De Civitate Dei (St. Agustinus)','domain':'theology'},
    'De Trinitate (St. Agustinus)': {'nama':'De Trinitate','penulis':'St. Agustinus dari Hippo','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'De Trinitate (St. Agustinus)','domain':'theology'},
    'Homili_St._Yohanes_Krisostomus_2': {'nama':'Homili St. Yohanes Krisostomus (Bagian 2)','penulis':'St. Yohanes Krisostomus','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Homili St. Yohanes Krisostomus (Bagian 2)','domain':'theology'},
    # Batch 3: Church docs + KGK + Homili 3-4
    'Sacrosanctum_Concilium': {'nama':'Sacrosanctum Concilium','penulis':'Konsili Vatikan II','cat':'3','auth':'highest','kategori':'konsili_ekumenis','topic':['konsili_vatikan_ii','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Sacrosanctum Concilium (Konsili Vatikan II)','domain':'theology'},
    'Gaudium_et_Spes': {'nama':'Gaudium et Spes','penulis':'Konsili Vatikan II','cat':'3','auth':'highest','kategori':'konsili_ekumenis','topic':['konsili_vatikan_ii','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Gaudium et Spes (Konsili Vatikan II)','domain':'theology'},
    'nostra_aetate': {'nama':'Nostra Aetate','penulis':'Konsili Vatikan II','cat':'3','auth':'highest','kategori':'konsili_ekumenis','topic':['konsili_vatikan_ii','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Nostra Aetate (Konsili Vatikan II)','domain':'theology'},
    'Unitatis_Redintegratio': {'nama':'Unitatis Redintegratio','penulis':'Konsili Vatikan II','cat':'3','auth':'highest','kategori':'konsili_ekumenis','topic':['konsili_vatikan_ii','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Unitatis Redintegratio (Konsili Vatikan II)','domain':'theology'},
    'Catechism_of_the_Catholic_Church': {'nama':'Katekismus Gereja Katolik','penulis':'Gereja Katolik','cat':'6','auth':'highest','kategori':'katekismus','topic':['katekismus','kgk'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Katekismus Gereja Katolik','domain':'theology'},
    'Deus_Caritas_Est': {'nama':'Deus Caritas Est','penulis':'Paus Benediktus XVI','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Deus Caritas Est (Paus Benediktus XVI)','domain':'theology'},
    'Ecclesia_de_Eucharistia': {'nama':'Ecclesia de Eucharistia','penulis':'Paus Yohanes Paulus II','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Ecclesia de Eucharistia (Paus Yohanes Paulus II)','domain':'theology'},
    'Evangelii_Gaudium_cleaned': {'nama':'Evangelii Gaudium','penulis':'Paus Fransiskus','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Evangelii Gaudium (Paus Fransiskus)','domain':'theology'},
    'Fides_et_Ratio': {'nama':'Fides et Ratio','penulis':'Paus Yohanes Paulus II','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Fides et Ratio (Paus Yohanes Paulus II)','domain':'theology'},
    'Humani_Generis': {'nama':'Humani Generis','penulis':'Paus Pius XII','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Humani Generis (Paus Pius XII)','domain':'theology'},
    'lumen_fidei': {'nama':'Lumen Fidei','penulis':'Paus Fransiskus','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Lumen Fidei (Paus Fransiskus)','domain':'theology'},
    'Mulieris_Dignitatem': {'nama':'Mulieris Dignitatem','penulis':'Paus Yohanes Paulus II','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Mulieris Dignitatem (Paus Yohanes Paulus II)','domain':'theology'},
    'Mysterium_Fidei': {'nama':'Mysterium Fidei','penulis':'Paus Paulus VI','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Mysterium Fidei (Paus Paulus VI)','domain':'theology'},
    'Redemptoris_Mater': {'nama':'Redemptoris Mater','penulis':'Paus Yohanes Paulus II','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Redemptoris Mater (Paus Yohanes Paulus II)','domain':'theology'},
    'spe_salvi': {'nama':'Spe Salvi','penulis':'Paus Benediktus XVI','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Spe Salvi (Paus Benediktus XVI)','domain':'theology'},
    'Veritatis_Splendor': {'nama':'Veritatis Splendor','penulis':'Paus Yohanes Paulus II','cat':'4','auth':'high','kategori':'dokumen_kepausan','topic':['ensiklik_kepausan','magisterium'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Veritatis Splendor (Paus Yohanes Paulus II)','domain':'theology'},
    'Homili_St._Yohanes_Krisostomus_3': {'nama':'Homili St. Yohanes Krisostomus (Bagian 3)','penulis':'St. Yohanes Krisostomus','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Homili St. Yohanes Krisostomus (Bagian 3)','domain':'theology'},
    'Homili_St._Yohanes_Krisostomus_4': {'nama':'Homili St. Yohanes Krisostomus (Bagian 4)','penulis':'St. Yohanes Krisostomus','cat':'7a','auth':'reference','kategori':'patristik_skolastik','topic':['patristik','skolastik'],'bot':['bot_3','bot_8','bot_pastor'],'ref':'Homili St. Yohanes Krisostomus (Bagian 4)','domain':'theology'},
}

DOC_META_JESUIT = {
    'Apophthegmata Patrum': {'nama':'Apophthegmata Patrum (Kata-Kata Para Bapa Padang Gurun)','penulis':'Para Bapa Padang Gurun','cat':'7a','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Apophthegmata Patrum (Bapa Padang Gurun)','domain':'theology'},
    'Autobiography of St Ignatius': {'nama':'Autobiografi St. Ignatius dari Loyola','penulis':'St. Ignatius dari Loyola','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Autobiografi St. Ignatius dari Loyola','domain':'theology'},
    'Constitutions of the Society of Jesus': {'nama':'Konstitusi Serikat Yesus','penulis':'St. Ignatius dari Loyola','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Konstitusi Serikat Yesus (St. Ignatius)','domain':'theology'},
    'Formula of the Institute 1540 1550': {'nama':'Formula Institut Serikat Yesus 1540-1550','penulis':'St. Ignatius dari Loyola','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Formula Institut Serikat Yesus','domain':'theology'},
    'GC32 Decree 2 Jesuits Today': {'nama':'GC32 Dekret 2 - Yesuit Hari Ini','penulis':'Kongregasi Jenderal Serikat Yesus ke-32','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'GC32 Dekret 2 - Yesuit Hari Ini','domain':'theology'},
    'GC34 Decree 1 United with Christ': {'nama':'GC34 Dekret 1 - Bersatu dengan Kristus','penulis':'Kongregasi Jenderal Serikat Yesus ke-34','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'GC34 Dekret 1 - Bersatu dengan Kristus','domain':'theology'},
    'GC35 Decree 2 Fire that Kindles': {'nama':'GC35 Dekret 2 - Api yang Menyalakan','penulis':'Kongregasi Jenderal Serikat Yesus ke-35','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'GC35 Dekret 2 - Api yang Menyalakan','domain':'theology'},
    'GC36 Decrees': {'nama':'GC36 Dekret-Dekret','penulis':'Kongregasi Jenderal Serikat Yesus ke-36','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'GC36 Dekret-Dekret Serikat Yesus','domain':'theology'},
    'Imitation of Christ Thomas a Kempis': {'nama':'Imitasi Kristus','penulis':'Thomas a Kempis','cat':'7a','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Imitasi Kristus (Thomas a Kempis)','domain':'theology'},
    'Selected Letters of St Ignatius': {'nama':'Surat-Surat Pilihan St. Ignatius dari Loyola','penulis':'St. Ignatius dari Loyola','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Surat-Surat Pilihan St. Ignatius','domain':'theology'},
    'Spiritual Diary of St Ignatius': {'nama':'Buku Harian Rohani St. Ignatius','penulis':'St. Ignatius dari Loyola','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Buku Harian Rohani St. Ignatius dari Loyola','domain':'theology'},
    'Spiritual Exercises Ignatius Loyola (Mullan trans)': {'nama':'Latihan Rohani St. Ignatius dari Loyola','penulis':'St. Ignatius dari Loyola','cat':'7b','auth':'reference','bot':['bot_3','bot_8','bot_pastor'],'ref':'Latihan Rohani St. Ignatius dari Loyola','domain':'theology'},
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
        cur.execute("SELECT 1 FROM public.ai_knowledge_base WHERE document_code=%s AND chunk_index=%s", (doc_key, idx))
        return cur.fetchone() is not None

async def process_cleaned_file(conn, r2, fp):
    doc_key = fp.stem
    # Look in both batch1 and batch3 metadata (some docs moved to batch6 but still in cleaned/)
    m = DOC_META_BATCH1.get(doc_key)
    if not m:
        logger.warning(f'Skipping {doc_key}: no metadata')
        return 0, 0

    logger.info(f'Reading {fp.name} ({fp.stat().st_size // 1024}KB)...')
    text = fp.read_text(encoding='utf-8', errors='replace')
    from rag._shared import embed_text
    chunks = chunk_text(text)
    logger.info(f'{doc_key}: {len(chunks)} chunks')

    up = skip = err = 0
    for idx, chunk in enumerate(chunks):
        if already_uploaded(conn, doc_key, idx):
            skip += 1
            continue

        chunk_id = str(uuid.uuid4())
        r2_key = f'chunks/theological/{chunk_id}.txt'
        preview = chunk[:PREVIEW_LEN].rstrip() + '...' if len(chunk) > PREVIEW_LEN else chunk

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
                """, (chunk_id, r2_key, preview, str(embedding),
                      'theology', m['nama'], m['ref'], m['cat'], m['auth']))
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
                """, (str(uuid.uuid4()), doc_key, idx, 'rag_chunk',
                      'theological_chunks', chunk_id,
                      m['domain'], m['bot'], 0, 'approved',
                      m['ref'], 4, 'theological_document',
                      m['nama'], m['penulis'], m['kategori'], m['topic']))
            conn.commit()
            save_checkpoint(doc_key, idx)
            up += 1
        except Exception as e:
            conn.rollback()
            logger.error(f'DB failed {doc_key}[{idx}]: {e}')
            err += 1

        if (up + err) % 50 == 0 and (up + err) > 0:
            logger.info(f'  {doc_key}: {up} up, {skip} skip, {err} err')

    logger.info(f'DONE {doc_key}: {up} up, {skip} skip, {err} err')
    return up, err

async def process_jesuit_file(conn, r2, fp):
    doc_key = fp.stem
    m = DOC_META_JESUIT.get(doc_key)
    if not m:
        return 0, 0
    logger.info(f'Reading {fp.name} ({fp.stat().st_size // 1024}KB)...')
    text = fp.read_text(encoding='utf-8', errors='replace')
    from rag._shared import embed_text
    chunks = chunk_text(text)
    logger.info(f'{doc_key}: {len(chunks)} chunks')
    up = skip = err = 0
    for idx, chunk in enumerate(chunks):
        if already_uploaded(conn, doc_key, idx):
            skip += 1
            continue
        chunk_id = str(uuid.uuid4())
        r2_key = f'chunks/theological/{chunk_id}.txt'
        preview = chunk[:PREVIEW_LEN].rstrip() + '...' if len(chunk) > PREVIEW_LEN else chunk
        try:
            embedding = await embed_text(chunk)
        except Exception as e:
            logger.error(f'Embed fail {doc_key}[{idx}]: {e}')
            err += 1
            continue
        try:
            r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=chunk.encode('utf-8'), ContentType='text/plain; charset=utf-8')
        except Exception as e:
            logger.error(f'R2 fail {doc_key}[{idx}]: {e}')
            err += 1
            continue
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.theological_chunks (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_document,source_reference,category_code,authority_level,embedding_outdated)
                    VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,FALSE) ON CONFLICT (id) DO NOTHING
                """, (chunk_id, r2_key, preview, str(embedding), 'theology', m['nama'], m['ref'], '7b' if 'Jesuit' in doc_key or 'Ignatius' in doc_key or 'GC' in doc_key or 'Exercises' in doc_key or 'Selected Letters' in doc_key or 'Diary' in doc_key else '7a', 'reference'))
                cur.execute("""
                    INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                """, (str(uuid.uuid4()), doc_key, idx, 'rag_chunk', 'theological_chunks', chunk_id, m.get('domain', 'theology'), m['bot'], 0, 'approved', m['ref'], 4, 'theological_document', m['nama'], m['penulis'], 'ignatian_spirituality', ['ignatian', 'spirituality']))
            conn.commit()
            save_checkpoint(doc_key, idx)
            up += 1
        except Exception as e:
            conn.rollback()
            logger.error(f'DB fail {doc_key}[{idx}]: {e}')
            err += 1
        if (up + err) % 50 == 0:
            logger.info(f'  {doc_key}: {up} up, {skip} skip, {err} err')
    logger.info(f'DONE {doc_key}: {up} up, {skip} skip, {err} err')
    return up, err

async def process_saints(conn, r2):
    import json as json_mod
    with open(SAINTS_JSON, encoding='utf-8') as f:
        saints = json_mod.load(f)
    logger.info(f'Saints: {len(saints)} entries')
    from rag._shared import embed_text
    up = skip = err = 0
    for idx, saint in enumerate(saints):
        sid = saint.get('id', str(idx))
        doc_key = f'saint_{sid}'
        biography = saint.get('biography', '')
        if not biography.strip():
            skip += 1
            continue
        if already_uploaded(conn, doc_key, 0):
            skip += 1
            continue
        chunk_id = str(uuid.uuid4())
        r2_key = f'chunks/theological/{chunk_id}.txt'
        preview = biography[:PREVIEW_LEN].rstrip() + '...' if len(biography) > PREVIEW_LEN else biography
        try:
            embedding = await embed_text(biography)
        except Exception as e:
            logger.error(f'Embed fail saint {sid}: {e}')
            err += 1
            continue
        try:
            r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=biography.encode('utf-8'), ContentType='text/plain; charset=utf-8')
        except Exception as e:
            logger.error(f'R2 fail saint {sid}: {e}')
            err += 1
            continue
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.theological_chunks (id,content_r2_key,content_preview,content_embedding,chunk_source_domain,source_document,source_reference,category_code,authority_level,embedding_outdated)
                    VALUES (%s,%s,%s,%s::vector,%s,%s,%s,%s,%s,FALSE) ON CONFLICT (id) DO NOTHING
                """, (chunk_id, r2_key, preview, str(embedding), 'theology', saint.get('saint_name', 'Unknown'), saint.get('saint_name', 'Unknown'), '7a', 'reference'))
                cur.execute("""
                    INSERT INTO public.ai_knowledge_base (id,document_code,chunk_index,content_type,chunk_table_ref,chunk_id,qa_pair_id,domain,bot_access,access_level_min,status,source_reference,chunk_quality_score,question_type_classification,nama_dokumen,penulis,kategori,theology_topic)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (document_code,chunk_index) DO NOTHING
                """, (str(uuid.uuid4()), doc_key, 0, 'rag_chunk', 'theological_chunks', chunk_id, 'catechism_module', ['bot_3', 'bot_8', 'bot_pastor'], 0, 'approved', saint.get('saint_name', 'Unknown'), 4, 'theological_document', saint.get('saint_name', 'Unknown'), 'Unknown', 'hagiografi', ['hagiografi']))
            conn.commit()
            save_checkpoint(doc_key, 0)
            up += 1
        except Exception as e:
            conn.rollback()
            logger.error(f'DB fail saint {sid}: {e}')
            err += 1
        if (up + err) % 50 == 0:
            logger.info(f'Saints: {up} up, {skip} skip, {err} err')
    logger.info(f'SAINTS DONE: {up} up, {skip} skip, {err} err')
    return up, err

async def main():
    # Collect all cleaned files that have metadata (exclude Catechism_of_the_Catholic_Church because it's KGK which needs special handling — wait no, it's in batch 1 list)
    all_cleaned = sorted([f for f in CLEANED_DIR.glob('*.*') if f.stem in DOC_META_BATCH1])
    all_jesuit = sorted([f for f in JESUIT_DIR.glob('*.*') if f.stem in DOC_META_JESUIT])

    logger.info(f'Retry script: {len(all_cleaned)} cleaned docs + {len(all_jesuit)} jesuit docs + saints.json')
    for f in all_cleaned:
        logger.info(f'  cleaned: {f.name} ({f.stat().st_size // 1024}KB)')
    for f in all_jesuit:
        logger.info(f'  jesuit: {f.name} ({f.stat().st_size // 1024}KB)')

    conn = get_cockroach_db_connection()
    r2 = get_r2_client()
    total_up = total_err = 0

    # Process cleaned
    for fp in all_cleaned:
        try:
            u, e = await process_cleaned_file(conn, r2, fp)
            total_up += u
            total_err += e
        except (KeyboardInterrupt, asyncio.CancelledError):
            logger.error(f'Interrupted at {fp.name}')
            conn.rollback()
            raise
        except Exception as ex:
            import traceback
            logger.error(f'Fatal {fp.name}: {type(ex).__name__}: {ex!r}')
            logger.error(traceback.format_exc())
            conn.rollback()

    # Process jesuit
    for fp in all_jesuit:
        try:
            u, e = await process_jesuit_file(conn, r2, fp)
            total_up += u
            total_err += e
        except (KeyboardInterrupt, asyncio.CancelledError):
            logger.error(f'Interrupted at {fp.name}')
            conn.rollback()
            raise
        except Exception as ex:
            import traceback
            logger.error(f'Fatal {fp.name}: {type(ex).__name__}: {ex!r}')
            logger.error(traceback.format_exc())
            conn.rollback()

    # Process saints
    try:
        u, e = await process_saints(conn, r2)
        total_up += u
        total_err += e
    except Exception as ex:
        logger.error(f'Saints fatal: {ex}')

    conn.close()
    logger.info(f'FINISHED: {total_up} uploaded, {total_err} errors')

if __name__ == '__main__':
    asyncio.run(main())