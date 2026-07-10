# AI-CLM Tool: Knowledge Retriever

## Revisi 1.0 — Juni 2026

### 1. Tujuan

Menyediakan sistem pengambilan informasi yang paling cepat dan akurat untuk AI, yang dapat dipanggil oleh model bahasa untuk mengambil potongan informasi yang relevan dari basis pengetahuan teologis yang dikurasi atau gambaran umum aplikasi, dengan tetap mematuhi aturan ketat "dilarang menggunakan data di luar dokumen yang diinjeksikan".

### 2. Konsep Dasar Retrieval-Augmented Generation (RAG)

Alih-alih menyuntikkan semua dokumen secara langsung ke prompt AI (yang tidak efisien dan rentan terhadap batasan konteks), model AI akan diberikan akses ke alat khusus yang dapat memanggil sistem pengambilan pengetahuan. Alat ini akan melakukan pencarian semantik terhadap basis pengetahuan yang sudah disiapkan dan hanya mengembalikan potongan informasi yang paling relevan.

### 3. Alur Persiapan Data (Ingestion Pipeline)

*   **Dokumen Sumber:** Semua dokumen doktrin Katolik resmi (KGK, KHK, Vatikan II, dll.), dokumen gambaran umum aplikasi, dan spesifikasi fitur/halaman.
*   **Chunking & Metadata:** Teks mentah dari dokumen-dokumen ini akan diproses:
    *   **Semantic Chunking:** Dokumen dipecah menjadi potongan-potongan yang lebih kecil dan bermakna (misalnya, paragraf, bagian, kanon/paragraf tertentu dari KGK/KHK). Ini memastikan bahwa setiap potongan koheren dan relevan saat diambil.
    *   **Ekstraksi Metadata Kaya:** Setiap potongan akan diberi tag dengan metadata kaya:
        *   `document_code` (misalnya, 'KGK', 'KHK', 'GDD_OVERVIEW')
        *   `document_title`, `chapter`, `paragraph_number`
        *   `theology_topic` (misalnya, 'Trinity', 'Sacraments', 'Moral_Theology')
        *   `historical_context` (misalnya, 'Council_of_Nicea')
        *   `philosophical_concept` (jika berlaku)
        *   `relevance_score` (pentingnya yang telah dihitung sebelumnya untuk umum vs. pembahasan mendalam)
        *   `target_bot_modes` (misalnya, 'Penjelajah_Iman', 'Guest_Info')
*   **Pembuatan Embedding:** Teks setiap potongan akan diubah menjadi embedding vektor menggunakan model embedding berkualitas tinggi (misalnya, dari API OpenAI/Google atau model open-source yang sesuai).
*   **Penyimpanan Database:**
    *   **`theology.references` (Diperpanjang):** Tabel ini (BAB II AI Spec v1.1) akan menyimpan potongan dokumen teologis dengan `content_text`, `content_embedding`, dan metadata kaya.
    *   **`public.app_overview_qna` (Tabel Baru):** Akan menyimpan pasangan Q&A yang dikurasi tentang aplikasi itu sendiri, dengan `question_embedding` dan `answer_text`. Ini juga akan mencakup referensi ke fitur-fitur tertentu (misalnya, Digital Vault, Dana Kasih).
    *   **`public.learning_content_chunks` (Tabel Baru):** Untuk jalur pembelajaran terstruktur, menyimpan blok konten yang lebih kecil dan terurut.
    *   **Supabase Vector Store:** Memanfaatkan database PostgreSQL Supabase dengan ekstensi `pgvector` untuk pencarian nearest-neighbor yang efisien pada embedding.

### 4. Knowledge Retriever Tool (Fungsi Python/TypeScript)

Ini adalah inti dari "sistem tercepat" untuk AI. Alih-alih menyuntikkan semua dokumen secara langsung, model AI akan diberikan akses ke alat khusus.

