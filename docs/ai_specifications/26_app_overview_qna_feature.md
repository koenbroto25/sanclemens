# BAB XXVI — App Overview Q&A Feature

## Revisi 1.0 — Juni 2026

### 26.1 Tujuan

Menyediakan informasi yang jelas, konsisten, dan berorientasi manfaat tentang seluruh Ekosistem Digital Paroki Santo Klemens, dapat diakses oleh semua pengguna melalui bot yang relevan.

### 26.2 Konten & Struktur

Knowledge base ini akan menyimpan ringkasan tingkat tinggi yang berasal dari dokumen-dokumen `GDD_Overview`, `Masterplan_Overview`, `Userflow_Overview`, dan `Features`. Ini akan secara eksplisit menyoroti manfaat **Fitur Amal (Dana Kasih, Dana Duka, Sistem Anti-Penyalahgunaan SOS, Tiga Pintu Kasih) dan Digital Vault**, di samping AI Companion, pembelajaran Katolik, dan AI Matching.

#### Contoh Q&A:

*   **Q:** "Website ini isinya apa saja?"
*   **A:** "Ekosistem Digital Paroki Santo Klemens adalah platform terpadu untuk semua kebutuhan umat. Anda akan menemukan **fitur-fitur sosial dan amal seperti Dana Kasih dan Dana Duka**, serta **Digital Vault untuk penyimpanan dokumen penting Anda**. Kami juga menyediakan Pendamping Rohani pribadi, fitur pencarian kerja (Klemen Kerja), dan modul belajar iman Katolik."
*   **Q:** "Apa manfaat aplikasi ini bagi umat?"
*   **A:** "Aplikasi ini mempermudah Anda mengakses jadwal misa, mengelola data keluarga digital, mengajukan sakramen, hingga mendapatkan pendampingan rohani yang aman. Anda juga bisa mencari pekerjaan atau bantuan (melalui **fitur-fitur kasih dan solidaritas**), dan menyimpan dokumen penting secara digital di **Digital Vault** Anda. Semua ini membantu Anda berinteraksi lebih dekat dengan paroki dan lingkungan."
*   **Q:** "Bagaimana aplikasi ini membantu gereja?"
*   **A:** "Bagi gereja, aplikasi ini meningkatkan efisiensi administrasi, memastikan transparansi keuangan melalui sistem audit otomatis, dan memperkuat pelayanan pastoral dengan alat seperti Cek Lansia Harian dan pengelolaan data GAKIN yang terstruktur. **Sistem amal terpadu** juga memastikan bantuan tersalurkan tepat sasaran, sementara **Digital Vault** membantu pengelolaan dokumen umat dengan lebih aman dan efisien."

### 26.3 Integrasi Bot

*   **Bot 1 (Info Publik) dan Gate Bot:** Akan menjadi konsumen utama, memastikan pengguna baru dan ingin tahu dengan cepat memahami proposisi nilai aplikasi.
*   **Prioritas:** `app_overview_qna` akan memiliki prioritas tinggi dalam hierarki pengambilan pengetahuan untuk Bot 1 dan Gate Bot ketika niat spesifik untuk "informasi aplikasi" terdeteksi.

### 26.4 Database Schema

*   **`public.app_overview_qna` (Tabel Baru):**
    ```sql
    CREATE TABLE public.app_overview_qna (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        question_embedding VECTOR(1536), -- for semantic search
        related_features TEXT[],         -- e.g., ['charity_dana_kasih', 'digital_vault']
        target_user_layers INTEGER[],    -- e.g., [0, 2] for public/guest, all layers for general info
        approved_by UUID REFERENCES public.profiles(id),
        approved_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );