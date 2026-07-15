"""
approve_corpus_teologi.py — RAG v6.5 (CockroachDB)
Memindahkan status chunk corpus teologi dari 'needs_review' ke 'approved'
setelah ditinjau oleh Ahli Teologi/pastor.

Wajib dijalankan sebelum chunk bisa dipakai oleh search_rag_chunks()
(fungsi memfilter status = 'approved').
"""

import os, sys
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"D:\paroki_digital_stclemens\.env.local")

# ========== KONEKSI COCKROACHDB ==========
def get_db_cockroach():
    return psycopg2.connect(
        host=os.environ.get('COCKROACHDB_HOST'),
        port=os.environ.get('COCKROACHDB_PORT', 26257),
        dbname=os.environ.get('COCKROACHDB_DBNAME', 'defaultdb'),
        user=os.environ.get('COCKROACHDB_USER'),
        password=os.environ.get('COCKROACHDB_PASSWORD', ''),
        sslmode='verify-full'
    )

db_conn = get_db_cockroach()

# ========== FUNGSI UTAMA ==========
def daftar_menunggu_review(document_code_prefix=None):
    """
    Tampilkan chunk yang masih menunggu review.
    Join ke theological_chunks untuk dapatkan content_preview.
    """
    cur = db_conn.cursor()
    sql = """
        SELECT akb.id, akb.document_code, akb.nama_dokumen, akb.theology_topic,
               akb.chunk_id, tc.content_preview, akb.approved_by, akb.approved_at
        FROM ai_knowledge_base akb
        JOIN theological_chunks tc ON tc.id = akb.chunk_id
        WHERE akb.domain = 'theology' AND akb.status = 'needs_review'
    """
    params = []
    if document_code_prefix:
        sql += " AND akb.document_code LIKE %s"
        params.append(f"{document_code_prefix}%")
    
    sql += " ORDER BY akb.document_code, akb.chunk_index"
    
    cur.execute(sql, params)
    cols = [c.name for c in cur.description]
    hasil = [dict(zip(cols, row)) for row in cur.fetchall()]
    cur.close()
    return hasil

def setujui(document_code_prefix, disetujui_oleh):
    """
    Setujui seluruh chunk 'needs_review' milik satu dokumen.
    
    Args:
        document_code_prefix: Prefix document_code (mis. 'CCC', 'IGN_SPX')
        disetujui_oleh: UUID dari reviewer (Ahli Teologi/pastor)
    """
    baris = daftar_menunggu_review(document_code_prefix)
    if not baris:
        print(f"Tidak ada chunk 'needs_review' untuk prefix '{document_code_prefix}'.")
        return
    
    ids = [b["id"] for b in baris]
    cur = db_conn.cursor()
    cur.execute("""
        UPDATE ai_knowledge_base
        SET status = 'approved', approved_by = %s, approved_at = now()
        WHERE id = ANY(%s)
    """, (disetujui_oleh, ids))
    db_conn.commit()
    cur.close()
    
    print(f"[OK] Disetujui: {len(ids)} chunk untuk prefix '{document_code_prefix}' oleh {disetujui_oleh}")

def tolak(document_code_prefix, disetujui_oleh, alasan=None):
    """
    Tolak seluruh chunk untuk satu dokumen (opsional).
    Masih disimpan di database untuk audit, tapi tidak akan muncul di search_rag_chunks().
    """
    baris = daftar_menunggu_review(document_code_prefix)
    if not baris:
        print(f"Tidak ada chunk 'needs_review' untuk prefix '{document_code_prefix}'.")
        return
    
    ids = [b["id"] for b in baris]
    cur = db_conn.cursor()
    cur.execute("""
        UPDATE ai_knowledge_base
        SET status = 'rejected', approved_by = %s, approved_at = now(), catatan_review = %s
        WHERE id = ANY(%s)
    """, (disetujui_oleh, alasan, ids))
    db_conn.commit()
    cur.close()
    
    print(f"âŒ Ditolak: {len(ids)} chunk untuk prefix '{document_code_prefix}' oleh {disetujui_oleh}")

def statistik():
    """Tampilkan statistik approval"""
    cur = db_conn.cursor()
    cur.execute("""
        SELECT status, COUNT(*) 
        FROM ai_knowledge_base 
        WHERE domain = 'theology'
        GROUP BY status
    """)
    hasil = cur.fetchall()
    cur.close()
    
    print("\n[STATS] STATISTIK CORPUS TEOLOGIS:")
    print("-" * 40)
    for status, count in hasil:
        label = {
            'needs_review': 'â³ Menunggu Review',
            'approved': '[OK] Disetujui',
            'rejected': 'âŒ Ditolak'
        }.get(status, status)
        print(f"  {label}: {count} chunks")
    print("-" * 40)

# ========== CLI INTERFACE ==========
def print_usage():
    print("""
Penggunaan:
  python approve_corpus_teologi.py --list [prefix]
      Tampilkan chunk yang menunggu review (opsional filter per prefix)
  
  python approve_corpus_teologi.py --approve <prefix> <uuid_reviewer>
      Setujui seluruh chunk untuk satu dokumen
  
  python approve_corpus_teologi.py --reject <prefix> <uuid_reviewer> ["alasan"]
      Tolak seluruh chunk untuk satu dokumen (opsional)
  
  python approve_corpus_teologi.py --stats
      Tampilkan statistik approval corpus

Contoh:
  python approve_corpus_teologi.py --list CCC
  python approve_corpus_teologi.py --approve CCC 123e4567-e89b-12d3-a456-426614174000
  python approve_corpus_teologi.py --reject IGN_SPX 123e4567-e89b-12d3-a456-426614174000 "Perlu revisi"
  python approve_corpus_teologi.py --stats
""")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "--list":
        prefix = sys.argv[2] if len(sys.argv) > 2 else None
        chunks = daftar_menunggu_review(prefix)
        if not chunks:
            print("Tidak ada chunk yang menunggu review.")
        else:
            print(f"\n[LIST] DAFTAR CHUNK MENUNGGU REVIEW ({len(chunks)} total):")
            print("=" * 80)
            for b in chunks:
                print(f"  {b['document_code']} — {b['nama_dokumen']}")
                print(f"    Topik: {', '.join(b['theology_topic'])}")
                print(f"    Preview: {b.get('content_preview', '')[:100]}...")
                print()
    
    elif command == "--approve":
        if len(sys.argv) < 4:
            print("Error: Mohon berikan prefix dan UUID reviewer")
            print_usage()
            sys.exit(1)
        prefix = sys.argv[2]
        reviewer_uuid = sys.argv[3]
        setujui(prefix, reviewer_uuid)
    
    elif command == "--reject":
        if len(sys.argv) < 4:
            print("Error: Mohon berikan prefix dan UUID reviewer")
            print_usage()
            sys.exit(1)
        prefix = sys.argv[2]
        reviewer_uuid = sys.argv[3]
        alasan = sys.argv[4] if len(sys.argv) > 4 else None
        tolak(prefix, reviewer_uuid, alasan)
    
    elif command == "--stats":
        statistik()
    
    else:
        print(f"Command tidak dikenal: {command}")
        print_usage()
        sys.exit(1)
