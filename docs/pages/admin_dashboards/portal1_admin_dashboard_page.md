# Portal 1: Parish Admin Dashboard Page

This document details the Parish Admin Dashboard page, designed for administrators managing various parish-level functions within Portal 1. This includes roles such as Pastor, Wakil Ketua DPP, Secretaries, and Treasurers.

## URL
-   `/dashboard/admin-paroki` (within `src/app/(dashboard)/admin-paroki/` route group)

## Purpose
-   Provide a centralized dashboard for parish administrators to manage their respective domains (e.g., pastoral, finance, secretariat).
-   Display relevant statistics, pending approvals, and operational tools based on the administrator's specific role.
-   Facilitate oversight and decision-making for parish-wide activities and data.

## UI/UX Design
-   **Dashboard Layout**: A customized layout presenting widgets and tools pertinent to the admin's role.
-   **Overview Statistics**:
    *   **Pastor**: Global GAKIN data, SOS recap, pending approvals (KPD, GAKIN), general parish statistics.
    *   **Wakil DPP**: Rekonsiliasi reports, pending major approvals, global GAKIN data.
    *   **Secretaries**: Pending user verifications, Digital Vault admin panel, document management.
    *   **Treasurers**: Account balances, transaction logs, approval queues for financial operations.
-   **Role-Specific Panels**:
    *   **GAKIN Management**: Access to view all GAKIN data, manage applications, and oversee the approval process.
    *   **SOS Monitoring**: Overview of SOS triggers, abuse reports, and access restoration tools.
    *   **Digital Vault Administration**: Tools to verify uploaded documents, manage document access.
    *   **Financial Transactions**: View and approve transactions, manage different financial accounts (RK-1, RK-2, RK-3).
    *   **Activity & Program Management**: Oversee KPD/KTPD submissions, approvals, and LPJ (Laporan Pertanggung Jawaban) statuses.
-   **Navigation**: Sidebar navigation with links to specific administrative modules.
-   **Alerts/Notifications**: Prominent display of critical alerts (e.g., overdue LPJ, financial anomalies, pending SOS).

## Userflow
1.  **Login**: Admin logs in via `/admin/login` (WhatsApp number + password) after being approved by Super Admin.
2.  **Redirection**: Upon successful login, the system redirects the admin to their designated dashboard, e.g., `/dashboard/admin-paroki`.
3.  **Role-Based View**: The dashboard dynamically renders content and tools specific to the logged-in admin's `access_layer` and role (e.g., a Treasurer sees financial reports, a Pastor sees pastoral oversight tools).
4.  **Action & Management**: Admins perform their daily tasks, such as:
    *   Approving financial requests (KPD).
    *   Verifying new user registrations or documents.
    *   Monitoring GAKIN status or SOS events.
    *   Generating reports.
5.  **Cross-Portal Access**: Admins retain access to general user features like Family Data, Personal Profile, and Companion Rohani via global navigation, with their higher `access_layer` influencing data visibility (e.g., Pastor can see all profiles).

## Technical Details
-   **Frontend Component**: `src/app/(dashboard)/admin-paroki/page.tsx` (this will likely serve as a container that loads different sub-components based on the admin's role).
-   **UI Components**: Various custom components for data display, forms, and approval flows (e.g., `GakinApprovalBar.tsx`, `SOSRestorePanel.tsx`, `ApprovalTracker.tsx`).
-   **Backend Endpoints**: A range of APIs under `/api/v1/` for fetching and managing data relevant to each administrative domain (e.g., `/api/v1/gakin`, `/api/v1/financial`, `/api/v1/users`, `/api/v1/vault`).
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.financial_transactions`, `public.kegiatan`, `public.digital_vault`, etc., as per RLS policies.
-   **Authorization**: Strict RLS policies and middleware check `access_layer` and `role` to control visibility of modules and actions.
-   **Data Fetching**: Server-side data fetching and client-side caching (e.g., TanStack Query) to efficiently load role-specific data.

## Edge Cases
-   **Unauthorized Access**: Attempts to access modules outside an admin's role are blocked with an "Unauthorized" message.
-   **Data Discrepancies**: Financial anomaly detection triggers alerts for Treasurers and higher-level admins.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB XXIII "Sistem Login & Dashboard Admin (Fase 7)"
-   [Masterplan v4.0] Fase 7 "SISTEM LOGIN & DASHBOARD ADMIN"
-   [Userflow v4.0] Bagian 22.3 "Dashboard Per Role Admin"
-   [Role: Pastor Paroki](docs/roles/portal1_dpp_roles/pastor_paroki_role.md)
-   [Role: Wakil Ketua I](docs/roles/portal1_dpp_roles/wakil_ketua_i_role.md)
-   [Role: Sekretaris I](docs/roles/portal1_dpp_roles/sekretaris_i_role.md)
-   [Role: Bendahara I](docs/roles/portal1_dpp_roles/bendahara_i_role.md)
-   [Role: Koordinator Pewartaan](docs/roles/portal1_dpp_roles/koordinator_pewartaan_role.md) (and other Koordinator Bidang roles)