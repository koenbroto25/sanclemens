# Whistle-Blower System — Sistem Pelaporan Pelanggaran

## Informasi Dokumen
- **Fase:** 3 — Solidaritas & Keuangan
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 3.6 — Whistle-Blower
- **Referensi Utama:**
  - [GDD v4.0] Bab XV "Security Implementation" — E2E encryption, no-IP-logging
  - [UF v4.0] Bagian 15 "Whistle-Blower"
  - [DS v3.0] Bagian 10.16 "Pastoral — Pastor (Layer 9)"
  - [GDD v4.0] Bab I.1 "Prinsip Arsitektur" — WhatsApp Integration

## Deskripsi
Sistem Whistle-Blower (Pelaporan Pelanggaran) yang memungkinkan umat melaporkan dugaan pelanggaran, penyimpangan, atau masalah serius di lingkungan paroki secara **anonim dan aman**. Laporan dikirim langsung ke Pastor Paroki — tidak melalui pengurus atau admin lain — dengan identitas pelapor yang dilindungi secara arsitektur.

## Prinsip Utama
- **Anonimitas Absolut:** Identitas pelapor tidak pernah tersimpan dalam bentuk yang bisa ditelusuri
- **E2E Encryption:** Konten laporan dienkripsi end-to-end
- **Langsung ke Pastor:** Tidak ada perantara (bendahara, pengurus, admin)
- **No-IP-Logging:** Alamat IP pelapor tidak dicatat

## Alur Utama

### Alur Pelaporan via Aplikasi
| Langkah | Pelaku | Tindakan | Respon Sistem | Hasil |
|---------|--------|----------|---------------|-------|
| 1 | Umat (Layer 2+) | Buka halaman Whistle-Blower | Form laporan anonim | Form siap |
| 2 | Umat | Pilih kategori: Keuangan / Penyalahgunaan / Lainnya | Form menyesuaikan kategori | Kategori dipilih |
| 3 | Umat | Tulis isi laporan (detail, bukti jika ada) | Konten dienkripsi E2E | Konten aman |
| 4 | Umat | Submit laporan | Sistem simpan tanpa IP/id session, kirim notifikasi ke Pastor | Laporan terkirim |
| 5 | Pastor | Menerima notifikasi "Ada laporan whistle-blower baru" | Buka dashboard, dekripsi konten | Laporan terbaca |

### Alur Pelaporan via WhatsApp
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 1 | Umat | Buka menu Whistle-Blower, tap "Lapor via WhatsApp" | Link wa.me tersembunyi di dashboard |
| 2 | Umat | Kirim pesan ke nomor khusus Pastor | Pesan langsung ke Pastor (tidak melalui sistem) |
| 3 | Pastor | Menerima pesan WhatsApp dari nomor tidak dikenal | Bisa tindak lanjut |

### Alur Tindak Lanjut oleh Pastor
| Langkah | Pelaku | Tindakan | Hasil |
|---------|--------|----------|-------|
| 1 | Pastor | Buka Dashboard → Whistle-Blower | Daftar laporan (kategori, tanggal, status) |
| 2 | Pastor | Klik laporan → lihat detail (konten didekripsi) | Isi laporan terbaca |
| 3 | Pastor | Update status: SEDANG DITINJAU / DITINDAK LANJUTI / SELESAI / TIDAK VALID | Status terupdate |
| 4 | Sistem (opsional) | Jika Pastor set status "SELESAI", notifikasi anonim ke pelapor (tanpa identitas) | Pelapor tahu status |

## Database Schema

### Tabel `whistleblower_reports` (Baru)
```sql
CREATE TABLE public.whistleblower_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori TEXT NOT NULL CHECK (kategori IN ('keuangan', 'penyalahgunaan', 'lainnya')),
    encrypted_content TEXT NOT NULL,      -- Konten terenkripsi (AES-256-GCM)
    encryption_iv TEXT NOT NULL,
    encryption_tag TEXT NOT NULL,
    status TEXT DEFAULT 'baru' CHECK (status IN ('baru', 'ditinjau', 'ditindaklanjuti', 'selesai', 'tidak_valid')),
    pastor_notes TEXT,                    -- Catatan Pastor (tidak terenkripsi, hanya untuk admin)
    -- TIDAK ada kolom: pelapor_id, ip_address, user_agent
    -- Anonimitas dijaga secara arsitektur
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hanya Pastor yang bisa SELECT (via RLS)
-- Tidak ada index pada created_at untuk mencegah timing attack
```

### RLS Policies
```sql
-- Hanya Pastor (Layer 9+) yang bisa melihat laporan
CREATE POLICY pastor_view_whistleblower ON public.whistleblower_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 9)
    );

-- Semua user (Layer 2+) bisa insert
CREATE POLICY all_insert_whistleblower ON public.whistleblower_reports
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 2)
    );
```

## Keamanan & Privasi
| Aspek | Implementasi |
|-------|-------------|
| Identitas pelapor | TIDAK disimpan (no IP, no user_id, no session) |
| Konten laporan | AES-256-GCM encryption |
| Kunci dekripsi | Hanya Pastor yang memiliki |
| Akses database | Hanya Pastor yang bisa SELECT |
| Super Admin (Layer 10) | TIDAK bisa akses isi laporan (prinsip privacy first) |
| Audit triwulanan | Pastor lakukan audit keamanan identitas pelapor |

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `WhistleblowerForm.tsx` | Form laporan anonim |
| `WhistleblowerList.tsx` | Daftar laporan (Dashboard Pastor) |
| `WhistleblowerDetail.tsx` | Detail laporan + status (Dashboard Pastor) |
| `WhistleblowerWALink.tsx` | Link wa.me tersembunyi |

## Aturan Bisnis
| Aturan | Detail |
|--------|--------|
| Akses laporan | Hanya Pastor (Layer 9+) |
| Audit triwulanan | Pastor periksa keamanan identitas pelapor |
| Status laporan | Baru → Ditinjau → Ditindaklanjuti / Selesai / Tidak Valid |
| Pelapor bisa cek status | Via halaman Whistle-Blower (tanpa login? — perlu timing attack protection) |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| Laporan palsu/fitnah | Pastor set status "Tidak Valid" |
| Pelapor ingin upload bukti file | File dienkripsi, upload via R2 dengan signed URL |
| Laporan tidak selesai dalam 30 hari | Reminder ke Pastor |
| Pastor ingin tindak lanjut ke pihak terkait | Pastor tentukan sendiri (di luar sistem) |

## Referensi Halaman
- `src/app/(pastoral)/whistle-blower/page.tsx` — Halaman Whistle-Blower