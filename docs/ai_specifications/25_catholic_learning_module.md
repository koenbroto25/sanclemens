# BAB XXV — Unified Catholic Learning Module (AI-CLM)

## Revisi 1.0 — Juni 2026

### 25.1 Tujuan

Menyediakan platform komprehensif, sesuai doktrin, dan menarik untuk mempelajari iman Katolik, dapat diakses oleh pengguna tamu dan umat terdaftar. AI akan bertindak sebagai pemandu, mengambil informasi dari sumber teologis yang sudah dikurasi.

### 25.2 Komponen & Fungsionalitas

#### 25.2.1 Bot 3 (Companion Rohani - Mode "Penjelajah Iman")

*   **Pengguna Target:** Umat terdaftar (Layer 2+).
*   **Mode Penjelajahan Mendalam:** Mode ini akan menawarkan eksplorasi dogma dari berbagai perspektif:
    *   **Katekismus (KGK):** Ajaran Gereja resmi.
    *   **Dasar Alkitabiah:** Ayat-ayat Kitab Suci yang relevan.
    *   **Perkembangan Sejarah:** Konteks historis singkat (misalnya, Konsili Nicea).
    *   **Dasar Filosofis:** Koneksi filosofis yang disederhanakan jika sesuai.
    *   **Penerapan Sehari-hari:** Relevansi praktis dalam kehidupan Katolik.
*   **Jalur Pembelajaran Interaktif:** Untuk topik kompleks, Bot 3 akan menyarankan sesi terpandu multi-giliran. Misalnya, "Apakah Anda ingin menjelajahi 'Sakramen Rekonsiliasi' melalui sesi terpandu 5 langkah?" Setiap langkah menyajikan informasi, diikuti dengan pertanyaan reflektif.
*   **Penalaran Etis ("Skenario 'Bagaimana Jika'"):** Untuk "tanggapan atas peristiwa," Bot 3 akan menerapkan prinsip teologi moral Katolik pada dilema etika, selalu dengan penafian.
*   **Kedalaman yang Dapat Disesuaikan:** Pengguna dapat mengatur preferensi `verbosity` (misalnya, 'ringkas', 'normal', 'detail', 'akademis') di `ai_user_profiles` untuk menyesuaikan kedalaman penjelasan.
*   **Kemajuan yang Dipersonalisasi:** Memanfaatkan memori spiritual terenkripsi E2E dan `learning_progress_summary` non-E2E (di `ai_user_profiles`) bersama dengan `public.learning_paths_completed` dan `public.learning_topics_reviewed` untuk menawarkan rekomendasi yang dipersonalisasi.

#### 25.2.2 Guest Info Bot (Bot 1 yang Ditingkatkan) pada Halaman `/learn-catholic`

*   **Pengguna Target:** Pengguna tamu (Layer 0).
*   **Akses Publik:** Halaman "Catholic Learning Page" publik baru (`/learn-catholic`) akan menjadi antarmuka obrolan interaktif yang disederhanakan.
*   **Informasi Dasar:** Bot yang disematkan (varian Bot 1 yang ditingkatkan) akan menjawab pertanyaan dasar tentang Katolik dari subset pengetahuan teologis yang dikurasi secara publik.
*   **Interaksi Tanpa Status:** Interaksi tamu tidak akan memiliki status (tidak ada riwayat yang dipersonalisasi atau kemajuan yang disimpan).
*   **Dorongan Konversi:** Bot akan secara halus mendorong pendaftaran untuk fitur lengkap, misalnya, "Daftar untuk menyimpan kemajuan belajar Anda dan mengakses Companion Rohani lengkap."

#### 25.2.3 Modul "Belajar Katolik" (dalam Portal 1 untuk Umat)

*   **Fitur Menonjol:** Bagian khusus dalam Portal 1 untuk umat terdaftar, menyediakan akses langsung ke mode "Penjelajah Iman" Bot 3, bersama dengan artikel, video, dan pelajaran interaktif yang dikurasi.
*   **Konten yang Dikurasi:** Bagian ini akan menyajikan konten yang sama yang tersedia melalui Bot 3, tetapi dalam format yang dapat dijelajahi dan terstruktur.

### 25.3 Knowledge Management & Retrieval

Lihat `docs/ai_architecture/ai_knowledge_retriever_tool.md` untuk detail implementasi Knowledge Retriever Tool.

### 25.4 Database Schema Additions/Modifications

*   **`theology.references` (Modification):** Tambah kolom metadata terstruktur untuk eksplorasi multi-perspektif:
    ```sql
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS theology_topic TEXT;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS historical_context TEXT;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS philosophical_concept TEXT;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS everyday_application TEXT;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(3,2) DEFAULT 1.0;
    ALTER TABLE theology.references ADD COLUMN IF NOT EXISTS target_bot_modes TEXT[]; -- e.g., ['Penjelajah_Iman', 'Guest_Info']
    ```
*   **`public.learning_paths` (New Table):** Untuk mendefinisikan jalur pembelajaran terstruktur.
    ```sql
    CREATE TABLE public.learning_paths (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        path_name TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE, -- accessible to guests via /learn-catholic
        steps JSONB NOT NULL,            -- e.g., [{"title": "Step 1: What is Trinity?", "content_ref": "theology.references#123", "question": "Reflect on..."}]
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
*   **`public.learning_progress_records` (New Table):** Untuk melacak kemajuan umat (non-E2E).
    ```sql
    CREATE TABLE public.learning_progress_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.profiles(id),
        path_id UUID REFERENCES public.learning_paths(id),
        current_step INTEGER DEFAULT 0,
        completed_steps INTEGER[] DEFAULT '{}',
        last_accessed TIMESTAMPTZ DEFAULT NOW(),
        status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
*   **`public.ai_user_profiles` (Modification):** Tambah bidang untuk modul pembelajaran.
    ```sql
    ALTER TABLE public.ai_user_profiles ADD COLUMN IF NOT EXISTS learning_progress_summary TEXT; -- Non-E2E summary for AI to reference
    ALTER TABLE public.ai_user_profiles ADD COLUMN IF NOT EXISTS learning_path_preferences TEXT[];
    ALTER TABLE public.ai_user_profiles ADD COLUMN IF NOT EXISTS preferred_learning_depth TEXT DEFAULT 'normal' CHECK (preferred_learning_depth IN ('ringkas', 'normal', 'detail', 'akademis'));
    ```

### 25.5 UI/UX & User Flow

*   **Halaman Belajar Katolik Publik (`/learn-catholic`):** Akan menjadi titik masuk utama bagi pengguna tamu. Halaman ini akan menampilkan konten yang dikurasi secara publik dan Bot Info Tamu (Bot 1 yang ditingkatkan).
*   **Modul Belajar Katolik di Portal 1:** Antarmuka yang terintegrasi penuh untuk umat terdaftar, memberikan akses ke fitur-fitur canggih Bot 3 "Penjelajah Iman" dan jalur pembelajaran yang disimpan.
*   **Elemen UI:** `LearningPathCard.tsx`, `LearningProgressIndicator.tsx`, `TheologicalReferenceDisplay.tsx`.