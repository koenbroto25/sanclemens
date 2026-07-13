#!/usr/bin/env python3
"""Quick status check for CockroachDB upload progress."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from _shared import get_cockroach_db_connection

conn = get_cockroach_db_connection()
cur = conn.cursor()

# Total chunks
cur.execute("SELECT COUNT(*) FROM theological_chunks")
tc = cur.fetchone()[0]

# Total unique docs
cur.execute("SELECT COUNT(DISTINCT document_code) FROM ai_knowledge_base")
dc = cur.fetchone()[0]

# All docs with their counts
cur.execute("""
    SELECT document_code, COUNT(*) as c 
    FROM ai_knowledge_base 
    GROUP BY document_code 
    ORDER BY c DESC
""")
rows = cur.fetchall()
conn.close()

print(f"Total chunks in theological_chunks: {tc}")
print(f"Total unique documents in ai_knowledge_base: {dc}")
print()
print("All documents and their chunk counts:")
total_uploaded = 0
for r in rows:
    total_uploaded += r[1]
    print(f"  {r[0]}: {r[1]} chunks")

print(f"\nTotal chunks uploaded: {total_uploaded}")