import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2

conn = psycopg2.connect(
    host=os.environ["COCKROACHDB_HOST"], port=26257,
    dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
    password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
conn.autocommit = True
cur = conn.cursor()

print("Membuat enforce_theological_tagging()...")
cur.execute("""
CREATE OR REPLACE FUNCTION enforce_theological_tagging()
RETURNS TRIGGER
LANGUAGE PLpgSQL
AS $$
BEGIN
  IF (NEW).domain IN ('theology', 'catechism_module') THEN

    IF (NEW).is_approved = TRUE
       AND ((NEW).category_code IS NULL OR (NEW).authority_level IS NULL) THEN
      NEW.is_approved := FALSE;

      IF (NEW).tagging_status IS NULL OR (NEW).tagging_status NOT IN ('verified', 'pending_theological_tagging') THEN
        NEW.tagging_status := 'pending_theological_tagging';
      END IF;

    ELSIF (NEW).category_code IS NOT NULL AND (NEW).authority_level IS NOT NULL THEN
      IF (NEW).tagging_status = 'pending_theological_tagging' AND (NEW).is_approved = TRUE THEN
        NEW.tagging_status := 'verified';
      END IF;
    END IF;
  END IF;

  IF (NEW).domain NOT IN ('theology', 'catechism_module') AND (NEW).tagging_status IS NOT NULL THEN
    NEW.tagging_status := NULL;
  END IF;

  RETURN NEW;
END;
$$;
""")
print("  OK")

print("Membuat trigger trg_enforce_theological_tagging...")
try:
    cur.execute("""
        CREATE TRIGGER trg_enforce_theological_tagging
        BEFORE INSERT OR UPDATE OF is_approved ON qa_pairs
        FOR EACH ROW
        EXECUTE FUNCTION enforce_theological_tagging();
    """)
    print("  OK (dengan 'UPDATE OF is_approved')")
except psycopg2.Error as e:
    print(f"  Gagal dengan 'UPDATE OF is_approved': {e}")
    print("  Mencoba fallback tanpa pembatasan kolom...")
    conn.rollback()
    cur.execute("""
        CREATE TRIGGER trg_enforce_theological_tagging
        BEFORE INSERT OR UPDATE ON qa_pairs
        FOR EACH ROW
        EXECUTE FUNCTION enforce_theological_tagging();
    """)
    print("  OK (fallback: trigger di semua UPDATE, bukan cuma kolom is_approved)")

print("Membuat mark_qa_pair_embedding_outdated()...")
cur.execute("""
CREATE OR REPLACE FUNCTION mark_qa_pair_embedding_outdated()
RETURNS TRIGGER
LANGUAGE PLpgSQL
AS $$
BEGIN
    IF (OLD).question_variations IS DISTINCT FROM (NEW).question_variations
       OR (OLD).answer_preview IS DISTINCT FROM (NEW).answer_preview THEN
        NEW.embedding_outdated = TRUE;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
""")
print("  OK")

print("Membuat trigger trg_qa_pair_content_changed...")
cur.execute("""
    CREATE TRIGGER trg_qa_pair_content_changed
    BEFORE UPDATE ON qa_pairs
    FOR EACH ROW
    EXECUTE FUNCTION mark_qa_pair_embedding_outdated();
""")
print("  OK")

conn.close()
print("\nSEMUA TRIGGER qa_pairs BERHASIL DIBUAT")