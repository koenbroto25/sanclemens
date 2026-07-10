# Role: Wakil Ketua II (Deputy Head II of DPP)

This document defines the role, responsibilities, and system access for the Wakil Ketua II (Deputy Head II) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. Wakil Ketua II assists the Pastor Paroki in overall administration, often with a focus complementing Wakil Ketua I's responsibilities.

## Access Layer
-   **Layer 8**

## Purpose
-   Assist the Pastor Paroki in the general administration and pastoral care of the parish.
-   Oversee specific operational aspects of the digital ecosystem, often related to social or community-focused initiatives.
-   Participate in high-level decision-making and major approvals, particularly those concerning social welfare and community development.
-   Ensure compliance with policies and procedures.

## Key Responsibilities
*   **High-Level Administrative Oversight**:
    *   Assist the Pastor Paroki in supervising the overall functioning of the DPP.
    *   Oversee the implementation of programs and activities from various Bidangs, particularly Koinonia and Diakonia.
*   **Major Approval Authority**:
    *   Participate in the 3/4 approval flow for GAKIN family status.
    *   Approve significant KPD (Kegiatan dengan Permohonan Dana) requests, especially those related to social, community, or diaconal activities.
    *   Co-approve major financial transfers and budget reallocations related to social funds (RK-2).
*   **Audit and Reconciliation**:
    *   Review internal audit reports and ensure follow-up on anomalies, with a focus on social and financial transparency.
    *   Participate in monthly or quarterly financial reconciliation processes, particularly for social funds.
*   **Global GAKIN Oversight**:
    *   Access and review all GAKIN data across all environments.
    *   Provide input on GAKIN policies and support initiatives for impoverished families, often from a social justice perspective.
*   **Policy & Strategic Development**: Contribute to the development and refinement of parish policies and strategic plans, with an emphasis on social justice and community building.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a comprehensive view within `/dashboard/admin-paroki`, including:
    *   Global demographic statistics and GAKIN summary (with drill-down capabilities).
    *   Pending approval queues for KPD and GAKIN.
    *   Financial reconciliation reports, especially for RK-2.
    *   Access to administrative reports from Secretaries and Treasurers.
-   **Cross-Portal Data Access**: Broad access to cross-portal data (Family, Profile, Digital Vault, Companion metadata) as per Layer 8, allowing for parish-wide oversight, particularly in social and community data.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 8 access, granting extensive read/write permissions for oversight and approval functions, especially for financial (RK-2) and GAKIN data.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules.
-   **Backend Endpoints**: Interacts with APIs for GAKIN, financial approvals (especially RK-2), and KPD/KTPD related to social initiatives.
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.financial_transactions`, `public.kegiatan`.

## Edge Cases
-   **Conflicting Approvals**: System handles situations where multiple approvers provide different decisions.
-   **Escalation Protocol**: Ensures proper notification and action if Wakil Ketua II is unresponsive to critical tasks.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: GAKIN Approval Flow](docs/features/gakin_approval_flow.md)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)