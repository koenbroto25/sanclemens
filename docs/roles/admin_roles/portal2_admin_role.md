# Role: Admin Portal 2 (Environment Admin)

This document defines the responsibilities and access for administrators managing Portal 2 functions within the Paroki Santo Klemens Digital Ecosystem. The primary role in this category is the Ketua Lingkungan (KL), who is responsible for managing a specific parish environment.

## Access Layer
-   **Layer 4**

## Purpose
-   Oversee and manage the specific parish environment (Lingkungan).
-   Facilitate local community activities, pastoral care, and administrative tasks.
-   Act as the primary point of contact between parishioners in their environment and the wider parish administration.
-   Ensure the well-being of the parishioners in their assigned environment.

## Key Responsibilities
*   **New Parishioner Verification**: Review and approve/reject new user registrations belonging to their assigned environment.
*   **Environment Data Management**: Update and maintain information specific to their environment.
*   **Activity Organization**: Plan, organize, and report on local activities (e.g., gatherings, social events).
*   **Financial Oversight (Local)**: Oversee the collection of environment dues (`iuran`) and disbursements for the Bereavement Fund (`Dana Duka`).
*   **Pastoral Care**: Conduct daily Morning Checks for elderly parishioners in their environment and manage SOS access for their members (including restoring blocked access).
*   **Wali Digital Lingkungan (WDL) Management**: Identify, appoint, and oversee WDLs within their environment, managing their proxy consents.
*   **Communication**: Disseminate parish announcements and communicate directly with environment members via broadcast tools.
*   **GAKIN Proposal & Approval**: Propose new GAKIN families from their environment and participate in the 3/4 approval flow for GAKIN data.

## Default Landing Page (Portal Context)
-   `/lingkungan/[slug]/kl` (where `[slug]` corresponds to the specific environment managed by the KL).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: `Portal2AdminDashboardPage.md` describes the environment-specific dashboard layout, which includes:
    *   Environment statistics (members, activities, finances).
    *   List of pending parishioners for verification.
    *   Morning Check status board for elderly.
    *   SOS Abuse Tracker panel for their environment members.
    *   Activity planning and reporting modules.
    *   Local financial overview (iuran, Dana Duka).
    *   WDL management tools.
-   **Navigation**: Contextual navigation within the dashboard for specific modules. Global navigation elements (sidebar, navbar) allow access to cross-portal features.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani is available. KLs can view profiles and family data of members within their environment, and potentially assist with Vault documents for those with WDL consent.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) for admin users.
-   **Authorization**: Strict RLS policies (`public.profiles.access_layer`, `public.profiles.role`, and `public.profiles.lingkungan_id`) and middleware ensure that KLs can only view and manage data within their assigned environment.
-   **Frontend Component**: `src/app/(dashboard)/lingkungan/[slug]/kl/page.tsx`.
-   **Backend Endpoints**: APIs under `/api/v1/lingkungan/` and `/api/v1/gakin` that are environment-scoped.
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.sos_abuse_tracker`, `public.wdl_consent`, `public.activities`, `public.environment_dues`.

## Edge Cases
-   **Attempted Cross-Environment Access**: Middleware prevents a KL from accessing or managing data for environments other than their own.
-   **Non-Responsive KL**: Escalation mechanisms are in place for critical tasks (e.g., new user approval, elderly check follow-up) if a KL is unresponsive.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 2 Environment Admin Dashboard](docs/pages/admin_dashboards/portal2_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0.4 "Portal 2 — Lingkungan"
-   [Userflow v4.0] Bagian 5 "Portal 2: Homepage Lingkungan & KL Dashboard"
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)
-   [Feature: SOS Anti-Abuse System](docs/features/sos_anti_abuse_system.md)
-   [Feature: Wali Digital Lingkungan (WDL) Proxy Flow](docs/features/wdl_proxy_flow_feature.md)
-   [Page: Waiting Room Page](docs/pages/auth/waiting_room_page.md)