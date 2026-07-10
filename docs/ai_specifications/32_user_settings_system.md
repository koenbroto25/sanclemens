# BAB XXXII — User Settings System: Comprehensive Configuration Hub

## 32.1 Overview

Halaman User Settings adalah pusat kendali bagi setiap umat dalam ekosistem digital paroki. Mengintegrasikan profil pribadi, keluarga, keamanan, notifikasi, AI/API keys, portal roles, dan privasi dalam satu antarmuka terpadu.

### Lokasi: `app/(dashboard)/settings/page.tsx`
### Akses: Semua user terautentikasi (Layer 1+)

---

## 32.2 Navigation Structure

```
[SETTINGS] — Sidebar Tab Navigation
├─ 📋 Profil Pribadi       — Personal profile & AI preferences
├─ 👨‍👩‍👧‍👦 Keluarga            — Family management & invitations
├─ 🔐 Keamanan             — Change WA number, PIN, password
├─ 🔔 Notifikasi           — Notification categories & channels
├─ 🤖 AI & API Keys        — API key management (BAB XXXI)
├─ 🏠 Portal Saya          — Role & access status across portals
├─ 📊 Data Saya            — Privacy, data export, account deletion
└─ ❓ Bantuan              — Help center & support
```

---

## 32.3 Database Schema

### 32.3.1 User Settings Table

```sql
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
    
    -- Notification preferences (JSONB for flexibility)
    notification_settings JSONB NOT NULL DEFAULT '{
        "channels": {
            "whatsapp": true,
            "in_app": true,
            "email": false
        },
        "quiet_hours": {
            "start": "21:00",
            "end": "06:00",
            "override_sos": true
        },
        "categories": {
            "emergency": {"whatsapp": true, "in_app": true, "mandatory": true},
            "sacraments": {"whatsapp": true, "in_app": true, "mandatory": true},
            "finance": {"whatsapp": true, "in_app": true, "mandatory": true},
            "account": {"whatsapp": true, "in_app": true, "mandatory": true},
            "parish_info": {"whatsapp": false, "in_app": true},
            "activities": {"whatsapp": false, "in_app": true},
            "marketplace": {"whatsapp": false, "in_app": true},
            "ai_companion": {"whatsapp": true, "in_app": true},
            "daily_prayer": {"whatsapp": true, "in_app": false}
        }
    }',
    
    -- Privacy preferences
    privacy_settings JSONB NOT NULL DEFAULT '{
        "ai_remember_preferences": true,
        "ai_matching_consent": false,
        "allow_partner_notifications": false,
        "show_in_lingkungan_directory": true
    }',
    
    -- AI Communication preferences
    ai_preferences JSONB NOT NULL DEFAULT '{
        "preferred_address": "bapak",
        "bot_verbosity": "normal",
        "preferred_language": "id"
    }',
    
    -- Session preferences
    session_timeout_minutes INTEGER DEFAULT 30,
    default_notification_channel VARCHAR(20) DEFAULT 'whatsapp',
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### 32.3.2 Phone Change Log Table

```sql
CREATE TABLE public.phone_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    old_phone VARCHAR(20) NOT NULL,
    new_phone VARCHAR(20) NOT NULL,
    verified_old_otp BOOLEAN DEFAULT FALSE,
    verified_new_otp BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

---

## 32.4 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/user/settings` | Get all user settings |
| PATCH | `/api/user/settings` | Update general settings |
| PATCH | `/api/user/profile` | Update personal profile |
| POST | `/api/user/change-phone/initiate` | Start phone change (send OTP to new) |
| POST | `/api/user/change-phone/verify-old` | Verify OTP on old number |
| POST | `/api/user/change-phone/verify-new` | Verify OTP on new number |
| POST | `/api/user/change-phone/confirm` | Complete phone change |
| GET | `/api/user/family` | Get family data |
| POST | `/api/user/family/invite` | Send family invitation |
| DELETE | `/api/user/family/member` | Remove family member |
| GET | `/api/user/notifications` | Get notification settings |
| PATCH | `/api/user/notifications` | Update notification preferences |
| POST | `/api/user/export-data` | Request data export |
| DELETE | `/api/user/account` | Request account deletion |
| GET | `/api/user/roles` | Get user's roles across portals |

---

## 32.5 Tab Specifications

### 32.5.1 Profil Pribadi

**Components:**
- `ProfileForm` — Edit nama, tanggal lahir, alamat
- `AIPreferenceSelector` — Cara disapa, panjang jawaban, bahasa
- `ProfilePhotoUpload` — Foto profil (terintegrasi dengan Vault Digital)

**Data Sources:**
- `public.profiles` — Nama, alamat, kontak
- `public.ai_user_profiles` — Preferensi AI
- `public.families` — Nama keluarga & role

### 32.5.2 Keluarga

**Components:**
- `FamilyCard` — Menampilkan kartu keluarga dengan anggota
- `FamilyMemberRow` — Setiap anggota dengan status
- `InviteFamilyModal` — Modal untuk mengundang anggota baru
- `WDLSettings` — Wali Digital proxy settings

