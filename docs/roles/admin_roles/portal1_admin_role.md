# Role: Admin Portal 1 (Parish Admin)

This document defines the responsibilities and access for administrators managing Portal 1 functions within the Paroki Santo Klemens Digital Ecosystem. This category encompasses various roles within the Dewan Pastoral Paroki (DPP), including Pastor, Wakil Ketua, Secretaries, Treasurers, and Koordinator Bidang. While these roles have distinct functions, they share a common administrative context within Portal 1.

## Access Layer
-   **Layer 5-9** (Specific layer depends on the individual DPP role, as defined in `docs/roles/portal1_dpp_roles/`)

## Purpose
-   Oversee and manage parish-wide pastoral, administrative, and financial operations.
-   Ensure the smooth functioning of parish programs and services.
-   Provide leadership and support to various sub-bidangs and environments.
-   Maintain records and reports relevant to their specific DPP function.

## Key Responsibilities
Responsibilities are varied and depend on the specific DPP role:

*   **Pastor Paroki (Layer 9)**: Ultimate spiritual and administrative authority. Oversees all pastoral, financial, and social aspects. Final approver for major decisions. Access to Whistle-Blower reports.
*   **Wakil Ketua DPP (Layer 8)**: High-level administrative oversight. Assists Pastor, handles major approvals, reconciles reports, and provides global GAKIN oversight.
*   **Sekretaris DPP (Layer 5)**: Manages parish documentation, verifies new user registrations, oversees the Digital Vault.
*   **Bendahara DPP (Layer 6)**: Manages parish finances (RK-1, RK-2, RK-3), approves transactions, oversees budgets.
*   **Koordinator Bidang (Layer 7)**: Manages specific pastoral fields (e.g., Kerygma, Liturgia, Koinonia, Diakonia, Martyria). Initiates, approves, and reports on KPD/KTPD activities within their domain.
*   **Sub Bidang Members (Layer 2-7)**: Execute specific tasks within their sub-bidang, often involving data entry, activity participation, or reporting.

## Default Landing Page (Portal Context)
-   `/dashboard/admin-paroki` (The specific content and tools within this dashboard are dynamically customized based on the user's detailed DPP role).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: `Portal1AdminDashboardPage.md` describes the general layout, which serves as a container for role-specific modules and widgets. Examples include:
    *   **GAKIN Management Panel**: For roles like Pastor, Wakil DPP, Komsos/Seksos to view and manage GAKIN data, including the 3/4 approval flow.
    *   **Financial Overview**: For Treasurers to view account balances, transaction logs, and pending financial approvals.
    *   **Activity Management**: For Koordinator Bidang to initiate KPD/KTPD, track approvals, and submit LPJ.
    *   **Digital Vault Admin Panel**: For Secretaries to verify uploaded documents.
    *   **SOS Monitoring**: For Pastor and Wakil DPP to oversee SOS triggers and anti-abuse measures.
-   **Navigation**: Contextual navigation within the dashboard to different modules. Global navigation elements (sidebar, navbar) allow access to cross-portal features.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani is available. Their higher access layer grants them broader visibility and management capabilities for these data sets.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) for admin users, after being registered and approved by a Super Admin.
-   **Authorization**: Strict RLS policies (`public.profiles.access_layer` and `public.profiles.role`) and middleware determine which modules, data, and actions are visible and executable.
-   **Frontend Component**: `src/app/(dashboard)/admin-paroki/page.tsx`, which acts as a dispatcher for various role-specific sub-components.
-   **Backend Endpoints**: Utilizes various `/api/v1/` endpoints for data retrieval and manipulation, adhering to role-based permissions.
-   **Database Tables**: Access to tables such as `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.financial_transactions`, `public.kegiatan`, `public.digital_vault`.

## Edge Cases
-   **Role-Specific Data Visibility**: RLS ensures that a Treasurer only sees financial data relevant to their role, not necessarily other administrative data.
-   **Approval Workflows**: Multi-stage approval processes (e.g., KPD, GAKIN) are critical for ensuring accountability.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB XXIII "Sistem Login & Dashboard Admin (Fase 7)"
-   [Userflow v4.0] Bagian 22.3 "Dashboard Per Role Admin"
-   [Feature: GAKIN Approval Flow](docs/features/gakin_approval_flow.md)
-   [Feature: SOS Anti-Abuse System](docs/features/sos_anti_abuse_system.md)
-   [DPP Roles sub-directory](docs/roles/portal1_dpp_roles/) for individual role details.