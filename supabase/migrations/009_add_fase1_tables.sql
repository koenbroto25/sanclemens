-- Migration 009: Fase 1 — Kehadiran Harian
-- Ref: GDD Bab VIII "Kehadiran Harian", Bab XIII "Real-Time & Notifikasi"
-- Sub-Fase: 1.1 Dashboard, 1.2 Liturgis & Jadwal, 1.3 SOS, 1.4 Bot Publik, 1.5 Governance

-- ============================================
-- 1. MISA SCHEDULES (Jadwal Misa)
-- ============================================
CREATE TABLE public.misa_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_misa TEXT NOT NULL,                -- "Misa Harian Pagi", "Misa Minggu I", dll
    jenis_misa TEXT NOT NULL CHECK (jenis_misa IN (
        'harian','minggu_pagi','minggu_sore','hari_raya',
        'pesta_patron','misa_khusus','misa_sakit','misa_orang_mati'
    )),
    hari TEXT NOT NULL CHECK (hari IN (
        'senin','selasa','rabu','kamis','jumat','sabtu','minggu','khusus'
    )),
    jam_mulai TIME NOT NULL,
    jam_selesai TIME,
    lokasi TEXT DEFAULT 'Gereja Utama',
    bahasa TEXT DEFAULT 'Indonesia' CHECK (bahasa IN ('Indonesia','Latin','Inggris','Jawa')),
    catatan TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default misa schedules (5 misa mingguan + 1 harian)
INSERT INTO public.misa_schedules (nama_misa, jenis_misa, hari, jam_mulai, jam_selesai, lokasi, bahasa) VALUES
    ('Misa Harian Pagi', 'harian', 'senin', '06:00', '07:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Harian Pagi', 'harian', 'selasa', '06:00', '07:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Harian Pagi', 'harian', 'rabu', '06:00', '07:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Harian Pagi', 'harian', 'kamis', '06:00', '07:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Harian Pagi', 'harian', 'jumat', '06:00', '07:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Harian Sore', 'harian', 'jumat', '18:00', '19:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Sabtu Sore', 'minggu_sore', 'sabtu', '18:00', '19:30', 'Gereja Utama', 'Indonesia'),
    ('Misa Minggu I', 'minggu_pagi', 'minggu', '06:30', '08:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Minggu II', 'minggu_pagi', 'minggu', '08:30', '10:00', 'Gereja Utama', 'Indonesia'),
    ('Misa Minggu III', 'minggu_pagi', 'minggu', '17:00', '18:30', 'Gereja Utama', 'Indonesia');

