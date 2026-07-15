# fix_emoji.py
# Mengganti emoji dengan tag ASCII biasa supaya tidak mojibake di console
# Windows manapun (independen dari chcp/PYTHONIOENCODING/font terminal).
# Jalankan sekali dari folder scripts/rag: python fix_emoji.py

import io

REPLACEMENTS = {
    "✅": "[OK]",
    "❌": "[GAGAL]",
    "⏳": "[PENDING]",
    "⏭": "[SKIP]",
    "📊": "[STATS]",
    "📋": "[LIST]",
    "⚠️": "[PERINGATAN]",
    "⚠": "[PERINGATAN]",
    "🔴": "[KRITIS]",
    "🟠": "[TINGGI]",
    "🟡": "[SEDANG]",
}

FILES = [
    "pipeline_corpus_teologi.py",
    "approve_corpus_teologi.py",
    "pipeline_renungan.py",
]

for fname in FILES:
    try:
        with io.open(fname, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[LEWATI] {fname} tidak ditemukan di folder ini")
        continue

    original = content
    jumlah_ganti = 0
    for emoji, tag in REPLACEMENTS.items():
        jumlah = content.count(emoji)
        if jumlah:
            content = content.replace(emoji, tag)
            jumlah_ganti += jumlah

    if content != original:
        with io.open(fname, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[OK] {fname}: {jumlah_ganti} emoji diganti")
    else:
        print(f"[OK] {fname}: tidak ada emoji ditemukan (sudah bersih)")

print("\nSelesai. File asli sudah tertimpa — pastikan backup .bak dari langkah")
print("sebelumnya (Copy-Item *.py.bak) masih ada kalau perlu rollback.")