*   **Nama Alat:** `retrieve_knowledge`
*   **Deskripsi:** "Mengambil potongan informasi yang relevan dari database teologis yang dikurasi atau gambaran umum aplikasi berdasarkan kueri pengguna dan konteks percakapan saat ini."
*   **Parameter (objek JSON, dapat dipanggil oleh AI):**
    *   `query: string` (Pertanyaan langsung pengguna atau kueri yang diulang dari Chain-of-Thought AI)
    *   `context_keywords: string[]` (Opsional: Kata kunci yang berasal dari riwayat percakapan atau mode bot saat ini, misalnya, ['sakramen', 'baptisan', 'sejarah'])
    *   `target_document_code: string[]` (Opsional: Tentukan dokumen yang akan diprioritaskan, misalnya, ['KGK', 'KHK'] untuk dogma, ['APP_OVERVIEW'] untuk info aplikasi)
    *   `theology_topic: string` (Opsional: Tentukan topik teologis untuk difilter, misalnya, 'Trinity', 'Moral_Ethics')
    *   `max_results: number` (Opsional: Jumlah potongan relevan teratas yang akan diambil, default 3-5)
*   **Implementasi (Layanan Backend, misalnya, Python Flask/FastAPI atau Next.js API Route):**
    *   Fungsi ini akan menerima `query` dan parameter lain dari AI.
    *   Ini akan mengubah `query` menjadi embedding.
    *   Melakukan **pencarian kesamaan semantik** terhadap `content_embedding` di `theology.references` dan `question_embedding` di `public.app_overview_qna` (dan `public.learning_content_chunks`) menggunakan penyimpanan vektor Supabase.
    *   **Filter & Peringkat Ulang:** Menerapkan filter tambahan berdasarkan `target_document_code`, `theology_topic`, dan berpotensi `relevance_score`. Memeringkat ulang hasil untuk memastikan potongan yang paling tepat dan relevan secara kontekstual dikembalikan.
    *   **Format Output:** Mengembalikan string ringkas atau JSON terstruktur yang berisi `content_text` dari N potongan relevan teratas, bersama dengan `document_code` dan `paragraph_number` untuk kutipan.

### 5. Integrasi ke Prompt AI (Chain-of-Thought)

`CHAIN-OF-THOUGHT` AI untuk Bot 1 (Info Tamu), Bot 3 (Companion Rohani), dan Gate Bot akan diperbarui untuk menyertakan panggilan alat ini.

*   **Contoh Chain-of-Thought untuk Bot 3 ("Penjelajah Iman"):**
    ```
    [CHAIN-OF-THOUGHT — JANGAN TAMPILKAN KE USER]
    Sebelum menjawab, lakukan ini secara diam-diam:
    1. DETEKSI INTENT: Apakah user bertanya tentang dogma, ajaran, filosofi, atau peristiwa gereja?
    2. FORMULASI QUERY: Buat kueri yang tepat untuk Knowledge Retriever, termasuk `context_keywords` dari percakapan.
    3. PANGGIL TOOL: `retrieve_knowledge(query, context_keywords, target_document_code=['KGK', 'KHK', 'VATII', 'ALKITAB', 'THEOLOGY_REFS'])`
    4. ANALISIS HASIL: Baca snippet yang dikembalikan oleh Knowledge Retriever.
    5. SUSUN RESPONS: Gunakan informasi dari snippet untuk menjawab pertanyaan user sesuai persona Bot 3 dan preferensi verbosity, sambil MENYEBUTKAN SUMBER (misalnya, "Berdasarkan Katekismus Gereja Katolik...").
    6. Jika Knowledge Retriever tidak mengembalikan hasil yang relevan → gunakan Formula Penolakan Resmi.
    [/CHAIN-OF-THOUGHT]
    ```
*   **Contoh Chain-of-Thought untuk Bot 1 (Info Tamu):**
    ```
    [CHAIN-OF-THOUGHT — JANGAN TAMPILKAN KE USER]
    Sebelum menjawab, lakukan ini secara diam-diam:
    1. DETEKSI INTENT: Apakah user bertanya tentang fungsi aplikasi atau ajaran Katolik dasar?
    2. FORMULASI QUERY: Buat kueri yang tepat untuk Knowledge Retriever.
    3. PANGGIL TOOL: `retrieve_knowledge(query, target_document_code=['APP_OVERVIEW', 'QNA_PUBLIC', 'THEOLOGY_BASIC'])`
    4. ANALISIS HASIL: Baca snippet yang dikembalikan.
    5. SUSUN RESPONS: Jawab dengan ramah dan informatif, fokus pada manfaat, dan sebutkan sumber jika relevan.
    6. Jika tidak relevan → gunakan Formula Penolakan Resmi.
    [/CHAIN-OF-THOUGHT]