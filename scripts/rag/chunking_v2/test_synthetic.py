#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Uji sintetis cepat -- BUKAN pengganti dry_run terhadap file asli, hanya
memverifikasi tiap cabang detector/chunker menghasilkan output masuk akal
sebelum dipakai ke 38 dokumen sungguhan Deva."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from chunk_engine import chunk_document, detect_pattern

SAMPLES = {}

# --- NUMBERED_PARAGRAPH (gaya Gaudium et Spes / KGK) ---
SAMPLES["numbered_paragraph"] = """
# Gaudium et Spes

1. Kegembiraan dan harapan, duka dan kecemasan orang-orang zaman sekarang, terutama
mereka yang miskin dan menderita, adalah juga kegembiraan dan harapan, duka dan
kecemasan para pengikut Kristus. Sungguh, tidak ada sesuatu pun yang sungguh manusiawi
yang tidak menggema di hati mereka.

2. Sebab itu Konsili Vatikan Kedua ini, setelah menyelami secara mendalam misteri
Gereja, tanpa ragu-ragu berbicara sekarang bukan lagi hanya kepada putra-putri Gereja
dan semua yang menyerukan nama Kristus, melainkan kepada semua orang.

3. Dunia yang dipandang Konsili ialah dunia manusia, keluarga umat manusia beserta
segala sesuatu yang mengelilinginya; dunia sebagai gelanggang sejarah umat manusia,
yang ditandai oleh jerih payah, kemenangan dan kegagalannya.

4. Maka Konsili, guna menunaikan tugas ini, pertama-tama hendak menimbang beberapa
ciri paling menonjol dari dunia dewasa ini.

5. Dunia dewasa ini nampak sekaligus penuh daya dan lemah, mampu mengerjakan yang
paling baik atau yang paling buruk, dan di hadapannya terbentang jalan menuju
kebebasan atau perbudakan, kemajuan atau kemunduran, persaudaraan atau kebencian.
"""

# --- CANON (Kitab Hukum Kanonik) ---
SAMPLES["canon"] = """
# Kitab Hukum Kanonik

Kan. 204 - Umat beriman kristiani ialah mereka yang, karena telah dibaptis, digabungkan
menjadi anggota Kristus dan dijadikan anggota Umat Allah.

Kan. 205 - Secara penuh dipersekutukan dengan Gereja Katolik di dunia ini mereka yang
tergabung dalam susunan Gereja itu berdasarkan ikatan pengakuan iman, sakramen-sakramen
dan pimpinan gerejawi.

Kan. 206 - Katekumen berada dalam hubungan khusus dengan Gereja: mereka yang meminta
untuk digabungkan dengan Gereja karena dorongan Roh Kudus, secara khusus dipersatukan
dengan Gereja.

Kan. 207 - Berdasarkan tetapan ilahi, di antara umat beriman kristiani terdapat di
dalam Gereja pelayan-pelayan tertahbis, yang dalam hukum disebut klerikus.

Kan. 208 - Di antara semua umat beriman kristiani, berkat kelahiran kembali mereka
dalam Kristus, terdapat kesamaan sejati mengenai martabat dan kegiatan.
"""

# --- CHAPTER_HEADING (gaya Tome of Leo, sudah divalidasi terhadap file asli) ---

# --- SCHOLASTIC book/chapter (gaya Adversus Haereses / De Civitate Dei) ---
SAMPLES["scholastic_book_chapter"] = """
# Adversus Haereses

## BOOK I

## CHAPTER I

The impossible task, they say, of learning the truth from Scripture by those who
are ignorant of tradition, since it was not committed to writing but by means of
tradition alone.

## CHAPTER II

Continuing the same subject: the heretics assert that the world was not made by
the Supreme God, but by some other power, at a distance from Him.

## BOOK II

## CHAPTER I

Recapitulation of the preceding book, showing that God alone truly comprehends
the invisible essence of all things.

## CHAPTER II

Refutation of the heretics, who maintain that matter is eternal and co-existent
with God.
"""

# --- SCHOLASTIC articulus (gaya Summa Theologica) ---
SAMPLES["scholastic_articulus"] = """
# Summa Theologica

## QUESTION I

## ARTICLE 1

Objection 1: It seems that sacred doctrine is not a science, since science
proceeds from self-evident principles.

Reply to Objection 1: Sacred doctrine is a science, though its principles are
not known by the natural light of reason but by the light of a higher science.

## ARTICLE 2

Objection 1: It seems sacred doctrine is not one single science, since one
science deals with one class of subjects only.

Reply to Objection 1: Sacred doctrine treats things under the aspect of God.

## QUESTION II

## ARTICLE 1

Objection 1: It seems the existence of God is self-evident.

Reply to Objection 1: The existence of God can be demonstrated.
"""

for name, text in SAMPLES.items():
    pattern = detect_pattern(text)
    chunks = chunk_document(text, name)
    print(f"\n{'='*60}\nSAMPLE: {name}")
    print(f"POLA TERDETEKSI: {pattern}  (jumlah chunk: {len(chunks)})")
    for c in chunks:
        preview = c.text[:80].replace(chr(10), ' ')
        print(f"  [{c.structural_ref}] {preview}...")
