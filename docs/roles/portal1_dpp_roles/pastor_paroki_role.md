# Role: Pastor Paroki

This document defines the role, responsibilities, and system access for the Pastor Paroki within the Paroki Santo Klemens Digital Ecosystem. The Pastor Paroki holds the highest pastoral and administrative authority.

## Access Layer
-   **Layer 9**

## Purpose
-   Provide spiritual leadership and guidance to the entire parish community.
-   Oversee all pastoral, administrative, and financial operations of the parish.
-   Act as the final approver for significant decisions and sensitive data.
-   Ensure the implementation of the parish's mission and vision through the digital ecosystem.

## Key Responsibilities
*   **Spiritual Leadership**: Provide guidance and support for all spiritual and liturgical activities.
*   **Ultimate Approval Authority**:
    *   Final approval for major financial expenditures (KPD above certain thresholds).
    *   Final approval for GAKIN family status (as one of the 3/4 approvers).
    *   Approval for significant system changes or policy updates.
*   **Pastoral Care Oversight**:
    *   Monitor SOS triggers and escalation, ensuring timely response to emergencies.
    *   Access Dashboard Pemulihan (SOS Restore Panel) to manage and restore SOS access for blocked users.
    *   Oversight of daily Morning Checks for the elderly.
*   **Financial Oversight**:
    *   Receive audit reports directly from the system.
    *   Approve transfers between various parish accounts (RK-1, RK-2, RK-3).
    *   Oversee budget utilization and financial transparency.
*   **Administrative Oversight**:
    *   Global access to all parish data (profiles, families, activities, documents).
    *   Oversee the verification process of new parishioners and documents.
    *   Conduct tri-annual audits of the Whistle-Blower system.
*   **Whistle-Blower Access**: Direct and exclusive access to anonymous Whistle-Blower reports.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Primary access to a comprehensive view within `/dashboard/admin-paroki`, which includes:
    *   Global demographic statistics and GAKIN summary.
    *   SOS activity recap and access to `SOS Restore Panel`.
    *   Pending approval queues (KPD, GAKIN).
    *   Direct access to Digital Vault admin panel for oversight.
    *   Financial dashboards with RK-1, RK-2, RK-3 balances and transaction oversight.
    *   Whistle-Blower reports interface.
-   **Cross-Portal Data Access**: Full access to all cross-portal data (Family, Profile, Digital Vault, Companion metadata) with the highest level of visibility, as per Layer 9. *Note: E2E encrypted data (Companion transcripts, Whistle-Blower report content) remains inaccessible, preserving user privacy.*

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 9 access, granting broad read and write permissions across most public schemas via RLS.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules.
-   **Backend Endpoints**: Access to virtually all `/api/v1/` endpoints, with RLS ensuring actions comply with defined permissions.
-   **Database Tables**: Comprehensive access to `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.financial_transactions`, `public.kegiatan`, `public.digital_vault`, `public.whistle_blower_reports`.

## Edge Cases
-   **Forgotten Password**: Requires standard admin password reset flow (if not handled by Super Admin).
-   **Whistle-Blower Report Security**: E2E encryption ensures only the Pastor can decrypt, even from system administrators.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: GAKIN Approval Flow](docs/features/gakin_approval_flow.md)
-   [Feature: SOS Anti-Abuse System](docs/features/sos_anti_abuse_system.md)
-   [Feature: Whistle-Blower System](docs/features/whistle_blower_system.md) (will create this later)