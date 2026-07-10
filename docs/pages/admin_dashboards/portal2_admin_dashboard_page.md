# Portal 2: Environment Admin Dashboard Page (KL Dashboard)

This document details the Environment Admin Dashboard page, primarily used by the Ketua Lingkungan (KL) and other environment-level administrators within Portal 2.

## URL
-   `/lingkungan/[slug]/kl` (within `src/app/(dashboard)/lingkungan/[slug]/kl/` route group)

## Purpose
-   Provide tools and information specific to managing a particular environment (Lingkungan).
-   Enable KLs to manage parishioners, verify new members, oversee activities, and handle local finances.
-   Facilitate pastoral care functions such as Morning Checks for the elderly and managing SOS access.

## UI/UX Design
-   **Dashboard Layout**: Customized layout optimized for environment management.
-   **Environment Statistics**: Displays key metrics for the specific environment, such as total members, active members, new members this month, and participation rates.
-   **Parishioner Management**:
    *   **"Umat Menunggu Verifikasi" (Pending Parishioners)**: List of new users pending approval in their environment. Includes "TERIMA" (Accept), "HUBUNGI DULU" (Contact First), "TOLAK" (Reject) actions.
    *   **Member List**: Comprehensive list of all members in the environment with search and profile view options.
    *   **Role & Layer Management**: Tools to assign/adjust roles (e.g., WDL) or `access_layer` for members within their environment.
-   **Pastoral Care Tools**:
    *   **"Morning Check Lansia" (Daily Elderly Check)**: Overview of elderly parishioners' daily check-in status (✅/⏳/⚠️), with options for follow-up.
    *   **SOS Abuse Tracker (Environment-Specific)**: Monitors `public.sos_abuse_tracker` for their environment, with "Pulihkan Akses" (Restore SOS Access) functionality.
    *   **Wali Digital Lingkungan (WDL) Management**: Appoint WDLs and manage their proxy consents.
-   **Activity & Request Management**:
    *   **"Pengajuan Surat" (Letter Requests)**: Review and approve/reject internal letter requests.
    *   **"Permohonan Doa" (Prayer Requests)**: View and manage prayer requests from environment members.
    *   **"Kegiatan Lingkungan" (Environment Activities)**: Schedule, manage, and report on local activities.
-   **Financial Management**:
    *   **"Keuangan Lingkungan" (Environment Finances)**: Overview of environment's cash flow, dues collection, and petty cash.
    *   **"Iuran & Dana Duka" (Dues & Bereavement Fund)**: Manage collections and disbursements.
-   **Communication**:
    *   **"Broadcast Pesan" (Broadcast Message)**: Send WhatsApp messages or in-app notifications to all environment members.
-   **Navigation**: Sidebar navigation with links to specific management modules.

## Userflow
1.  **Login**: KL logs in via `/admin/login` (WhatsApp number + password).
2.  **Redirection**: Upon successful login, the KL is redirected to `/lingkungan/[slug]/kl`, their specific environment's dashboard.
3.  **Environment-Specific View**: The dashboard dynamically displays data and tools relevant to their assigned environment.
4.  **Parishioner Verification**: KL reviews and approves/rejects new user registrations within their environment.
5.  **Pastoral Oversight**: Monitors elderly checks, manages SOS abuse cases for their members, and appoints WDLs.
6.  **Local Operations**: Organizes activities, manages local finances, and handles requests from environment members.
7.  **Communication**: Uses broadcast tools to communicate important information to their environment.

## Technical Details
-   **Frontend Component**: `src/app/(dashboard)/lingkungan/[slug]/kl/page.tsx`.
-   **UI Components**: Specific cards and tables for displaying environment statistics, pending users, elderly check status, financial summaries.
-   **Backend Endpoints**: APIs under `/api/v1/lingkungan/` for managing environment data (e.g., `/api/v1/lingkungan/[slug]/users`, `/api/v1/lingkungan/[slug]/activities`, `/api/v1/lingkungan/[slug]/finance`).
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.activities`, `public.environment_dues`, `public.sos_abuse_tracker`, `public.wdl_consent` (for WDL management).
-   **Authorization**: RLS policies and middleware strictly enforce that a KL can only manage data and users within their assigned `lingkungan_id`. Layer 4 access is crucial.

## Edge Cases
-   **Unauthorized Environment Access**: Attempts to access another environment's dashboard are blocked.
-   **Escalation**: If a KL is unresponsive to pending registrations or elderly checks, automated escalations notify higher-level administrators.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0.4 "Portal 2 — Lingkungan"
-   [Masterplan v4.0] Fase 7 "SISTEM LOGIN & DASHBOARD ADMIN"
-   [Userflow v4.0] Bagian 5 "Portal 2: Homepage Lingkungan & KL Dashboard", Bagian 22.3 "Dashboard Per Role Admin"
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)
-   [Feature: SOS Anti-Abuse System](docs/features/sos_anti_abuse_system.md)
-   [Feature: Wali Digital Lingkungan (WDL)](docs/features/wali_digital_lingkungan.md)