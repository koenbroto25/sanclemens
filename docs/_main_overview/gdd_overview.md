# GRAND DESIGN DOCUMENT - OVERVIEW

This document provides a high-level overview of the Paroki Santo Klemens Digital Ecosystem. For detailed technical specifications, architecture, and implementation details, please refer to the modular documentation organized by pages, roles, and features in the `docs/` directory.

## Core Concepts:
- **Three Portals & Gate Hub**: The ecosystem consists of a central Gate Hub after login, leading to three distinct portals: Portal 1 (Paroki), Portal 2 (Lingkungan), and Portal 3 (Pasar Kasih).
- **Single Monolith Architecture**: All portals and the public website are unified under a single Next.js application, sharing one domain (`sanclemens.com`) and a single Supabase instance.
- **WhatsApp OTP**: User authentication primarily uses WhatsApp numbers and OTP, replacing email-based verification.
- **Cloudflare R2 for Storage**: All file storage is handled by Cloudflare R2, integrated with `sharp` for image compression.
- **Error Check Engine & Robust Backup**: A three-layered error checking system and a two-purpose phased backup system (local VPS + Cloudflare R2) are in place.
- **AI Integration**: AI companion system with Theological Access Law (5-tier source hierarchy), dual-provider LLM integration (OpenRouter + Gemini) with zero-cost API key management, and comprehensive bot system for all 3 portals.
- **Theological Source Framework**: 5-tier hierarchy for Catholic theological references (Magisterium → Church Fathers → Canon Law → Approved Writers → Local Pastoral) enforced via Theological Access Law.
- **API Key Management**: Dual-provider strategy (OpenRouter GLM-4.5-Air unlimited + Google Gemini Flash 2.5 1,500/day) with shared admin pool and optional personal keys for zero-cost AI operation.
- **User Settings Hub**: Centralized 8-tab settings page (Profil, Keluarga, Keamanan, Notifikasi, AI & API Keys, Portal, Data, Bantuan) for all user preferences.
- **Migration 051-053**: Applied database migrations for API key management (tables, encryption) and user settings system.
- **Role-Based Access**: Access to features and data is strictly controlled by user roles and access layers. Roles are categorized into Admin, Portal 1 (DPP), Portal 2 (Lingkungan), and Portal 3 (Marketplace) roles.

## Key Features:
- **Digital Family Card & Family Connection**: Management of family data, invitations, and connections.
- **GAKIN Data & 3/4 Approval Flow**: Sensitive data for impoverished families with a multi-stakeholder approval process.
- **SOS Anti-Abuse System**: A progressive system to prevent misuse of emergency pastoral calls.
- **Dual-Ledger Financial Engine**: A robust financial tracking system with auditing capabilities.
- **Whistle-Blower System**: Anonymous reporting mechanism with end-to-end encryption.
- **Admin Dashboards**: Dedicated dashboards for Super Admin and various Portal-specific administrators.
- **Encrypted Pastoral Letters**: ✅ Implemented (API, Frontend, Docs). End-to-end encrypted communication between Pastor and parishioners.
- **Daily Elderly Check**: ✅ Implemented (API, Frontend, Docs). Automated daily safety check for elderly parishioners with escalation workflow.
- **KPD & KTPD Management**: ✅ Implemented (API, Docs). Comprehensive activity approval and reporting system for parish activities.
- **Dana Kasih Escrow**: ✅ Implemented (API, Docs). Secure donation system via Xendit with escrow mechanism and Invisible Grace principle.
- **3 Doors of Charity**: ✅ Implemented (Docs). Structured aid system (SOS, Kasih, Donasi) for transparent assistance distribution.
- **Automatic Financial Audit**: ✅ Implemented (API, Frontend, Docs). Real-time anomaly detection and automated financial reconciliation reports.
- **Digital Bereavement Fund**: ✅ Implemented (API, Frontend, Docs). Digital management of condolence fund collection and disbursement.
- **Internal Ojek**: ✅ Implemented (API, Frontend, Docs). Community-based delivery service for marketplace orders within the parish.
- **Local Ads**: ✅ Implemented (Docs). Internal advertising system for parishioners' businesses and UMKM.
- **RK-3 Management**: ✅ Implemented (API, Frontend, Docs). Special account for digital economy and ICT operational expenses.
- **Klemen Kerja & Solidarity Matching**: ✅ Implemented (API, Frontend, Docs). AI-powered matching system for job vacancies, labor, and donations.
- **Digital Vault OCR**: ⏳ Implemented (Docs - needs API/Backend verification). Automated OCR for scanned documents in Digital Vault.
- **Companion PWA**: ⏳ Implemented (Docs - needs Frontend/API verification). Dedicated PWA for Companion Rohani.
- **SOP Sakramen (Perkawinan, Baptis, Krisma)**: ⏳ Implemented (Docs). Digital management of sacrament registration, including data pre-check, KL approval, and electronic letter to Sekretaris 1.
- **Input Kolekte (Blind Dual-Entry)**: ⏳ Implemented (Docs). Secure input of collections by two different Treasurers for enhanced accuracy and transparency.
- **Tautan Media Sosial**: ⏳ Implemented (Docs). Integration of official social media links across the ecosystem.
- **Sistem Iklan Dinamis**: ⏳ Implemented (Docs). Dynamic ad management and display in strategic locations (Homepage, Gate Hub, Marketplace).
- **Alur Kelengkapan Data Umat Baru Pasca-Approval**: ⏳ Implemented (Docs). Redirect to a dedicated page for new members to complete profile data and upload documents after KL/Admin approval.
- **Sistem Bot Asisten Terintegrasi**: ⏳ Implemented (Docs). Eight integrated bots, including Admin Bots, for various functions with AI Engine integration.
- **Admin Dashboards (Portal 1, 2, 3 & Super Admin)**: ✅ Implemented (API, Frontend, Docs). Dedicated dashboards with comprehensive management tools and integrated bot support.
- **Unified Catholic Learning Module (AI-CLM)**: 🆕 Comprehensive Catholic faith learning accessible to all users (guests and authenticated), featuring multi-perspective dogma exploration (KGK, Biblical, historical, philosophical), interactive learning paths, ethical reasoning scenarios, and customizable depth.
- **Enhanced Charity Features**: 🆕 Prominent features including Dana Kasih (solidarity fund), Dana Duka (grief support fund), SOS Anti-Abuse System with immediate pastoral notification, and Tiga Pintu Kasih (Three Doors of Charity) for transparent assistance distribution.
- **App Overview Q&A**: 🆕 AI-powered explanation system that clearly describes the entire application's benefits, features, and value proposition for new users, with special emphasis on charity features and Digital Vault.

## Technical Stack Highlights:
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand, TanStack Query.
- **Backend**: Next.js API Routes, Supabase Edge Functions (for specific tasks).
- **Database**: Supabase (PostgreSQL 15+) as primary DB with RLS.
- **Storage**: Cloudflare R2 with `sharp` for image processing.
- **Auth**: Supabase Auth with WhatsApp OTP.
- **Deployment**: Vercel Free (initial soft deploy) transitioning to VPS 2GB RAM + Coolify.

For further details on any of these topics, please navigate to the respective modular documents in the `docs/` directory.