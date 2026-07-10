## APPENDIX C — Variabel Template per Bot {#appendix-c}

Semua variabel `{{...}}` dalam system prompt diisi oleh middleware sebelum dikirim ke model. Berikut daftar lengkap dan sumbernya:

### Variabel Global (Semua Bot)

| Variabel | Sumber | Keterangan |
|---|---|---|
| `{{user_name}}` | `ai_user_profiles.preferred_name` atau `profiles.full_name` | Nama panggilan |
| `{{user_layer}}` | JWT claim | Layer akses |
| `{{lingkungan_name}}` | `lingkungan.name` via `profiles.lingkungan_id` | Nama lingkungan |
| `{{current_date}}` | Server time (WIB) | Tanggal hari ini |
| `{{liturgical_context.*}}` | `liturgical_calendar_cache` | Konteks liturgi |

### Variabel Bot 3 (Companion)

| Variabel | Sumber | Keterangan |
|---|---|---|
| `{{family_name}}` | `families.name` | Nama keluarga |
| `{{family_role}}` | `family_members.role` | Role dalam keluarga |
| `{{spiritual_journey_summary}}` | `companion.spiritual_memory` (didekripsi client) | Memory rohani |
| `{{active_needs}}` | `umat_needs.needs` (key saja, bukan detail) | Kebutuhan aktif |
| `{{emotional_signal_last_session}}` | `ai_user_profiles` | Sinyal emosi sesi lalu |

### Variabel Bot 4 (DPP)

| Variabel | Sumber | Keterangan |
|---|---|---|
| `{{user_role}}` | `profiles.role_label` | Label role pengurus |
| `{{data_gakin_count}}` | Query `data_gakin` scope layer | Jumlah data GAKIN dalam scope |
| `{{pending_approvals}}` | `gakin_approvals WHERE status='pending'` | Approval menunggu |

### Variabel Bot 6 (Keluarga)

| Variabel | Sumber | Keterangan |
|---|---|---|
| `{{family_name}}` | `families.name` | Nama keluarga |
| `{{user_family_role}}` | `family_members.role` | Role dalam keluarga |
| `{{family_members_count}}` | COUNT dari `family_members` | Jumlah anggota |
| `{{family_members_list}}` | `profiles.full_name` anggota | Nama anggota terdaftar |
| `{{family_members_unregistered}}` | `family_invitations WHERE status='pending'` | Undangan belum diterima |

### Variabel Bot 7 (Kerja)

| Variabel | Sumber | Keterangan |
|---|---|---|
| `{{user_skills}}` | `tenaga_kerja.keahlian` | Keahlian terdaftar |
| `{{user_worker_status}}` | EXISTS di `tenaga_kerja` | Status pendaftaran |
| `{{open_lowongan_count}}` | COUNT `lowongan_kerja WHERE status='open' AND expires_at > NOW()` | Lowongan aktif |
| `{{available_workers_count}}` | COUNT `tenaga_kerja WHERE tersedia=true` | Tenaga tersedia |
| `{{active_needs_summary}}` | `umat_needs.needs` (ringkasan) | Kebutuhan aktif user |

### Variabel Gate Bot

| Variabel | Sumber | Keterangan |
|---|---|---|
| `{{account_age_days}}` | `ai_user_profiles.account_age_days` | Usia akun dalam hari |
| `{{last_active_days_ago}}` | Hitung dari `last_bot_interaction` | Lama tidak aktif |
| `{{visited_portals}}` | `ai_user_profiles.visited_portals` | Portal yang pernah dikunjungi |

---

*AI Engineer Specification Rev 1.1 — Ekosistem Digital Paroki ST. Klemens Sepinggan — Juni 2026*

*Dokumen ini adalah versi mandiri lengkap yang mengintegrasikan seluruh konten v4.0 dan enhancement dari rev1.0. Tidak diperlukan referensi ke dokumen lain untuk memahami spesifikasi ini secara menyeluruh.*
