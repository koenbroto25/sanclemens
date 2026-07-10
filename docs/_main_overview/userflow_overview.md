# USERFLOW - OVERVIEW

This document provides a high-level overview of the Userflow for the Paroki Santo Klemens Digital Ecosystem. For detailed step-by-step userflows, including actors, actions, system responses, and edge cases, please refer to the modular documentation organized by pages, roles, and features in the `docs/` directory.

## Core Userflow Principles:
-   **Gate Hub as Entry Point**: After successful login, users (Layer 2+) are directed to the Gate Hub, where they select their desired portal.
-   **Role-Based Experience**: Userflows and available features are tailored to the user's assigned role (`access_layer`) and the selected portal context.
-   **Seamless Navigation**: Users can navigate between portals using an in-app `HomepageSwitcher`, maintaining a consistent session without SSO token exchange.
-   **Cross-Portal Access for Core Data**: Features like Family Data, Personal Profile, and Spiritual Companion are accessible across portals, with specific RLS policies governing data access.
-   **Integrated Communication**: Utilizes WhatsApp for OTP, notifications, and certain bot interactions.

## Key Userflows & Updates (v4.0):
-   **Onboarding & Personalized Homepage (WhatsApp OTP & Family Connection)**: New users register with WhatsApp number and OTP, followed by an option to connect with an existing family or create a new one. Account activation requires approval by the Ketua Lingkungan (KL). Homepage displays general information for guests and personalized "Umat Tersapa" features (greeting, birthday, daily spiritual note) and "Pintu Cepat" (quick actions) for logged-in users. Limited ad space appears only for guests after daily scripture.
-   **Gate Hub & Portal Navigation**: Detailed flow for selecting portals and navigating between them, including the presence of the `Gate Bot` for guidance.
-   **Portal 1: Demography to Role Dashboard**: Users first see a Parish Demography page, then can access their specific role dashboard, which now includes the Umat Search Panel for admin roles.
-   **Digital Family Card & Search/Connect**: Comprehensive flows for viewing family details, searching for and inviting family members, and managing family connections.
-   **Portal 2: Environment Homepage & KL Dashboard**: Specific flows for basic users to view environment-related information (bills, prayer schedules, requests) and for Ketua Lingkungan to manage their environment.
-   **Pastoral SOS 24/7 + Anti-Abuse System**: Detailed emergency call flow with a 4-level anti-abuse mechanism and an admin dashboard for access recovery.
-   **Wali Digital Lingkungan (WDL) Proxy Flow**: Flow for appointing WDLs and managing consent for limited proxy access to assist other parishioners.
-   **Spiritual Companion (6 Modes)**: User interactions with the AI companion for various spiritual guidance modes, emphasizing E2E encryption and human referral.
-   **KPD & KTPD (Activities with/without Fund Request)**: Comprehensive approval and reporting flows for parish activities, including multi-signature approvals for fund requests.
-   **Dana Kasih & Klemen Kerja Matching Solidaritas**: Flows for donations, requests for assistance, AI-powered matching for job placements and aid, and KL verification.
-   **Data GAKIN & 3/4 Approval**: Sensitive data management for impoverished families, including application, 3-of-4 approval process, and status changes.
-   **Admin Login & Dashboards**: Dedicated login and dashboard flows for Super Admin and portal-specific administrators, with robust authentication, RLS policies, and integrated Umat Search Panel with role-specific data access.
-   **Unified Catholic Learning Module (AI-CLM)**: 🆕 Comprehensive Catholic faith learning accessible to all users (guests and authenticated), featuring the "Penjelajah Iman" mode for deep theological exploration, interactive learning paths, ethical reasoning scenarios, and a public `/learn-catholic` page for guests.
-   **App Overview Q&A**: 🆕 AI-powered explanation system that clearly describes the entire application's benefits and features for new users, with special emphasis on charity features (Dana Kasih, Dana Duka, SOS, Tiga Pintu Kasih) and Digital Vault.
-   **User Settings Hub (8 Tabs, incl. Location & Address Management)**: 🆕 Centralized settings page accessible from all portals. Flow: User clicks "Settings" in navigation → Halaman dengan sidebar 8 tab (Profil, Keluarga, Keamanan, Notifikasi, AI & API Keys, Portal, Data, Bantuan) → Setiap tab memiliki form dan preferensi masing-masing, termasuk "Lokasi & Alamat Rumah" untuk berbagi lokasi dan mengajukan perubahan alamat.
-   **API Key Management (Self-Service)**: 🆕 Flow untuk user menambahkan API key pribadi. User buka Settings > AI & API Keys → Input key dari OpenRouter/Gemini → Klik Validasi → Key tersimpan terenkripsi → AI bot menggunakan key pribadi user (prioritas tinggi).
-   **Ganti Nomor WhatsApp (Dual OTP)**: 🆕 Flow keamanan untuk mengganti nomor WA. User buka Settings > Keamanan → Input nomor baru → OTP ke nomor baru untuk verifikasi → OTP ke nomor lama untuk konfirmasi → Nomor berhasil diganti → Notifikasi ke nomor lama.
-   **Admin API Key Pool Management**: 🆕 Flow admin (super_admin/operator_ict) untuk mengelola pool API key. Admin buka Admin > Settings > API Keys → Lihat statistik pool (total, aktif, habis) → Tambah key baru (provider + key + assign ke bot) → Key tersimpan terenkripsi → Sistem otomatis rotasi key.
-   **Bot Pencarian Data Umat (Role-Based Access)**: 🆕 Bot (pengurus, sekretariat, sakramen, dana kasih, marketplace, ojek solidaritas, admin portal 3) dapat menggunakan tool `search_umat` untuk mencari data umat sesuai scope role dan wilayah tugas. Audit log wajib. Bot publik dan Companion rohani tidak boleh mencari data umat. Hasil pencarian dibatasi sesuai RLS dan tidak menampilkan data sensitif berlebihan.

For further details on specific user journeys and system interactions, please navigate to the respective modular documents in the `docs/` directory.