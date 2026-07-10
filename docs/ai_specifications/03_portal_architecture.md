## BAB III — Arsitektur Tiga Portal untuk AI {#bab-iii}

### 3.1 Peta AI per Portal

| Portal | Bot Aktif | Layer | Fungsi Utama |
|---|---|---|---|
| **Portal 1 — Paroki** | Bot 1 (Info Publik) | 0 | FAQ publik, jadwal misa |
| | Bot 2 (CS Sekretariat) | 2+ | Administrasi & prosedur |
| | Bot 3 (Companion) | 2+ | Pendampingan rohani |
| | Bot 4 (Asisten DPP) | 5+ | Bantuan pengurus paroki |
| | Bot 6 (Klemen Keluarga) | 2+ | Manajemen keluarga |
| | Bot 7 (Klemen Kerja) | 2+ | Matching solidaritas |
| **Portal 2 — Lingkungan** | Bot 3 (Companion) | 2+ | Pendampingan rohani |
| | Bot 5 (Lingkungan) | 4 KL | Koordinasi lingkungan |
| | Bot 6 (Klemen Keluarga) | 2+ | Manajemen keluarga |
| | Bot 7 (Klemen Kerja) | 2+ | Matching solidaritas |
| **Portal 3 — Pasar Kasih** | Bot 3 (Companion) | 2+ | Pendampingan rohani |
| | Bot 7 (Klemen Kerja) | 2+ | Matching solidaritas |
| **Gate Hub** | Gate Bot | 2+ | Panduan portal & fitur |

### 3.2 Konteks Portal dalam Prompt

Setiap bot menerima konteks portal aktif:

```typescript
interface AIRequestContext {
    homepage_context: 'paroki' | 'lingkungan' | 'marketplace' | 'gate-hub'
    user_layer: number
    user_id: string
    lingkungan_id?: string
    marketplace_role?: string
    family_id?: string
    current_path: string
}
```

### 3.3 Bot per Role di Tiga Portal

| Layer | Portal 1 | Portal 2 | Portal 3 |
|---|---|---|---|
| 0 (publik) | Bot 1 | — | — |
| 2 (umat) | Bot 1,2,3,4,6,7 | Bot 3,5,6,7 | Bot 3,7 |
| 4 (KL) | Bot 2,3,4,6,7 | Bot 3,5,6,7 | Bot 3,7 |
| 5+ (sekretaris) | Bot 2,3,4,6,7 | Bot 3,5,6,7 | Bot 3,7 |
| 9 (pastor) | Bot 3,4,6,7 | Bot 3,6,7 | Bot 3,7 |

---
