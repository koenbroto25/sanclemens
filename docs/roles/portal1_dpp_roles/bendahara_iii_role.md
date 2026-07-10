# Role: Bendahara III (Treasurer III of DPP)

This document defines the role, responsibilities, and system access for the Bendahara III (Treasurer III) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. Bendahara III is primarily responsible for managing the RK-3 (Rekening Kas 3), which handles funds related to the digital economy, marketplace, and ICT operations.

## Access Layer
-   **Layer 6**

## Purpose
-   Manage and oversee RK-3 (Rekening Kas 3), dedicated to the digital economy, marketplace, and ICT operations.
-   Administer financial aspects of the Pasar Kasih marketplace, including fee collection and operational expenses.
-   Ensure the sustainability and growth of the digital ecosystem through sound financial management of its related economic activities.
-   Provide financial transparency for economic activities.

## Key Responsibilities
*   **Digital Economy Fund Management (RK-3)**:
    *   Manage RK-3, tracking income from marketplace fees, ads, and other digital economic activities.
    *   Oversee expenditures related to the digital ecosystem's operational costs (e.g., hosting, software licenses, ICT support).
*   **Marketplace Financial Oversight**:
    *   Ensure proper collection of marketplace fees (e.g., 3-5% of transactions).
    *   Monitor financial transactions within Pasar Kasih, collaborating with Marketplace Manager.
    *   Process payments for Ojek Solidaritas drivers.
*   **ICT Budget Management**:
    *   Manage the budget allocated for ICT infrastructure, maintenance, and development.
    *   Approve expenditures for digital tools and services.
*   **Transaction Approval**:
    *   Approve KPD (Kegiatan dengan Permohonan Dana) requests related to digital economy and ICT within their authority limits.
    *   Authorize financial transfers and payments related to RK-3.
    *   Participate in multi-signature approvals for significant RK-3 transactions.
*   **Reporting & Reconciliation**:
    *   Generate financial reports specific to RK-3 activities, including marketplace performance and ICT spending.
    *   Perform monthly reconciliation of RK-3 accounts.
*   **Compliance & Audit**:
    *   Ensure all RK-3 financial operations comply with relevant policies.
    *   Collaborate with the Audit Team during audits of RK-3.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities, with a strong focus on RK-3 modules).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, emphasizing RK-3 and marketplace financial modules:
    *   RK-3 balance and detailed transaction history.
    *   Marketplace fee income reports.
    *   ICT expenditure tracking.
    *   Queue for RK-3 related KPD approvals.
    *   Alerts for financial anomalies in the digital economy.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view marketplace user financial data (e.g., seller payouts, buyer payments) as per RLS.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 6 access, granting specific read/write permissions for RK-3 and related digital economic transactions.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules, particularly digital finance dashboards.
-   **Backend Endpoints**: Interacts with APIs for marketplace finances (`/api/pasar-kasih/finance`), `/api/v1/financial` (RK-3 operations), and KPD approvals.
-   **Database Tables**: Access to `public.financial_accounts` (RK-3), `public.financial_transactions`, `public.products`, `public.orders`, `public.sellers`, `public.drivers`.

## Edge Cases
-   **Marketplace Revenue Fluctuations**: System should provide tools to analyze and forecast income from digital activities.
-   **ICT Cost Overruns**: Alerts for unexpected spikes in hosting or software costs.
-   **Security of Digital Funds**: High emphasis on securing RK-3 assets and transactions.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)
-   [Feature: Audit Keuangan Otomatis](docs/features/audit_keuangan_otomatis.md) (will create this later)
-   [Page: Portal 3 Marketplace Admin Dashboard](docs/pages/admin_dashboards/portal3_admin_dashboard_page.md)