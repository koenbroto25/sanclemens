# Role: Ketua Lingkungan (KL - Head of Environment)

This document defines the role, responsibilities, and system access for the Ketua Lingkungan (KL) within the Paroki Santo Klemens Digital Ecosystem. The KL is a pivotal role in Portal 2, serving as the local community leader and primary liaison between the parishioners in their assigned environment and the broader parish administration.

## Access Layer
-   **Layer 4**

## Purpose
-   Provide leadership and pastoral care to the parishioners in their assigned environment.
-   Oversee local administrative tasks, activities, and communication within the environment.
-   Act as the primary verifier for new parishioners and key facilitator for social and emergency support.
-   Ensure the well-being and active participation of environment members in parish life.

## Key Responsibilities
*   **New Parishioner Verification**: Review and approve/reject new user registrations belonging to their assigned environment (Layer 1 - Waiting Room).
*   **Environment Management**:
    *   Maintain accurate data for their environment and its members.
    *   Organize and manage local community activities and prayer schedules.
    *   Disseminate parish-wide announcements and environment-specific messages.
*   **Financial Oversight (Local)**:
    *   Oversee the collection of environment dues (`iuran lingkungan`).
    *   Approve the disbursement of the Bereavement Fund (`Dana Duka`) for families in their environment.
*   **Pastoral Care**:
    *   Conduct daily Morning Checks for elderly parishioners in their environment, initiating follow-ups for non-responsive individuals.
    *   Manage SOS access for members in their environment, including restoring blocked access via the `SOS Restore Panel`.
    *   Propose new GAKIN families from their environment and participate in the 3/4 approval flow.
    *   Verify needs for Dana Kasih requests from their environment.
*   **Wali Digital Lingkungan (WDL) Management**: Appoint 1-2 WDLs per environment and manage their proxy consents to assist other parishioners.
*   **Reporting**: Submit reports on environment activities, finances, and pastoral interventions.

## Default Landing Page (Portal Context)
-   `/lingkungan/[slug]/kl` (KL Dashboard, accessed after selecting Portal 2 from Gate Hub).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access to `Portal2AdminDashboardPage.md` (`/lingkungan/[slug]/kl`), providing:
    *   Environment statistics and member lists.
    *   Queue for pending new user registrations from their environment.
    *   `Morning Check Lansia` status board.
    *   `SOS Abuse Tracker` panel for their environment members with restore options.
    *   Activity planning, prayer scheduling, and event management tools.
    *   Interfaces for managing local finances, dues, and Dana Duka payouts.
    *   WDL appointment and consent management.
    *   GAKIN proposal and approval tracking.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani. KLs have specific RLS permissions to view and manage data related to their environment and its members, and can assist with Digital Vault documents for those with WDL consent.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 4 access, strictly enforced by RLS policies (`public.profiles.lingkungan_id`) and middleware, limiting data and actions to their assigned environment.
-   **Frontend Component**: `src/app/(dashboard)/lingkungan/[slug]/kl/page.tsx`.
-   **Backend Endpoints**: Interacts with APIs for user management, environment activities, local finances, GAKIN, SOS, and WDL.
-   **Database Tables**: `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.sos_abuse_tracker`, `public.wdl_consent`, `public.activities`, `public.environment_dues`, `public.prayer_schedules`.

## Edge Cases
-   **Non-Responsive KL**: Automated escalation to Koordinator Bidang Diakonia or Sekretaris I for critical tasks if KL is unresponsive.
-   **GAKIN Approval from Other KL**: System prevents a KL from approving GAKIN data outside their designated environment.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 2 Environment Admin Dashboard](docs/pages/admin_dashboards/portal2_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for DPP structure context)
-   [Feature: GAKIN Approval Flow](docs/features/gakin_approval_flow.md)
-   [Feature: SOS Anti-Abuse System](docs/features/sos_anti_abuse_system.md)
-   [Feature: Wali Digital Lingkungan (WDL) Proxy Flow](docs/features/wdl_proxy_flow_feature.md)
-   [Page: Waiting Room Page](docs/pages/auth/waiting_room_page.md)