-- ============================================
-- 2. JADWAL PETUGAS (Liturgical Ministers)
-- ============================================
CREATE TABLE public.jadwal_petugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    misa_schedule_id UUID NOT NULL REFERENCES public.misa_schedules(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jenis_petugas TEXT NOT NULL CHECK (jenis_petugas IN (
        'lektor','mazmur','kolektan','petugas_komuni',
        'misdinar','prodiakon','dirigen_kor','organis',
        'petugas_pintu','tim_kebersihan','tim_keamanan'
    )),
    profile_id UUID REFERENCES public.profiles(id),
    nama_petugas TEXT,                       -- Allow non-profiled guests
    status_hadir TEXT DEFAULT 'belum_konfirmasi' CHECK (status_hadir IN (
        'belum_konfirmasi','hadir','tidak_hadir','pengganti'
    )),
    pengganti_profile_id UUID REFERENCES public.profiles(id),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. LITURGICAL CALENDAR
-- ============================================
CREATE TABLE public.liturgical_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    hari_raya TEXT NOT NULL,
    warna_liturgi TEXT NOT NULL CHECK (warna_liturgi IN (
        'hijau','ungu','putih','emas','merah','pink'
    )),
    bacaan1 TEXT,
    mazmur TEXT,
    bacaan2 TEXT,
    injil TEXT,
    minggu_liturgi TEXT,                    -- "Minggu Biasa I", "Minggu Palma", dll
    is_holy_day BOOLEAN DEFAULT FALSE,
    is_pesta BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. NOTIFICATIONS EXTENDED
-- ============================================
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS target_layer INTEGER,
    ADD COLUMN IF NOT EXISTS target_role TEXT,
    ADD COLUMN IF NOT EXISTS related_table TEXT,
    ADD COLUMN IF NOT EXISTS related_id UUID,
    ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

-- ============================================
-- 5. PUBLIC BOT — FAQ
-- ============================================
CREATE TABLE public.public_faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori TEXT NOT NULL CHECK (kategori IN (
        'jadwal_misa','sakramen','pendaftaran','liturgi','kontak','umum'
    )),
    pertanyaan TEXT NOT NULL,
    jawaban TEXT NOT NULL,
    keywords TEXT[],
    urutan INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default FAQ
INSERT INTO public.public_faq (kategori, pertanyaan, jawaban, keywords, urutan) VALUES
    ('jadwal_misa', 'Kapan jadwal Misa Minggu?', 'Misa Minggu diadakan 3 kali: pukul 06.30, 08.30, dan 17.00 WIB di Gereja Utama.', ARRAY['misa','minggu','jadwal'], 1),
    ('jadwal_misa', 'Kapan jadwal Misa Harian?', 'Misa Harian diadakan setiap Senin-Jumat pukul 06.00 pagi dan Jumat sore pukul 18.00.', ARRAY['misa','harian','jadwal'], 2),
    ('sakramen', 'Bagaimana cara mendaftarkan Baptis bayi?', 'Login ke aplikasi, buka menu Vault untuk upload dokumen, lalu daftarkan pada menu Sakramen > Baptis. Ketua Lingkungan akan memverifikasi.', ARRAY['baptis','bayi','sakramen'], 3),
    ('sakramen', 'Syarat pernikahan di Gereja?', 'Kedua calon pasutri harus sudah dibaptis, mengikuti kursus pranikah, dan mendaftar minimal 3 bulan sebelum tanggal.', ARRAY['nikah','pernikahan','sakramen'], 4),
    ('pendaftaran', 'Bagaimana cara daftar sebagai umat digital?', 'Klik tombol "Daftar sebagai Umat Digital" di halaman utama, lengkapi formulir, dan tunggu verifikasi dari Ketua Lingkungan.', ARRAY['daftar','registrasi','umat'], 5),
    ('pendaftaran', 'Apa itu Digital Vault?', 'Digital Vault adalah tempat aman untuk menyimpan dokumen gereja (Surat Baptis, Surat Nikah, dll) yang hanya perlu diverifikasi sekali seumur hidup.', ARRAY['vault','dokumen','digital'], 6),
    ('kontak', 'Alamat Paroki Santo Klemens?', 'Paroki Santo Klemens I, Kompleks Gereja Santo Martinus, Lanud Sepinggan, Balikpapan, Kalimantan Timur.', ARRAY['alamat','kontak','paroki'], 7),
    ('kontak', 'Nomor telepon Sekretariat Paroki?', 'Sekretariat Paroki dapat dihubungi melalui pastor paroki atau sekretariat lingkungan masing-masing.', ARRAY['telepon','kontak','sekretariat'], 8),
    ('liturgi', 'Apa itu Masa Adven?', 'Masa Adven adalah masa persiapan selama 4 minggu sebelum Natal, dilambangkan dengan warna liturgi Ungu.', ARRAY['adven','natal','liturgi'], 9),
    ('umum', 'Apa prinsip Zero-Cost Parish?', 'Paroki Santo Klemens berkomitmen tidak membebani umat dengan iuran wajib digital. Semua fitur aplikasi gratis, biaya operasional ditanggung swadaya.', ARRAY['biaya','gratis','zero','cost'], 10);

-- ============================================
-- 6. PUBLIC INFO (Pengumuman Publik)
-- ============================================
CREATE TABLE public.public_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    konten TEXT NOT NULL,
    kategori TEXT NOT NULL CHECK (kategori IN (
        'pengumuman','kegiatan','hari_raya','kebijakan','darurat'
    )),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    publish_until TIMESTAMPTZ,
    prioritas INTEGER DEFAULT 0,             -- Higher = more important
    foto_url TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sample public info
INSERT INTO public.public_info (judul, konten, kategori, is_published, published_at, prioritas) VALUES
    ('Selamat Datang di Ekosistem Digital Paroki', 'Ekosistem digital Paroki Santo Klemens hadir untuk melayani umat 24/7. Mari kita jaga kesakralan, keamanan, dan keutuhan komunitas digital ini.', 'pengumuman', TRUE, NOW(), 10),
    ('Misa Hari Raya Besar', 'Jadwal Misa Hari Raya akan diumumkan melalui notifikasi dan Dashboard Pastoral. Mohon umat memperhatikan warna liturgi dan busana yang sesuai.', 'hari_raya', TRUE, NOW(), 5),
    ('Prinsip Zero-Photocopy Parish', 'Dokumen sakramental Anda hanya perlu difotokopi dan diverifikasi sekali seumur hidup. Setelah itu, Paroki yang akan memvalidasi penggunaan dokumen Anda.', 'kebijakan', TRUE, NOW(), 8);

-- ============================================
-- 7. SOS — extend with extra fields
-- ============================================
ALTER TABLE public.pastoral_sos
    ADD COLUMN IF NOT EXISTS jenis_kedaruratan TEXT,
    ADD COLUMN IF NOT EXISTS deskripsi TEXT,
    ADD COLUMN IF NOT EXISTS kontak_keluarga TEXT,
    ADD COLUMN IF NOT EXISTS foto_bukti_url TEXT,
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS response_notes TEXT;

-- ============================================
-- 8. GOVERNANCE — extend with extra fields
-- ============================================
ALTER TABLE public.governance_program_kerja
    ADD COLUMN IF NOT EXISTS deskripsi TEXT,
    ADD COLUMN IF NOT EXISTS tahun INTEGER DEFAULT 2026,
    ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- Seed governance data
INSERT INTO public.governance_program_kerja (nama, deskripsi, tahun, status, progress) VALUES
    ('Program Katekese Baptis Dewasa', 'Kelas katekese untuk calon baptis dewasa, 8 sesi pertemuan', 2026, 'active', 25),
    ('Rekoleksi Keluarga', 'Rekoleksi keluarga paroki semester I 2026', 2026, 'active', 0),
    ('Bakti Sosial Bulanan', 'Pembagian paket sembako untuk keluarga prasejahtera', 2026, 'active', 50),
    ('Penyelenggaraan Misa Natal', 'Koordinasi liturgi dan dekorasi Misa Natal 2026', 2026, 'active', 10);

-- Seed initial KPI
INSERT INTO public.governance_kpi (tahun, triwulan, indikator, target, aktual, status) VALUES
    (2026, 1, 'Jumlah Misa yang diselenggarakan', '52 misa', '13 misa', 'on_track'),
    (2026, 1, 'Jumlah umat yang menerima sakramen', '50 umat', '12 umat', 'on_track'),
    (2026, 1, 'Persentase partisipasi umat di Minggu', '80%', '67%', 'need_attention'),
    (2026, 1, 'Jumlah kegiatan pendidikan iman', '12 kegiatan', '3 kegiatan', 'on_track');

-- Seed keputusan DPP sample
INSERT INTO public.governance_keputusan_dpp (tanggal, topik, bidang, keputusan) VALUES
    ('2026-01-15', 'Pengesahan RKAP 2026', 'koinonia', 'RKAP 2026 disahkan dengan total anggaran Rp 350.000.000 untuk 5 bidang pastoral'),
    ('2026-02-20', 'Pembentukan Tim Digital', 'kerygma', 'Dibentuk Tim ICT Paroki yang terdiri dari 5 umat dengan keahlian teknis'),
    ('2026-03-10', 'Kebijakan Privasi Data Umat', 'martyria', 'Data pribadi umat bersifat sakral dan tunduk pada Hukum Kanon 220 serta UU PDP');

-- Seed initial notulen
INSERT INTO public.governance_notulen (tanggal, peserta, agenda, notulen, action_items) VALUES
    ('2026-01-15', ARRAY['Pastor Yosef', 'Pak Budi (WK I)', 'Bu Sari (Sekretaris)'], 'Rapat Kerja Awal Tahun', 'Membahas RKAP 2026 dan struktur kepengurusan baru', '{"follow_ups": ["Sosialisasi RKAP ke seluruh umat", "Update struktur di aplikasi"]}'::jsonb);

-- ============================================
-- 9. DASHBOARD WIDGETS (per-role config)
-- ============================================
CREATE TABLE public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer INTEGER NOT NULL,
    widget_key TEXT NOT NULL,
    widget_title TEXT NOT NULL,
    widget_description TEXT,
    icon TEXT,
    urutan INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed widgets per role
INSERT INTO public.dashboard_widgets (layer, widget_key, widget_title, widget_description, icon, urutan) VALUES
    -- Layer 2 — Umat
    (2, 'vault', 'Digital Vault', 'Kelola dokumen sakramental Anda', '🔐', 1),
    (2, 'companion', 'AI Companion', 'Pendamping iman & doa', '✨', 2),
    (2, 'kasih', 'Solidaritas Kasih', 'Bantuan & donasi kepada sesama', '🤝', 3),
    (2, 'kartu_anggota', 'Kartu Anggota', 'QR Code & identitas digital', '🪪', 4),
    (2, 'keaktifan', 'Keaktifan', 'Catat kontribusi Anda di lingkungan', '🌱', 5),
    (2, 'jadwal_misa', 'Jadwal Misa', 'Lihat jadwal & bacaan liturgi', '⛪', 6),

    -- Layer 3 — Wali Digital
    (3, 'vault', 'Digital Vault', 'Kelola dokumen pribadi', '🔐', 1),
    (3, 'wali_digital', 'Wali Digital', 'Manajemen umat asuhan', '🛡️', 2),
    (3, 'kartu_anggota', 'Kartu Anggota', 'QR Code & identitas digital', '🪪', 3),
    (3, 'jadwal_misa', 'Jadwal Misa', 'Lihat jadwal & bacaan liturgi', '⛪', 4),

    -- Layer 4 — Ketua Lingkungan
    (4, 'verifikasi', 'Verifikasi Umat', 'Verifikasi pendaftaran umat baru', '✅', 1),
    (4, 'statistik_lingkungan', 'Statistik Lingkungan', 'Data umat di lingkungan Anda', '📊', 2),
    (4, 'jadwal_petugas', 'Jadwal Petugas', 'Atur petugas liturgi', '📋', 3),
    (4, 'kartu_anggota', 'Kartu Anggota', 'QR Code umat', '🪪', 4),

    -- Layer 5 — Sekretaris
    (5, 'data_umat', 'Data Umat', 'CRUD data umat paroki', '👥', 1),
    (5, 'verifikasi_vault', 'Verifikasi Vault', 'Verifikasi dokumen sakramental', '🔐', 2),
    (5, 'jadwal_petugas', 'Jadwal Petugas', 'Atur jadwal petugas liturgi', '📋', 3),
    (5, 'moderasi', 'Moderasi Konten', 'Review konten Companion & pengumuman', '🛡️', 4),

    -- Layer 6 — Bendahara
    (6, 'keuangan', 'Dashboard Keuangan', 'Saldo & transaksi rekening', '💰', 1),
    (6, 'kolekte', 'Input Kolekte', 'Blind Dual-Entry kolekte', '📦', 2),
    (6, 'approval', 'Approval', 'Multi-Signature transaksi', '✅', 3),
    (6, 'dana_duka', 'Dana Duka', 'Manajemen dana duka', '🕊️', 4),

    -- Layer 7 — Koordinator Bidang
    (7, 'kegiatan', 'Program Kerja', 'Kelola kegiatan bidang', '📅', 1),
    (7, 'laporan', 'LPJ & Laporan', 'Submit laporan kegiatan', '📝', 2),
    (7, 'anggaran', 'Anggaran', 'RKAP & anggaran kegiatan', '💼', 3),
    (7, 'keaktifan', 'Keaktifan', 'Rekap keaktifan umat', '🌱', 4),

    -- Layer 8 — Ketua DPP & Tim Audit
    (8, 'audit', 'Dashboard Audit', 'Rekonsiliasi & audit laporan', '🔍', 1),
    (8, 'approval_kritis', 'Approval Kritis', 'Approval transaksi > Rp 5jt', '⚖️', 2),
    (8, 'governance', 'Governance Hub', 'Program kerja, KPI, keputusan', '🏛️', 3),
    (8, 'laporan_aggregat', 'Laporan Agregat', 'Rekap paroki keseluruhan', '📊', 4),

    -- Layer 9 — Pastor
    (9, 'pastoral_sos', 'Pastoral SOS', 'Tanggap darurat 24/7', '🆘', 1),
    (9, 'surat_pastoral', 'Surat Pastoral', 'Kirim pesan pastoral ke umat', '💌', 2),
    (9, 'whistleblower', 'Whistle-blower', 'Laporan anonim pelanggaran', '📢', 3),
    (9, 'governance', 'Governance Hub', 'Program kerja, KPI, keputusan', '🏛️', 4),
    (9, 'dashboard_full', 'Dashboard Pastoral', 'Pandangan 360° paroki', '🌐', 5);

-- ============================================
-- 10. SOS ALERT MESSAGES
-- ============================================
CREATE TABLE public.sos_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES public.pastoral_sos(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    status_update TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. NOTIFICATION TEMPLATES
-- ============================================
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL,
    judul_template TEXT NOT NULL,
    pesan_template TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK (tipe IN ('info','warning','critical','pastoral_sos')),
    target_layer INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.notification_templates (template_key, judul_template, pesan_template, tipe, target_layer) VALUES
    ('misa_h_1', 'Liturgi Besok', 'Jangan lupa Misa harian besok pukul 06.00. Warna liturgi: {{warna}}.', 'info', 2),
    ('misa_minggu', 'Liturgi Minggu', 'Minggu {{minggu}}. Misa tersedia pukul 06.30, 08.30, dan 17.00.', 'info', 2),
    ('verifikasi_berhasil', 'Verifikasi Berhasil', 'Dokumen {{doc}} Anda telah diverifikasi.', 'info', 2),
    ('verifikasi_gagal', 'Verifikasi Ditolak', 'Dokumen {{doc}} Anda perlu perbaikan: {{alasan}}.', 'warning', 2),
    ('sos_triggered', 'Pastoral SOS', 'Sinyal darurat dari {{nama}}. Mohon respon segera.', 'pastoral_sos', 9),
    ('approval_pending', 'Transaksi Pending', 'Ada {{jumlah}} transaksi menunggu approval Anda.', 'warning', 6),
    ('kolekte_mismatch', 'Kolekte Tidak Cocok', 'Kolekte {{misa}} dari dua bendahara tidak cocok. Selisih: {{selisih}}.', 'critical', 8),
    ('sakramen_siap', 'Sakramen Siap', 'Berkas sakramen {{jenis}} Anda sudah siap dijadwalkan.', 'info', 2);

-- ============================================
-- 12. PROFILE — extend for Fase 1
-- ============================================
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notif_token TEXT,
    ADD COLUMN IF NOT EXISTS notif_liturgis BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_kegiatan BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_keuangan BOOLEAN DEFAULT TRUE;

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.misa_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liturgical_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES — FASE 1
-- ============================================

-- Misa Schedules: All authenticated can view, Layer 5+ can modify
CREATE POLICY "Anyone can view misa schedules"
    ON public.misa_schedules FOR SELECT
    USING (is_active = TRUE OR get_user_access_layer() >= 5);

CREATE POLICY "Sekretaris+ can manage misa schedules"
    ON public.misa_schedules FOR ALL
    USING (get_user_access_layer() >= 5)
    WITH CHECK (get_user_access_layer() >= 5);

-- Jadwal Petugas: Anyone can view, Layer 4+ can manage
CREATE POLICY "Anyone can view jadwal petugas"
    ON public.jadwal_petugas FOR SELECT
    USING (TRUE);

CREATE POLICY "KL+ can manage jadwal petugas"
    ON public.jadwal_petugas FOR ALL
    USING (get_user_access_layer() >= 4)
    WITH CHECK (get_user_access_layer() >= 4);

-- Liturgical Calendar: Anyone can view
CREATE POLICY "Anyone can view liturgical calendar"
    ON public.liturgical_calendar FOR SELECT
    USING (TRUE);

CREATE POLICY "Sekretaris+ can manage liturgical calendar"
    ON public.liturgical_calendar FOR ALL
    USING (get_user_access_layer() >= 5)
    WITH CHECK (get_user_access_layer() >= 5);

-- Public FAQ: Anyone (public) can view
CREATE POLICY "Public can view FAQ"
    ON public.public_faq FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Sekretaris+ can manage FAQ"
    ON public.public_faq FOR ALL
    USING (get_user_access_layer() >= 5)
    WITH CHECK (get_user_access_layer() >= 5);

-- Public Info: Public can view published
CREATE POLICY "Public can view published info"
    ON public.public_info FOR SELECT
    USING (
        is_published = TRUE AND
        (publish_until IS NULL OR publish_until > NOW())
    );

CREATE POLICY "Sekretaris+ can manage public info"
    ON public.public_info FOR ALL
    USING (get_user_access_layer() >= 5)
    WITH CHECK (get_user_access_layer() >= 5);

-- Dashboard Widgets: Anyone authenticated can view
CREATE POLICY "Authenticated can view widgets"
    ON public.dashboard_widgets FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Super Admin can manage widgets"
    ON public.dashboard_widgets FOR ALL
    USING (get_user_access_layer() >= 10)
    WITH CHECK (get_user_access_layer() >= 10);

-- SOS Responses: Pastor+ can view, pastor+responder can insert
CREATE POLICY "Pastor+ can view sos responses"
    ON public.sos_responses FOR SELECT
    USING (
        get_user_access_layer() >= 9 OR
        responder_id = auth.uid() OR
        sos_id IN (SELECT id FROM public.pastoral_sos WHERE triggered_by = auth.uid())
    );

CREATE POLICY "Pastor+ can insert sos responses"
    ON public.sos_responses FOR INSERT
    WITH CHECK (get_user_access_layer() >= 9);

-- Notification Templates: Layer 5+ can view
CREATE POLICY "Sekretaris+ can view notif templates"
    ON public.notification_templates FOR SELECT
    USING (get_user_access_layer() >= 5);

CREATE POLICY "Super Admin can manage notif templates"
    ON public.notification_templates FOR ALL
    USING (get_user_access_layer() >= 10)
    WITH CHECK (get_user_access_layer() >= 10);
