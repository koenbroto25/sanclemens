# Automatic Financial Audit — Audit Keuangan Otomatis

## Informasi Dokumen
- **Fase:** 3 — Solidaritas & Keuangan
- **Status:** ⬜ Belum Dimulai
- **Sub-Fase:** 3.3 — Audit Keuangan Otomatis
- **Referensi Utama:**
  - [GDD v4.0] Bab XV "Security Implementation" — keamanan data keuangan
  - [GDD v4.0] Bab III.4 "Edge Functions" — fungsi `anomaly-detector` dan `report-generator`
  - [UF v4.0] Bagian 16 "Audit Internal Digital"
  - [DS v3.0] Bagian 8.10 "AnomalyAlertBanner" — komponen UI banner peringatan anomali

## Deskripsi
Sistem audit keuangan otomatis yang mendeteksi anomali, merekonsiliasi saldo, dan menghasilkan laporan keuangan secara otomatis. Tim Audit menerima laporan langsung dari sistem — tidak melalui Bendahara — untuk menjaga independensi audit.

## Tujuan
- Mendeteksi anomali keuangan secara otomatis dan real-time
- Menjaga integritas data keuangan paroki
- Menyediakan laporan audit yang independen dan terpercaya
- Memenuhi prinsip transparansi dan akuntabilitas

## Jenis Deteksi Anomali

| Tingkat | Jenis Anomali | Respon Sistem | Notifikasi |
|---------|--------------|---------------|------------|
| **KRITIS** | Selisih input kolekte dual-entry | Blokir laporan, flag | WhatsApp ke Pastor + WK I + Tim Audit |
| **KRITIS** | Transaksi tanpa approval | Transaksi dibekukan otomatis | Notifikasi ke Pastor + WK + Tim Audit |
| **KRITIS** | Perubahan data rekening bank | Blokir perubahan | Konfirmasi Pastor + Keuskupan |
| **KRITIS** | Balance negatif | Blokir transaksi | Notifikasi segera |
| **SEDANG** | LPJ terlambat > 14 hari | Blokir pengajuan baru | Notifikasi ke bidang terkait |
| **PERINGATAN** | Storage > 800 MB | — | Notifikasi ke Tim ICT |

## Alur Utama

### Alur Deteksi Anomali
| Langkah | Pelaksana | Tindakan | Hasil |
|---------|-----------|----------|-------|
| 1 | Sistem | Cron malam: jalankan anomaly-detector | Semua transaksi diperiksa |
| 2 | Sistem | Jika ditemukan anomali → tentukan tingkat (KRITIS/SEDANG/PERINGATAN) | Anomali terklasifikasi |
| 3 | Sistem | Jika KRITIS: blokir transaksi/laporan terkait, kirim alert | Tindakan pencegahan |
| 4 | Sistem | Kirim notifikasi ke pihak terkait sesuai tabel di atas | Pihak terkait tahu |
| 5 | Tim Audit | Buka Dashboard Audit → lihat daftar anomali | Investigasi dimulai |

### Alur Rekonsiliasi Bulanan
| Langkah | Pelaksana | Tindakan | Hasil |
|---------|-----------|----------|-------|
| 1 | Sistem | Akhir bulan: bandingkan saldo per rekening dengan total transaksi | Laporan rekonsiliasi |
| 2 | Sistem | Jika cocok → status OK. Jika tidak → flag anomali + notifikasi | Rekonsiliasi selesai |
| 3 | Tim Audit | Review laporan rekonsiliasi | Tindak lanjut jika perlu |

### Alur Laporan Audit
| Frekuensi | Isi Laporan | Penerima |
|-----------|-------------|----------|
| Bulanan | Ringkasan transaksi, anomali yang terdeteksi, status rekonsiliasi | Pastor Paroki |
| Dalam 48 jam (anomali kritis) | Detail anomali, tindakan yang diambil | Pastor Paroki + WK |
| Triwulanan | Audit komprehensif | Pastor + salinan ke Vikep Wilayah Pantai |

## Database Schema

### Tabel `audit_log` (Existing)
```sql
CREATE TABLE public.audit_log (
    id BIGSERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES public.profiles(id),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);
```

### Tabel `anomaly_flags` (Baru)
```sql
CREATE TABLE public.anomaly_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL CHECK (severity IN ('kritis', 'sedang', 'peringatan')),
    tipe_anomali TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    reference_id UUID,                    -- ID transaksi/rekening terkait
    reference_table TEXT,
    status TEXT DEFAULT 'terbuka' CHECK (status IN ('terbuka', 'investigasi', 'selesai', 'false_positive')),
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Komponen UI
| Komponen | Deskripsi |
|----------|-----------|
| `AnomalyAlertBanner` (DS §8.10) | Banner peringatan anomali di dashboard |
| `AuditDashboard.tsx` | Dashboard audit utama (read-only) |
| `AnomalyDetailModal.tsx` | Modal detail anomali |
| `RekonsiliasiCard.tsx` | Kartu status rekonsiliasi bulanan |

## Dashboard Audit
**Akses:** Layer 8 (Tim Audit) — read-only
**Tidak bisa:** Mengubah data keuangan

## Aturan Bisnis
| Aturan | Detail |
|--------|--------|
| Tim Audit independen | Menerima laporan LANGSUNG dari sistem, tidak melalui Bendahara |
| Frekuensi audit | Bulanan (rutin), 48 jam (anomali kritis) |
| Akses dashboard | Read-only — tidak bisa mengubah data |
| Laporan ke Pastor | Dikirim langsung; salinan ke Vikep jika diminta |

## Edge Cases
| Kondisi | Penanganan |
|---------|-----------|
| False positive anomali | Tim Audit set status `false_positive`, beri catatan |
| Anomali tidak selesai dalam 7 hari | Eskalasi otomatis ke Pastor |
| Tim Audit tidak merespon anomali kritis | Eskalasi ke Pastor dalam 24 jam |
| Data audit perlu diarsipkan | Retensi sesuai kebijakan arsip paroki |

## Referensi Halaman
- `src/app/(pastoral)/audit/page.tsx` — Dashboard Audit (Layer 8)