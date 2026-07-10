## BAB XVI — Confidence Scoring & Verifikasi Manusia {#bab-xvi}

### 16.1 Faktor Confidence

| Faktor | Confidence Naik | Confidence Turun |
|---|---|---|
| Frekuensi | Keluhan diulang 2-3x/7 hari | Hanya sekali |
| Konsistensi | Cerita detail & spesifik | Cerita berubah-ubah |
| Emosi | Nada cemas/sedih wajar | Drama berlebihan |
| Riwayat | Tidak ada fake report | Pernah fake |
| Verifikasi KL | KL konfirmasi "benar butuh" | KL bilang "tidak butuh" |

### 16.2 Ambang Batas

| Confidence | Tindakan |
|---|---|
| ≥ 0.8 | ✅ Langsung tawarkan solusi matching |
| 0.5 - 0.79 | ⚠️ Tawarkan bantuan + notifikasi KL untuk verifikasi |
| < 0.5 | ❌ Catat sebagai keluhan ringan. Respon empati tanpa matching |

### 16.3 Intervensi Manusia

```
Level 1 — AI Detect: Confidence < 0.5
  → Respon empati biasa
  → Tersimpan di umat_needs, tidak ada notifikasi

Level 2 — KL Verify: Confidence 0.5-0.79
  → Respon + tawaran bantuan
  → Notifikasi WA ke KL: "[Nama] butuh [bantuan]. Benar? [Konfirmasi] [Tolak]"
  → Jika KL tolak → confidence turun, tercatat

Level 3 — Pastoral: > 2x fake report
  → Laporkan ke Pastor + Wakil DPP
  → Fitur matching untuk user ini dinonaktifkan sementara
  → Bot 3 (Companion) tetap aktif
```

---
