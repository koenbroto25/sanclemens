# Backend RLS Policies Summary

This document provides a summary of key Row Level Security (RLS) policies implemented in the Paroki Santo Klemens Digital Ecosystem, based on `project_backend_snapshot.md` as of 2026-06-17. It focuses on how data access is controlled for various user roles and tables.

## General Principles

*   **Default Deny**: Most tables have RLS enabled, implicitly denying all access unless explicitly granted by a policy.
*   **Role-Based Access**: Policies are heavily reliant on the `auth.uid()` and `public.profiles.role`/`access_layer` to determine user permissions.
*   **Ownership**: Users generally have full access to their own records.
*   **Admin Hierarchies**: Higher `access_layer` roles (e.g., `pastor`, `super_admin`) have broader access, often encompassing lower layers.
*   **Read vs. Write**: Policies differentiate between `SELECT` (read), `INSERT` (create), `UPDATE`, and `DELETE` operations.

## Key RLS Policies by Feature Area

### 1. Core User & Parish Management

*   **`public.profiles`**:
    *   Users can view and update their own profiles (limited fields).
    *   Admin Paroki (access_layer >= 8) can view all profiles.
    *   Admin Lingkungan (role `admin_lingkungan`) can view profiles within their own `lingkungan_slug`.
    *   Sekretaris can update certain profile fields.
*   **`public.families`**:
    *   Family members can view their own family record.
    *   Admin Paroki (access_layer >= 8) can view all families.
    *   Sekretaris can manage (view, insert, update) families.
*   **`public.lingkungan`, `public.wilayah`**:
    *   Read access for all authenticated users.
    *   `ketua_lingkungan` can update their own lingkungan.
*   **`public.roles`**: Viewable by all authenticated users; only system administrators can manage.
*   **`public.digital_vault`**:
    *   Users can view their own vault documents.
    *   Sekretaris+ (access_layer >= 5) can view and verify all vault documents.

### 2. Financial System

*   **`public.rekenings`**:
    *   Viewable by authenticated users (especially for transaction context).
    *   Only `bendahara` and `auditor` roles can manage.
*   **`public.financial_transactions`**:
    *   Users can view their own transactions.
    *   `bendahara` and `auditor` roles have broader view/management based on `ledger` type and approval status.
    *   `multi_signature_approvals` policies ensure only authorized approvers can sign.
*   **`public.kolekte_entries`**:
    *   `bendahara` roles can submit their blind entries.
    *   `bendahara_ii` and `bendahara_iii` can reconcile their respective ledgers.
    *   Supervisors can view and update kolekte reconciliations within their scope.

### 3. Sacrament & Pastoral Workflow

*   **`public.sakramen_registrations`**, **`public.baptisms`**, **`public.marriages`**, **`public.anointings`**:
    *   Users can initiate and view their own applications.
    *   `ketua_lingkungan` (KL) can view and sign applications from their `lingkungan`.
    *   `sekretaris` and `pastor` roles have comprehensive view and approval/management access.
*   **`public.e_signatures`**: Access tied to the associated registration and signer's role.

### 4. Activities, Reporting & Engagement

*   **`public.laporan_templates`**: Viewable by authenticated users. Manageable by roles like `koordinator_bidang`.
*   **`public.kegiatan`**:
    *   Users can view activities they are involved in.
    *   `koordinator_bidang` and higher roles can manage activities in their scope.
    *   Public activities may be viewable by all.
*   **`public.laporan_seksi`**: Access based on `kegiatan` ownership and reporting roles.
*   **`public.keaktifan`**: Users can view their own activity; relevant administrators can manage.

### 5. Notifications, Logs & SOS

*   **`public.notifications`**: Users can view their own notifications.
*   **`public.activity_logs`**: Primarily for internal audit/monitoring; typically accessible by `operator_ict`, `tim_audit`, `super_admin`.
*   **`public.audit_logs`**: Financial audit logs, restricted to `tim_audit` and `super_admin`.
*   **`public.pastoral_sos`**:
    *   Users can trigger and view their own SOS requests.
    *   `pastor` and designated SOS responders have full access.
*   **`public.whistleblower_reports`**: Users can submit; only `pastor` can view.

### 6. AI Companion & Governance

*   **`public.companion_sessions`**, **`public.companion_transcripts`**: Users can view their own session data. Encrypted transcripts are only accessible to the user and authorized AI.
*   **`public.surat_pastoral`**: Only recipient and pastor can view/manage.
*   **`public.wdl_consent`**, **`public.wdl_access_log`**: Strict access control for Wali Digital consent and audit trails.
*   **`public.governance_*` tables**: Access layers vary, but generally restricted to `koordinator_bidang` and higher roles for management, with wider read access for transparency.

### 7. Admin System

*   **`public.admin_registrations`**: Calon admin can insert; `super_admin` can view/update.
*   **`public.super_admin_credentials`**: Highly restricted; only `super_admin` can view/update their own credentials.

### 8. AI Learning & Knowledge Retrieval

*   **`public.app_overview_qna`**: Publicly viewable by all; only `admin` roles (access_layer >= 5) can insert/update.
*   **`public.learning_paths`**: Public learning paths viewable by all.
*   **`public.learning_progress_records`**: Users can view, create, and update their own progress.

### 9. API Key Management System

*   **`public.user_api_keys`**:
    *   Full CRUD access for users on their own keys only
    *   Policy: "Users can manage own API keys"
    *   encrypted storage ensures privacy

*   **`public.admin_api_key_pool`**:
    *   Full access for `super_admin` and `operator_ict` roles only
    *   Policy: "Super admin can manage API key pool"
    *   Role check: `role IN ('super_admin', 'operator_ict')`

*   **`public.api_usage_logs`**:
    *   Users can view their own usage records
    *   Admins (access_layer >= 5) can view all records
    *   Insert/Update/Delete: Service role only (backend)
