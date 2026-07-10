# Backend Migration History Summary

This document provides a summary of the database migration history for the Paroki Santo Klemens Digital Ecosystem, based on `project_backend_snapshot.md` as of 2026-06-17. It lists each migration file with its primary purpose. For full SQL details, refer to the individual files in `supabase/migrations/`.

## Migration Files:

*   **`001_initial_schema.sql`**: Core Tables for Parish Profile, Lingkungan, Wilayah, Families, Roles, Profiles, User Roles, and Digital Vault.
*   **`002_add_keuangan_tables.sql`**: Implements the Dual-Ledger Financial Engine with Rekening, Financial Transactions, Kolekte Entries, and Multi-Signature Approvals.
*   **`003_add_sakramen_tables.sql`**: Adds tables for Sacrament Registrations (generic), Baptisms, Marriages, Anointings, and E-Signatures.
*   **`004_add_kegiatan_tables.sql`**: Introduces tables for Laporan Templates, Kegiatan (Activities), Laporan Seksi (LPJ), and Keaktifan (User Activity).
*   **`005_add_notifications.sql`**: Adds tables for Notifications, Activity Logs, Audit Logs, and Pastoral SOS.
*   **`006_add_companion_vault_governance.sql`**: Extends the system with Companion Sessions and Transcripts, Encrypted Pastoral Letters, WDL Consent/Logs, and Governance structures (Program Kerja, RKAP, Keputusan DPP, Notulen, KPI, Evaluasi).
*   **`007_add_dana_kasih_marketplace.sql`**: Implements Dana Kasih (Charity Funds) with Donor tracking, Marketplace Products/Orders/Carts, and Parish Assets.
*   **`008_add_rls_policies.sql`**: Initial set of Row Level Security policies for core tables.
*   **`009_add_fase1_tables.sql`**: Adds tables specific to Fase 1 (e.g., devotional content, news, events).
*   **`030_health_check.sql`**: Adds a table for system health checks.
*   **`031_otp_verification.sql`**: Table for One-Time Password (OTP) verification.
*   **`032_error_logs.sql`**: Table for logging application errors.
*   **`033_cron_heartbeat.sql`**: Tracks the heartbeat of cron jobs.
*   **`034_family_invitations.sql`**: Manages family invitation processes.
*   **`035_data_gakin.sql`**: Stores data for "Gakin" (Keluarga Miskin) program.
*   **`036_gakin_approvals.sql`**: Tracks approvals for Gakin data.
*   **`037_sos_abuse_tracker.sql`**: Tracks abuse reports for SOS feature.
*   **`038_rls_v4.sql`**: Version 4 of Row Level Security policies.
*   **`039_super_admin.sql`**: Adds tables and functions related to Super Admin functionalities.
*   **`040_rls_admin_policies.sql`**: RLS policies specific to admin roles (e.g., Admin Lingkungan).
*   **`044_create_admin_registrations.sql`**: Creates the `admin_registrations` table.
*   **`045_add_notification_tables.sql`**: Adds more advanced notification tables.
*   **`046_fase2_pastoral_core.sql`**: Tables and features for Fase 2 pastoral core.
*   **`047_fase3_solidaritas_keuangan.sql`**: Tables and features for Fase 3 financial solidarity.
*   **`048_fase4_ekonomi_internal.sql`**: Tables and features for Fase 4 internal economy.
*   **`049_fase7_admin_system.sql`**: RLS Policies, Views, and Functions for Admin System, including `super_admin_credentials` table creation. (This file was recently fixed to include table creation).
*   **`20260601143908_add_sos_full_features.sql`**: Extends Pastoral SOS with full features.
*   **`20260601144205_add_sos_parish_config.sql`**: Adds SOS parish configuration.
*   **`20260605115950_create_edge_function_cron_jobs.sql`**: Creates cron jobs for edge functions.
*   **`20260605120000_add_lingkungan_slug.sql`**: Adds `lingkungan_slug` to relevant tables.
*   **`20260605120100_extend_profiles.sql`**: Extends `profiles` table with additional fields.
*   **`20260605130000_lingkungan_full_fields.sql`**: Adds full fields to `lingkungan` table.
*   **`20260605140000_storage_buckets_policies.sql`**: Configures RLS policies for storage buckets.
*   **`20260606025309_add_wdl_vault_ocr_bot_tables.sql`**: Adds tables for WDL, Vault OCR, and Bot features.
*   **`20260607132042_create_custom_schemas.sql`**: Creates custom schemas like `theology`.
*   **`20260608000000_extend_role_enum.sql`**: Extends the `role` enum.
*   **`20260608000100_role_based_rls_policies.sql`**: Role-based RLS policies.
*   **`20260608000200_seksi_bidang_rls.sql`**: RLS policies for `seksi` and `bidang`.
*   **`20260615072956_add_registration_data_to_otp_verification.sql`**: Adds registration data to OTP verification.
*   **`20260617031410_add_new_features.sql`**: Adds various new features.
*   **`20260617040000_fix_cron_heartbeat.sql`**: Fixes the cron heartbeat table.
*   **`20260618_ai_clm_knowledge_retriever.sql`**: AI-CLM (Catholic Learning Module) and Knowledge Retriever System, including `theology.references` table creation.
*   **`051_api_key_management.sql`**: API Key Management System for OpenRouter & Gemini integration, including `user_api_keys`, `admin_api_key_pool`, and `api_usage_logs` tables for AI provider management.
*   **`052_api_key_management_crypto.sql`**: API Key Encryption Functions using `pgp_sym_encrypt`/`pgp_sym_decrypt` for AES256 key storage.
*   **`053_user_settings.sql`**: Comprehensive User Settings System including `user_settings` table (notifications, privacy, AI preferences, session config) and `phone_change_logs` table for WhatsApp number change audit trail.
