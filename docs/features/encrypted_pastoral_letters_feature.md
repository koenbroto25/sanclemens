# Encrypted Pastoral Letters — Surat Pastoral Terenkripsi

## Informasi Dokumen
- **Fase:** 2 — Inklusivitas & Rohani
- **Status:** ⬜ Belum Dimulai
- **Referensi Utama:**
  - [GDD v4.0] Bab XII "AI Companion Backend" — arsitektur E2E encryption
  - [GDD v4.0] Bab IV.2 — tabel `public.surat_pastoral` (encrypted konten)
  - [GDD v4.0] Bab XV "Security Implementation" — enkripsi end-to-end
  - [UF v4.0] Bagian 9 "Surat Pastoral Terenkripsi"
  - [DS v3.0] Bagian 10.16 "Pastoral — Pastor (Layer 9)"

## Deskripsi
Fitur Surat Pastoral Terenkripsi memungkinkan Pastor untuk mengirim surat pastoral kepada umat tertentu dengan konten yang dienkripsi end-to-end. Surat hanya dapat dibaca oleh Pastor (pengirim) dan umat (penerima). Super Admin (Layer 10) dan role lain **tidak dapat** mengakses isi surat.

## Tujuan
- Memfasilitasi komunikasi pastoral yang aman dan pribadi antara Pastor dan umat
- Menjamin kerahasiaan konten surat sesuai prinsip privacy by design
- Menyediakan arsip digital surat pastoral yang aman

## Alur Utama

### Alur Pengiriman Surat
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Pastor | Buka halaman Surat Pastoral, pilih "Tulis Surat Baru" | Form tersedia dengan daftar umat | Form siap |
| 2 | Pastor | Pilih penerima (umat), tulis konten surat | Sistem siapkan enkripsi | Konten ditulis |
| 3 | Pastor | Klik "Kirim" | Konten dienkripsi E2E, simpan ke DB, kirim notifikasi ke penerima | Surat terkirim |
| 4 | Umat | Menerima notifikasi "Surat baru dari Pastor" | Buka halaman surat, konten didekripsi | Surat terbaca |

### Alur Membaca Surat
| Langkah | Pelaksana | Tindakan | Respon Sistem | Hasil |
|---------|-----------|----------|---------------|-------|
| 1 | Umat | Buka menu Surat Pastoral | Daftar surat masuk (subjek, tanggal, status) | Daftar tampil |
| 2 | Umat | Klik surat | Sistem dekripsi konten (hanya mungkin untuk penerima) | Isi surat tampil |
| 3 | Umat | (Opsional) Tandai sebagai dibaca | Status update | Surat terbaca |

### Alur Khusus Pastor
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 1 | Pastor | Buka dashboard Surat Pastoral | Daftar surat terkirim (per umat, per tanggal, status dibaca/belum) |
| 2 | Pastor | Filter: per umat, per periode, status | Hasil filter tampil |
| 3 | Pastor | Lihat detail surat | Konten didekripsi untuk Pastor sebagai penulis |

## Database Schema

### Tabel `surat_pastoral` (Baru)
```sql
CREATE TABLE public.surat_pastoral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id),
    subject TEXT NOT NULL,
    encrypted_content TEXT NOT NULL,     -- Konten terenkripsi (AES-256-GCM)
    encryption_iv TEXT NOT NULL,          -- Initialization vector
    encryption_tag TEXT NOT NULL,         -- Auth tag untuk integritas
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent','read','archived')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_surat_pastoral_sender ON public.surat_pastoral(sender_id);
CREATE INDEX idx_surat_pastoral_recipient ON public.surat_pastoral(recipient_id);
CREATE INDEX idx_surat_pastoral_status ON public.surat_pastoral(status);
```

### RLS Policies
```sql
-- Pastor bisa lihat surat yang dia kirim
CREATE POLICY pastor_view_sent ON public.surat_pastoral
    FOR SELECT USING (sender_id = auth.uid());

-- Umat bisa lihat surat yang ditujukan kepadanya
CREATE POLICY umat_view_received ON public.surat_pastoral
    FOR SELECT USING (recipient_id = auth.uid());

-- Hanya Pastor yang bisa insert
CREATE POLICY pastor_insert ON public.surat_pastoral
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 9)
    );

-- Super Admin TIDAK bisa akses (tidak ada policy untuk layer 10)
-- Akses ke konten terenkripsi tetap tidak berguna tanpa kunci dekripsi
```

## Keamanan & Enkripsi
- **Algoritma:** AES-256-GCM untuk enkripsi simetris
- **Key Management:** Kunci enkripsi diturunkan dari kombinasi hash password user + server secret
- **Dekripsi:** Hanya mungkin oleh sender (Pastor) dan recipient (umat) yang memiliki kunci yang tepat
- **Super Admin:** Tidak bisa mendekripsi konten meskipun memiliki akses ke database (kunci tidak tersedia)
- **Audit Log:** Semua akses ke surat tercatat (siapa, kapan), tapi isi tetap terenkripsi

## Komponen UI
| Komponen | Route | Deskripsi |
|----------|-------|-----------|
| `PastoralLetterList.tsx` | Dashboard Pastor | Daftar surat terkirim dengan filter |
| `PastoralLetterCompose.tsx` | Dashboard Pastor | Form tulis surat baru |
| `PastoralLetterInbox.tsx` | Halaman Umat | Daftar surat masuk |
| `PastoralLetterDetail.tsx` | Detail surat | Tampilkan konten yang didekripsi |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Umat penerima tidak aktif/dihapus | Notifikasi gagal, surat tetap tersimpan untuk 30 hari |
| Pastor berganti | Surat lama tetap bisa diakses oleh pastor baru (jika ada akses) |
| Gagal dekripsi | Tampilkan pesan error, log ke `error_logs` |
| Surat belum dibaca > 30 hari | Notifikasi reminder ke umat (opsional) |

## Referensi Halaman
- **Pastor:** `src/app/(dashboard)/pastor/surat/page.tsx` (dari masterplan)
- **Umat:** `src/app/(dashboard)/surat-pastoral/page.tsx`