**Flow Undangan:**
1. Kepala keluarga klik "Tambah Anggota"
2. Input: Nama + Nomor WA calon anggota
3. Sistem generate kode undangan 6 digit
4. Kirim via WA: "Anda diundang bergabung ke Keluarga [Nama]"
5. Calon anggota buka app, input kode undangan
6. Terverifikasi → anggota otomatis terdaftar di keluarga
7. Notifikasi ke kepala keluarga: "Anggota baru telah bergabung ✅"

### 32.5.3 Keamanan

**Components:**
- `PhoneNumberSection` — Tampilkan + ganti nomor WA
- `ChangePhoneFlow` — Multi-step wizard
  - Step 1: Input nomor baru
  - Step 2: OTP ke nomor baru (verifikasi)
  - Step 3: OTP ke nomor lama (konfirmasi)
  - Step 4: Selesai
- `PINSetup` — Atur PIN transaksi & companion memory
- `LoginHistory` — Riwayat login (device, IP, timestamp)

**Keamanan:**
- Ganti WA: OTP di kedua nomor (lama + baru)
- PIN transaksi: untuk konfirmasi donasi/transaksi
- PIN companion: untuk akses catatan rohani E2E

### 32.5.4 Notifikasi

**Components:**
- `NotificationCategoryCard` — Tiap kategori notifikasi
- `ChannelSelector` — WA/In-App/Email toggle per kategori
- `QuietHoursSelector` — Pengaturan jam tenang
- `NotificationPreview` — Preview notifikasi

**Smart Features:**
- Kategori dengan label "WAJIB" (SOS, Sakramen, Keuangan, Akun) — tidak bisa dimatikan
- Alasan transparan: "Demi keselamatan dan kepentingan hukum"
- "Ringkasan Harian" mode → notifikasi realtime dimatikan, dikirim jam 19:00
- "Mode Malam" → notifikasi non-SOS ditunda hingga pagi

### 32.5.5 AI & API Keys

**Components:**
- `APIKeyInput` — Input + validasi API key
- `APIKeyStatus` — Tampilkan status key (format, expiry)
- `APIKeyGuideModal` — Panduan step-by-step
- `AIProviderSelector` — Pilih provider (OpenRouter/Gemini)

**Panduan OpenRouter `openrouter/free`**:
- Model `openrouter/free` otomatis memilih model gratis terbaik yang tersedia.
- Tidak perlu menentukan model tertentu seperti `llama-3.1-8b-instruct`.

**Integrasi dengan BAB XXXI:**
- Gunakan `POST /api/user/api-keys` untuk menyimpan
- Gunakan `PUT /api/user/api-keys` untuk validasi
- Tampilkan status: "Menggunakan API key pribadi" vs "Menggunakan kuota bersama"

### 32.5.6 Portal Saya

**Components:**
- `PortalRoleCard` — Tiap portal dengan role & status
- `RolePermissionsList` — Daftar permission untuk role
- `RequestRoleChangeButton` — Ajukan perubahan role

**Data Source:**
- `public.user_roles` — Role assignments
- `public.roles` — Role definitions with access layers
- `public.profiles.access_layer` — Current access level

### 32.5.7 Data Saya

**Components:**
- `DataSummaryCard` — Ringkasan data yang tersimpan
- `ExportDataButton` — Request data export
- `DeleteAccountButton` — Request account deletion
- `PrivacyToggle` — AI consent toggles

**Compliance:**
- Export: JSON + CSV + PDF dalam 24 jam
- Delete: Data sakramen tetap disimpan (KHK Kanon 535 §1)
- Audit trail: Semua permintaan export/delete tercatat

### 32.5.8 Bantuan

**Components:**
- `FAQAccordion` — Pertanyaan umum
- `SupportChatButton` — Chat dengan Bot 2
- `BugReportForm` — Form laporan bug
- `FeatureRequestForm` — Form saran fitur

---

## 32.6 Implementation Checklist

### Phase 1: Database & API (Immediate)
- [ ] Create `user_settings` table (migration 053)
- [ ] Create `phone_change_logs` table
- [ ] Create settings API endpoints
- [ ] Create profile update endpoint

### Phase 2: Core UI (Week 1)
- [ ] Build settings layout (sidebar + tab navigation)
- [ ] Profile tab (read + edit)
- [ ] Family tab (view + invite)
- [ ] Security tab (change phone flow)

### Phase 3: Advanced Features (Week 2)
- [ ] Notification preferences tab
- [ ] AI & API Keys tab (integrate with BAB XXXI)
- [ ] Portal roles tab
- [ ] Data & Privacy tab
- [ ] Help center tab

### Phase 4: Polish (Week 3)
- [ ] Notification summary mode
- [ ] Smart suggestions
- [ ] Mobile responsiveness
- [ ] Accessibility audit

---
**END OF CHAPTER 32**