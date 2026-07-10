# Backend Schema Overview

This document provides a high-level overview of the core database schemas and tables used in the Paroki Santo Klemens Digital Ecosystem, based on the `project_backend_snapshot.md` as of 2026-06-17. It omits full SQL definitions for brevity, focusing on entities and their relationships.

## Public Schema

### 1. Core User & Parish Management

*   **`public.parish_profile`**: Stores general information about the parish itself (name, address, diocese, contact).
*   **`public.lingkungan`**: Represents "lingkungan" (neighborhood/community units) within the parish.
*   **`public.wilayah`**: Represents "wilayah" (larger geographical areas, groups of lingkungan).
*   **`public.families`**: Stores family unit data, including address, location, and references to `lingkungan` and `wilayah`.
*   **`public.roles`**: Defines various digital roles within the system (e.g., `super_admin`, `pastor`, `umat`, `ketua_lingkungan`) with associated `access_layer`.
*   **`public.profiles`**: Extends `auth.users` with detailed user profiles (full name, baptism name, NIK, contact, family/lingkungan associations, digital role, pastoral notes, health conditions). Includes triggers for auto-setting `is_lansia`.
*   **`public.user_roles`**: Many-to-many relationship table linking `profiles` to `roles`.
*   **`public.digital_vault`**: Stores metadata for user documents (KTP, KK, birth certificates, etc.) with references to file URLs and verification status.

### 2. Financial System (Dual-Ledger Engine)

*   **`public.rekenings`**: Chart of Accounts for the dual-ledger financial engine (RK-1 Operasional, RK-2 Dana Sosial & Kasih, RK-3 Ekonomi & Digital).
*   **`public.financial_transactions`**: Records all financial transactions (in, out, transfer) with reference to `rekenings`, nominal, category, and approval status.
*   **`public.kolekte_entries`**: Stores blind dual-entry records for collections, ensuring transparency and reconciliation.
*   **`public.multi_signature_approvals`**: Tracks multi-signature approvals for financial transactions.
*   **`public.dana_kasih`**: Manages charity campaigns/funds, including targets, collected amounts, verification, and disbursement details.
*   **`public.dana_kasih_donors`**: Records individual donations to `dana_kasih` campaigns.
*   **`public.marketplace_products`**: (Fase 4) Stores product information for the internal marketplace.
*   **`public.marketplace_orders`**: (Fase 4) Records orders placed in the marketplace.
*   **`public.marketplace_order_items`**: (Fase 4) Details of items within each marketplace order.
*   **`public.marketplace_carts`**: (Fase 4) User shopping carts.
*   **`public.assets`**: Tracks parish-owned assets.

### 3. Sacrament & Pastoral Workflow

*   **`public.sakramen_registrations`**: Generic table for tracking all sacrament application workflows.
*   **`public.baptisms`**: Detailed records for Baptism sacrament applications, including child data, parents, godparents, and workflow status.
*   **`public.marriages`**: Detailed records for Marriage sacrament applications, including groom/bride data, marriage type, canonical details, and workflow status.
*   **`public.anointings`**: Records for Anointing of the Sick sacrament, including user, minister, and status.
*   **`public.e_signatures`**: Stores electronic signatures for various approvals within sacrament workflows.

### 4. Activities, Reporting & Engagement

*   **`public.laporan_templates`**: Defines templates for various reports (e.g., activity reports, liturgical reports, social reports).
*   **`public.kegiatan`**: Records planned and executed activities/events (KPD & KTPD) with details on purpose, budget, PIC, and approval workflow.
*   **`public.laporan_seksi`**: Stores actual reports (LPJ) based on templates, linked to `kegiatan`.
*   **`public.keaktifan`**: Tracks user activity and participation in various parish/community roles.

### 5. Notifications, Logs & SOS

*   **`public.notifications`**: Stores user notifications (info, warning, critical, pastoral_sos).
*   **`public.activity_logs`**: General user activity logs.
*   **`public.audit_logs`**: Financial audit logs.
*   **`public.pastoral_sos`**: Manages emergency pastoral requests (anointing, counseling) with location, response, and escalation status.
*   **`public.sos_config`**: Configuration for SOS escalation (email/phone contacts per region/role).
*   **`public.sos_escalation_records`**: Logs of SOS escalations.

### 6. AI Companion & Governance

*   **`public.companion_sessions`**: Tracks AI Companion chat sessions.
*   **`public.companion_transcripts`**: Stores (E2E encrypted) chat transcripts.
*   **`public.surat_pastoral`**: Stores (E2E encrypted) pastoral letters between user and pastor.
*   **`public.wdl_consent`**: Manages consent for Wali Digital access to user data.
*   **`public.wdl_access_log`**: Logs access by Wali Digital.
*   **`public.governance_program_kerja`**: Program work plan.
*   **`public.governance_rkap`**: RKAP (Rencana Kerja dan Anggaran Paroki).
*   **`public.governance_keputusan_dpp`**: Immutable records of DPP decisions.
*   **`public.governance_notulen`**: Meeting minutes.
*   **`public.governance_kpi`**: Key Performance Indicators.
*   **`public.governance_evaluasi`**: Evaluation records.

### 7. Admin System

*   **`public.admin_registrations`**: Stores pending admin registration requests.
*   **`public.admin_activations`**: Tracks admin user activations.
*   **`public.super_admin_credentials`**: Stores credentials for super admin (fixes an issue from migration 049).
*   **`public.super_admin_logs`**: Logs super admin activities.

### 8. AI Learning & Knowledge Retrieval

*   **`public.app_overview_qna`**: Curated Q&A about application features, with embeddings for semantic search.
*   **`public.learning_paths`**: Structured learning paths for Catholic faith education.
*   **`public.learning_progress_records`**: Tracks user progress through learning paths.
*   **`public.ai_user_profiles`**: Extends `profiles` with AI-specific data like learning preferences and progress summaries.

### 8a. API Key Management (051_api_key_management)
*   **`public.user_api_keys`**: Stores user-provided API keys for LLM providers (OpenRouter, Gemini, etc.) with encryption.
*   **`public.admin_api_key_pool`**: Admin-managed pool of API keys for shared bot usage across all users.
*   **`public.api_usage_logs`**: Tracks all API key usage for monitoring, statistics, and audit purposes.

### 9. Other Utility Tables

*   **`public.cron_heartbeat`**: Tracks cron job execution.
*   **`public.otp_verification`**: Stores One-Time Passwords for verification processes.
*   **`public.error_logs`**: Logs application errors.
*   **`public.whistleblower_reports`**: For anonymous reporting.
*   **`public.master_data_options`**: Generic table for various dropdown/selection options.

## Theology Schema

*   **`theology.references`**: Stores theological reference documents (KGK, Biblical, historical, philosophical) with content, metadata, and vector embeddings for RAG (Retrieval Augmented Generation).