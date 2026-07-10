# Instruksi Pembersihan dan Pemformatan Dokumen "St. Sirilus dari Yerusalem - Catechetical Lectures" untuk AI Knowledge Base

Anda akan diberikan teks mentah (raw text) dari dokumen PDF "Catechetical Lectures.pdf". Tugas Anda adalah membersihkan teks ini secara presisi dan memformatnya ke dalam format Markdown, dengan menyertakan metadata YAML di bagian atas.

## Metadata Dokumen:
*   **document_code**: `BAPA_SC_CL`
*   **title**: "St. Sirilus dari Yerusalem - Catechetical Lectures (Katekese)"
*   **category**: "Bapa Gereja"
*   **priority**: "Pendalaman"
*   **word_count**: [Hitung jumlah kata dari teks yang telah dibersihkan]
*   **paragraph_count**: [Hitung jumlah paragraf dari teks yang telah dibersihkan]
*   **estimated_chunks**: [Hitung perkiraan jumlah chunk (jumlah kata / 500)]

## Aturan Pembersihan Teks:

1.  **Hapus Nomor Baris/Referensi Awal**: Hapus angka atau penanda numerik di awal baris yang merupakan bagian dari sistem penomoran referensi, bukan bagian inti paragraf atau judul. Contoh: "18 Lih. S. TOMAS..." menjadi "Lih. S. TOMAS...". (Namun, semua 'Lih.' akan dihapus di langkah berikutnya).
2.  **Hapus Header, Footer, dan Nomor Halaman**: Identifikasi dan buang semua teks yang berulang di bagian atas atau bawah halaman, termasuk nomor halaman. Contoh: "24 Seri Dokumen Gerejawi No. 7", "St. Sirilus dari Yerusalem - Catechetical Lectures 25".
3.  **Hapus Semua Referensi Non-Biblical dan Akademis**:
    *   **Prioritas Utama**: Hapus semua frasa yang dimulai dengan "Lih." (lihat) yang merujuk pada sumber non-Biblical (misalnya, nama penulis seperti S. TOMAS, S. AGUSTINUS, PIUS XII, atau nama dokumen lain seperti Summa Theol., Ensiklik Mediator Dei, dll.).
    *   Hapus semua singkatan akademis atau jurnalistik beserta angkanya: `PG`, `AAS`, `DENZ.`, `MANSI`, `terb. FUNK`, `HARVEY`, `CSEL`, `SAGNARD`, `Conc. Oec. Decr.`, `Acta Conc. Oec.`, `Kitab Hukum Kanonik (lama)`, dan sejenisnya.
    *   Hapus referensi Konsili (misalnya `KONSILI TRENTE`, `KONSILI VATIKAN I`, `KONSILI NISEA`) beserta detail sidang/kanon/bab yang menyertainya.
    *   Hapus referensi Dokumen Paus (misalnya `PIUS XII, Ensiklik Mediator Dei`, `LEO XIII, Surat ...`) beserta detail tanggal/publikasi.
    *   Hapus referensi numerik atau alfanumerik dalam kurung `()` atau kurung siku `[]` yang bukan merupakan referensi Kitab Suci. Contoh: `(1)`, `(2)`, `[1]`, `[2]`, `(DENZ. 1821)`, `[KGK 123]`.
    *   Hapus penanda catatan kaki (superscript numbers) jika masih ada.
4.  **Pertahankan Referensi Kitab Suci**: Pastikan referensi Kitab Suci (misalnya `Mrk 16:15`, `Yoh. 3:16-17`, `1Kor 7:7: “Setiap orang menerima dari Allah karunianya yang khas..."`) tetap utuh.
5.  **Perbaiki Spasi dan Paragraf**:
    *   Ganti beberapa spasi dengan satu spasi.
    *   Pastikan ada dua baris kosong (`\n\n`) di antara paragraf-paragraf utama untuk keterbacaan di Markdown.
    *   Pertahankan pemformatan judul BAB (misalnya "BAB SATU MISTERI GEREJA") dan sub-bagian (misalnya "1. (Pendahuluan)") agar tetap menjadi heading Markdown yang sesuai.
    *   Hapus baris-baris yang kosong atau hanya berisi spasi setelah pembersihan.

## Format Output Markdown:

Dokumen harus dimulai dengan YAML front matter, diikuti dengan judul utama dokumen, deskripsi singkat, dan kemudian teks yang telah dibersihkan dan diformat.

```markdown
---
document_code: BAPA_SC_CL
title: "St. Sirilus dari Yerusalem - Catechetical Lectures (Katekese)"
category: "Bapa Gereja"
priority: "Pendalaman"
word_count: [jumlah kata]
paragraph_count: [jumlah paragraf]
estimated_chunks: [estimasi chunk]
---

# St. Sirilus dari Yerusalem - Catechetical Lectures (Katekese)

**Kode Dokumen**: `BAPA_SC_CL`  
**Kategori**: Bapa Gereja  
**Prioritas**: Pendalaman

> **Deskripsi**: Catechetical Lectures (Katekese) oleh St. Sirilus dari Yerusalem. Dokumen ini telah dibersihkan secara presisi untuk AI Knowledge Base.

---

[TEKS YANG TELAH DIBERSIHKAN DAN DIFORMAT]
```

Silakan proses teks PDF yang diberikan sesuai instruksi di atas.