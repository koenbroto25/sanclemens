# Role: Bendahara I (Treasurer I of DPP)

This document defines the role, responsibilities, and system access for the Bendahara I (Treasurer I) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. Bendahara I is responsible for the overall financial management and oversight of the parish's primary funds (RK-1).

## Access Layer
-   **Layer 6**

## Purpose
-   Manage the primary financial accounts (RK-1) of the parish.
-   Oversee the budget and financial planning for general parish operations.
-   Approve financial transactions and ensure fiscal responsibility.
-   Provide financial reports to the DPP and higher authorities.

## Key Responsibilities
*   **Primary Financial Management**:
    *   Manage RK-1 (Rekening Kas 1) – the main operational fund of the parish.
    *   Oversee all incoming revenue and outgoing expenditures for RK-1.
*   **Budget Oversight**:
    *   Monitor the implementation of the parish budget.
    *   Provide input for annual financial planning.
*   **Transaction Approval**:
    *   Approve KPD (Kegiatan dengan Permohonan Dana) requests within their authority limits.
    *   Authorize financial transfers and payments related to RK-1.
    *   Participate in multi-signature approvals for significant financial transactions.
*   **Reporting & Reconciliation**:
    *   Generate regular financial reports for the DPP and Pastor Paroki.
    *   Perform monthly reconciliation of RK-1 accounts.
    *   Respond to audit queries from the Internal Audit Team.
*   **Financial Compliance**:
    *   Ensure all financial operations comply with Church and civil regulations.
    *   Prevent financial anomalies and discrepancies, escalating critical issues.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   RK-1 balance and detailed transaction history.
    *   Queue of pending financial approvals (KPD, transfers).
    *   Budget vs. Actual expenditure reports.
    *   Financial anomaly alerts.
    *   Tools for generating monthly financial statements.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view financial history related to users (e.g., donations, dues payments) as per RLS.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 6 access, granting specific read/write permissions for managing RK-1 and related financial transactions.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules, particularly financial dashboards.
-   **Backend Endpoints**: Interacts with APIs for financial transactions (`/api/v1/financial`), KPD approvals (`/api/v1/kegiatan/kpd/approve`).
-   **Database Tables**: Access to `public.financial_accounts` (RK-1), `public.financial_transactions`, `public.kegiatan` (for KPD data).

## Edge Cases
-   **Financial Anomalies**: System automatically flags and alerts for suspicious transactions or negative balances.
-   **Over-Budget Requests**: KPD requests exceeding budget limits are flagged for review by higher authority.

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