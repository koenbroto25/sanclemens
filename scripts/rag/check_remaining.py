#!/usr/bin/env python3
"""Check which documents are missing from CockroachDB."""
import sys, os
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from _shared import get_cockroach_db_connection

conn = get_cockroach_db_connection()
cur = conn.cursor()

# Get all uploaded document codes
cur.execute("SELECT DISTINCT document_code FROM ai_knowledge_base ORDER BY document_code")
uploaded = set(row[0] for row in cur.fetchall())
conn.close()

# Check cleaned directory
cleaned_dir = Path(__file__).resolve().parents[2] / 'data' / 'cleaned'
cleaned_files = {f.stem for f in cleaned_dir.glob('*.*') if f.is_file()}

# Check jesuit directory  
jesuit_dir = Path(__file__).resolve().parents[2] / 'data' / 'jesuit'
jesuit_files = {f.stem for f in jesuit_dir.glob('*.*') if f.is_file()}

# Check modul directory
modul_dir = Path(__file__).resolve().parents[2] / 'data' / 'catholic source' / 'modul katolisitas' / 'final'
modul_files = {f.stem for f in modul_dir.glob('modul_*.md') if f.is_file()}

print("=== MISSING FROM CLEANED DIR ===")
missing_cleaned = cleaned_files - uploaded
for f in sorted(missing_cleaned):
    size = (cleaned_dir / (f + '.md')).stat().st_size // 1024
    print(f"  {f} ({size}KB)")

print(f"\n=== MISSING FROM JESUIT DIR ===")
missing_jesuit = jesuit_files - uploaded
for f in sorted(missing_jesuit):
    size = (jesuit_dir / (f + '.txt')).stat().st_size // 1024
    print(f"  {f} ({size}KB)")

print(f"\n=== MISSING FROM MODUL DIR ===")
missing_modul = modul_files - uploaded
for f in sorted(missing_modul):
    size = (modul_dir / (f + '.md')).stat().st_size // 1024
    print(f"  {f} ({size}KB)")

print(f"\n=== SUMMARY ===")
print(f"Uploaded docs: {len(uploaded)}")
print(f"Missing from cleaned: {len(missing_cleaned)}/{len(cleaned_files)}")
print(f"Missing from jesuit: {len(missing_jesuit)}/{len(jesuit_files)}")
print(f"Missing from modul: {len(missing_modul)}/{len(modul_files)}")
print(f"\nTotal missing: {len(missing_cleaned) + len(missing_jesuit) + len(missing_modul)} documents")