# Role: Wakil Ketua I (Deputy Head I of DPP)

This document defines the role, responsibilities, and system access for the Wakil Ketua I (Deputy Head I) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. Wakil Ketua I assists the Pastor Paroki in overall administration and focuses on specific strategic areas.

## Access Layer
-   **Layer 8**

## Purpose
-   Assist the Pastor Paroki in the general administration and pastoral care of the parish.
-   Oversee specific operational aspects of the digital ecosystem.
-   Participate in high-level decision-making and major approvals.
-   Ensure compliance with policies and procedures.

## Key Responsibilities
*   **High-Level Administrative Oversight**:
    *   Assist the Pastor Paroki in supervising the overall functioning of the DPP.
    *   Oversee the implementation of programs and activities from various Bidangs.
*   **Major Approval Authority**:
    *   Participate in the 3/4 approval flow for GAKIN family status.
    *   Approve significant KPD (Kegiatan dengan Permohonan Dana) requests (e.g., above Bendahara II/III thresholds, but below Pastor's ultimate threshold).
    *   Co-approve major financial transfers and budget reallocations.
*   **Audit and Reconciliation**:
    *   Review internal audit reports and ensure follow-up on anomalies.
    *   Participate in monthly or quarterly financial reconciliation processes.
*   **Global GAKIN Oversight**:
    *   Access and review all GAKIN data across all environments.
    *   Provide input on GAKIN policies and support initiatives for impoverished families.
*   **SOS Escalation Point**: Act as an escalation point for SOS triggers if the Pastor Paroki is unresponsive.
*   **Policy & Strategic Development**: Contribute to the development and refinement of parish policies and strategic plans.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a comprehensive view within `/dashboard/admin-paroki`, including:
    *   Global demographic statistics and GAKIN summary (with drill-down capabilities).
    *   Pending approval queues for KPD and GAKIN.
    *   SOS activity logs and status.
    *   Financial reconciliation reports.
    *   Access to administrative reports from Secretaries and Treasurers.
-   **Cross-Portal Data Access**: Broad access to cross-portal data (Family, Profile, Digital Vault, Companion metadata) as per Layer 8, allowing for parish-wide oversight.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 8 access, granting extensive read/write permissions for oversight and approval functions, especially for financial and GAKIN data.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules.
-   **Backend Endpoints**: Interacts with APIs for GAKIN, financial approvals, KPD/KTPD, and SOS monitoring.
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.financial_transactions`, `public.kegiatan`, `public.sos_abuse_tracker`.

## Edge Cases
-   **Conflicting Approvals**: System handles situations where multiple approvers provide different decisions.
-   **Escalation Protocol**: Ensures proper notification and action if Wakil Ketua I is unresponsive to critical tasks.

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
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)