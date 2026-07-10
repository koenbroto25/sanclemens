# MASTERPLAN - OVERVIEW

This document provides a high-level overview of the Masterplan for the Paroki Santo Klemens Digital Ecosystem. For detailed development plans, sub-phases, and implementation tasks, please refer to the modular documentation organized by pages, roles, and features in the `docs/` directory.

## Core Directives:
-   **Primary Guide**: This Masterplan serves as the main and sole reference for developers' work order.
-   **Continuous Updates**: The plan is continuously updated to align with the GDD Developer, AI Engineer Specification, Userflow, and UI/UX Design System documents.
-   **Phased Deployment**: Initial soft deployment on Vercel Free + Supabase Free Tier + Dual Ping Guard, transitioning to VPS 2GB RAM + Coolify for full production.
-   **Sequential Execution**: All phases and sub-phases must be executed in sequential order.

## Key Technical Directives:
-   **Supabase CLI**: All database changes must use Supabase CLI for migrations. Direct schema changes via the Dashboard are prohibited.
-   **Design System Compliance**: Strict adherence to UI/UX Design System v3.0 for all frontend implementations, including specific palettes, components, and icons.
-   **Single Monolith Architecture**: The entire frontend operates as a single Next.js application, handling all interfaces (public landing page, Gate Hub, Portal 1, Portal 2, Portal 3) within one instance and one domain (`sanclemens.com`).
-   **Monorepo Structure**: The project uses a monorepo structure with `apps/member-portal` as the primary frontend directory and shared `packages/`.
-   **Environment Variables**: All configurations are managed via environment variables, with specific updates for WhatsApp OTP, Cloudflare R2, and deployment phases.

## Current Project Status Overview (as of 17 Juni 2026):

| Fase | Nama | Status | Keterangan |
|------|------|--------|------------|
| **Fase 0** | Fondasi & Setup | ✅ Selesai | All setup steps (monorepo, Supabase, Vercel, Cloudflare R2, CI/CD) are configured and tested. |
| **Fase 1** | Foundation & Kehadiran Harian | ✅ Selesai | WhatsApp OTP, Gate Hub, Portal 1-3, Keluarga, Data GAKIN, SOS, Error Check Engine, Backup, Dual Ping Guard, Homepage Personalization (Umat Tersapa), dan Location & Address Management features are implemented in the development environment. |
| **Fase 2** | Inklusivitas & Rohani | ✅ Selesai | ✅ Migration 046 ter-push. ✅ API Routes (pastoral-letter, morning-check, kegiatan/kpd). ✅ Frontend pages: surat-pastoral, lansia. ✅ Dokumen fitur & page docs lengkap. |
| **Fase 3** | Solidaritas & Keuangan | ⏳ Sedang Dikerjakan | ✅ Migration 047 ter-push. ✅ API Routes (whistleblower, dana-duka, dana-duka/approve). ✅ Frontend page: whistle-blower. ✅ Dokumen fitur & page docs lengkap. |
| **Fase 4** | Ekonomi Internal | ⏳ Sedang Dikerjakan | ✅ Migration 048 ter-push (ojek, RK-3). ✅ API Routes (ojek/register, ojek/order, audit/anomalies). ✅ Frontend pages: ojek-internal, rk3-dashboard. ✅ Dokumen fitur & page docs lengkap. |
| **Fase 5** | Kemandirian & Optimasi | ✅ Selesai | No additional actions required. |
| **Fase 6** | AI & Matching Solidaritas | ⏳ Sedang Dikerjakan | ✅ Migration 048 ter-push (lowongan, tenaga kerja, donatur, umat_needs). ✅ API Routes (klemen-kerja/lowongan, klemen-kerja/lamar). ✅ Frontend page: klemen-kerja. ✅ Dokumen fitur & page docs lengkap. |
| **Fase 7** | Sistem Login & Dashboard Admin | ✅ Selesai | ✅ Migration 049 ter-push (RLS, views, functions). ✅ API Routes super-admin sudah ada. ✅ Frontend pages admin (termasuk integrasi Umat Search Feature) sudah ada. |

## Migration Status (4 migration baru ter-push):

| Migration | Isi | Tanggal |
|-----------|-----|---------|
| 046 | `surat_pastoral`, `morning_check_logs`, `kegiatan_approvals` | ✅ 17 Jun 2026 |
| 047 | `anomaly_flags`, `dana_duka_pencairan`, `whistleblower_reports`, `laporan_templates` | ✅ 17 Jun 2026 |
| 048 | `ojek_drivers`, `ojek_orders`, `rk3_transactions`, `lowongan_kerja`, `tenaga_kerja`, `donatur_potensial`, `umat_needs` | ✅ 17 Jun 2026 |
| 049 | RLS admin policies, functions approve_admin_registration, views admin_pending_registrations & admin_system_stats | ✅ 17 Jun 2026 |

For further details on any of these topics, please navigate to the respective modular documents in the `docs/` directory.