#!/usr/bin/env python3
"""
Check upload status for unfinished documents.
Shows chunks in checkpoint vs database.
"""
import os, json, sys, asyncio, logging
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from rag._shared import get_cockroach_db_connection

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

CHECKPOINT_DIR = Path(__file__).parent

# Documents to check
DOCS = [
    'ALKITAB_Kitab_Suci_Katolik',
    'Homili_St._Yohanes_Krisostomus_1',
    'Homili_St._Yohanes_Krisostomus_2',
    'Homili_St._Yohanes_Krisostomus_3',
    'Adversus_Haereses',
    'Summa_Theologica_2',
    'Summa_Theologica_1',
]

def load_checkpoint(doc_key):
    cp = CHECKPOINT_DIR / f'single_{doc_key.lower().replace(" ", "_").replace("(", "").replace(")", "").replace(".", "")}.checkpoint.json'
    if not cp.exists():
        return set()
    try:
        return set(tuple(item) for item in json.loads(cp.read_text()))
    except:
        return set()

async def main():
    conn = get_cockroach_db_connection()
    
    print(f"{'Document':<40} {'Checkpoint':>12} {'Database':>12}")
    print("-" * 66)
    
    for doc in DOCS:
        cp_count = len(load_checkpoint(doc))
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM public.ai_knowledge_base WHERE document_code=%s", (doc,))
            db_count = cur.fetchone()[0]
        print(f"{doc:<40} {cp_count:>12} {db_count:>12}")
    
    conn.close()

if __name__ == '__main__':
    asyncio.run(main())