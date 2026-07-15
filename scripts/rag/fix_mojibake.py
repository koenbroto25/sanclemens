# fix_mojibake.py
# Tahap 1: perbaiki karakter yang sudah kadung mojibake (UTF-8 yang sempat
# didekode sebagai cp1252, lalu disimpan ulang sebagai UTF-8).
# Tahap 2: ganti emoji (yang sudah bersih/hasil perbaikan) jadi tag ASCII,
# supaya ke depannya kebal encoding di terminal manapun.
#
# Jalankan sekali dari folder scripts/rag: python fix_mojibake.py

import io

FILES = [
    "pipeline_corpus_teologi.py",
    "approve_corpus_teologi.py",
    "pipeline_renungan.py",
]

EMOJI_TO_TAG = {
    "\u2705": "[OK]",             # ✅
    "\u274c": "[GAGAL]",          # ❌
    "\u23f3": "[PENDING]",        # ⏳
    "\u23ed\ufe0f": "[SKIP]",     # ⏭️
    "\u23ed": "[SKIP]",           # ⏭
    "\U0001F4CA": "[STATS]",      # 📊
    "\U0001F4CB": "[LIST]",       # 📋
    "\u26a0\ufe0f": "[PERINGATAN]",  # ⚠️
    "\u26a0": "[PERINGATAN]",     # ⚠
    "\U0001F534": "[KRITIS]",     # 🔴
    "\U0001F7E0": "[TINGGI]",     # 🟠
    "\U0001F7E1": "[SEDANG]",     # 🟡
}


def perbaiki_mojibake(text: str) -> tuple[str, int]:
    """Coba perbaiki mojibake per-karakter (bukan per-file) supaya karakter
    yang gagal direparasi tidak menggagalkan seluruh file — cukup dilewati
    dan dilaporkan."""
    hasil = []
    jumlah_diperbaiki = 0
    gagal = set()
    i = 0
    while i < len(text):
        ch = text[i]
        # Coba jendela geser 1-4 karakter (mojibake emoji multi-byte biasanya
        # jadi 2-4 karakter mojibake berurutan)
        diperbaiki = False
        for lebar in (4, 3, 2):
            if i + lebar <= len(text):
                potongan = text[i:i + lebar]
                try:
                    hasil_perbaikan = potongan.encode("cp1252").decode("utf-8")
                except (UnicodeEncodeError, UnicodeDecodeError):
                    continue
                if hasil_perbaikan in EMOJI_TO_TAG or (
                    len(hasil_perbaikan) == 1 and ord(hasil_perbaikan) > 0x2000
                ):
                    hasil.append(hasil_perbaikan)
                    jumlah_diperbaiki += 1
                    i += lebar
                    diperbaiki = True
                    break
        if not diperbaiki:
            hasil.append(ch)
            i += 1
    return "".join(hasil), jumlah_diperbaiki


for fname in FILES:
    try:
        with io.open(fname, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[LEWATI] {fname} tidak ditemukan di folder ini")
        continue

    content, jumlah_repair = perbaiki_mojibake(content)

    jumlah_tag = 0
    for emoji, tag in EMOJI_TO_TAG.items():
        jumlah = content.count(emoji)
        if jumlah:
            content = content.replace(emoji, tag)
            jumlah_tag += jumlah

    with io.open(fname, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] {fname}: {jumlah_repair} karakter mojibake diperbaiki, {jumlah_tag} emoji diganti ke tag ASCII")

print("\nSelesai. Kalau masih ada karakter aneh tersisa di beberapa baris,")
print("kirim baris itu ke chat (contoh: python -c \"print(open('pipeline_renungan.py',encoding='utf-8').read())\" | findstr /C:\"?\")")
print("supaya bisa saya bantu perbaiki manual satu-satu.")
