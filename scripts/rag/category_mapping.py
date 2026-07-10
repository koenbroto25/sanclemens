# scripts/rag/category_mapping.py
"""
SATU-SATUNYA tempat pemetaan file sumber -> category_code/authority_level.
Dikunci berdasarkan Hierarki_Sumber_Teologis_Katolik.md (6 tingkat otoritas).
Kalau ada dokumen baru ditambahkan, WAJIB didaftarkan di sini dulu,
dan didaftarkan juga di rag_data_governance_master.md §3.1 (governance master menang
kalau ada perbedaan).
"""

# Format: "nama_file_tanpa_folder": (category_code, authority_level)
CATEGORY_MAP = {
    # Tingkat 0 — Kitab Suci
    "ALKITAB_Kitab_Suci_Katolik.md": ("1", "highest"),

    # Tingkat 1 — Konsili Vatikan II
    "Dei_Verbum.md": ("3", "highest"),
    "Gaudium_et_Spes.md": ("3", "highest"),
    "Sacrosanctum_Concilium.md": ("3", "highest"),
    "Unitatis_Redintegratio.md": ("3", "highest"),
    "nostra_aetate.md": ("3", "highest"),

    # Tingkat 2 — Kodifikasi resmi
    "Catechism_of_the_Catholic_Church.md": ("6", "highest"),
    "Compendium_of_the_Catechism.md": ("6", "highest"),
    "Kitab_Hukum_Kanonik.md": ("2", "medium"),

    # Tingkat 3 — Ensiklik & Ekshortasi Apostolik
    "Deus_Caritas_Est.md": ("4", "high"),
    "spe_salvi.md": ("4", "high"),
    "lumen_fidei.md": ("4", "high"),
    "Fides_et_Ratio.md": ("4", "high"),
    "Veritatis_Splendor.md": ("4", "high"),
    "Redemptoris_Mater.md": ("4", "high"),
    "Mulieris_Dignitatem.md": ("4", "high"),
    "Ecclesia_de_Eucharistia.md": ("4", "high"),
    "Humani_Generis.md": ("4", "high"),
    "Mysterium_Fidei.md": ("4", "high"),
    "Evangelii_Gaudium_cleaned.md": ("4", "high"),

    # Tingkat 4a — Bapa Gereja
    "Adversus_Haereses.md": ("7a", "reference"),
    "De Trinitate (St. Agustinus).md": ("7a", "reference"),
    "De_Civitate_Dei.md": ("7a", "reference"),
    "Homili_St._Yohanes_Krisostomus_1.md": ("7a", "reference"),
    "Homili_St._Yohanes_Krisostomus_2.md": ("7a", "reference"),
    "Homili_St._Yohanes_Krisostomus_3.md": ("7a", "reference"),
    "Homili_St._Yohanes_Krisostomus_4.md": ("7a", "reference"),
    "Apophthegmata Patrum.txt": ("7a", "reference"),
    "Tome of Leo (St. Leo Agung).md": ("7a", "reference"),

    # Tingkat 4b — Skolastik
    "Summa_Theologica _1.md": ("7a", "reference"),
    "Summa_Theologica_2.md": ("7a", "reference"),
    "Summa_Theologica_3.md": ("7a", "reference"),
    "Summa_Theologica _4.md": ("7a", "reference"),
    "Summa_Contra_Gentiles.md": ("7a", "reference"),
    "Super Boethium De Trinitate.md": ("7a", "reference"),

    # Tingkat 5 — Spiritualitas klasik
    "Imitation of Christ Thomas a Kempis.txt": ("7b", "reference"),

    # Tingkat 6 — Dokumen Ordo Serikat Yesus
    "Formula of the Institute 1540 1550.md": ("7b", "reference"),
    "Constitutions of the Society of Jesus.md": ("7b", "reference"),
    "Spiritual Exercises Ignatius Loyola (Mullan trans).txt": ("7b", "reference"),
    "Spiritual Diary of St Ignatius.txt": ("7b", "reference"),
    "Autobiography of St Ignatius.txt": ("7b", "reference"),
    "Selected Letters of St Ignatius.txt": ("7b", "reference"),
    "GC32 Decree 2 Jesuits Today.txt": ("7b", "reference"),
    "GC34 Decree 1 United with Christ.txt": ("7b", "reference"),
    "GC35 Decree 2 Fire that Kindles.txt": ("7b", "reference"),
    "GC36 Decrees.txt": ("7b", "reference"),
}

# Modul katolisitas: semua file di folder ini dapat kategori sama, pillar sengaja NULL
MODUL_KATOLISITAS_CATEGORY = ("9", "devotional")

# Domain per category_code (dipakai akb_metadata_for)
DOMAIN_BY_CATEGORY = {
    "1": "theology", "2": "theology", "3": "theology", "4": "theology",
    "6": "theology", "7a": "theology", "7b": "theology",
    "9": "catechism_module",
}

# Bot access per domain (§3.1 rag_ai_r2_final.md — bot yang menyentuh domain teologis)
BOT_ACCESS_BY_DOMAIN = {
    "theology": ["bot_3", "bot_8", "bot_pastor"],
    "catechism_module": ["bot_3", "bot_8"],
}


def category_for_file(relative_path: str) -> tuple[str, str]:
    """relative_path contoh: 'cleaned/ALKITAB_Kitab_Suci_Katolik.md' atau
    'modul katolisitas/modul_1_1_rev.md'. Return (category_code, authority_level)."""
    filename = relative_path.split("/")[-1].split("\\")[-1]
    if relative_path.replace("\\", "/").startswith("modul katolisitas/"):
        return MODUL_KATOLISITAS_CATEGORY
    if filename not in CATEGORY_MAP:
        raise KeyError(
            f"'{filename}' belum terdaftar di CATEGORY_MAP. "
            f"Daftarkan dulu di governance master §3.1, lalu tambahkan di sini."
        )
    return CATEGORY_MAP[filename]
