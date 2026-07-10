# Role: Bendahara II (Treasurer II of DPP)

This document defines the role, responsibilities, and system access for the Bendahara II (Treasurer II) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. Bendahara II is primarily responsible for managing the parish's social funds (RK-2), including Dana Kasih and Dana Duka.

## Access Layer
-   **Layer 6**

## Purpose
-   Manage and oversee RK-2 (Rekening Kas 2), dedicated to social and charitable activities.
-   Administer the Dana Kasih (Charity Fund) and Dana Duka (Bereavement Fund) processes.
-   Ensure transparent and accountable disbursement of social funds to those in need.
-   Collaborate with the Diakonia Bidang (Service and Charity Division) for social programs.

## Key Responsibilities
*   **Social Fund Management (RK-2)**:
    *   Manage RK-2, handling donations and disbursements for Dana Kasih and Dana Duka.
    *   Ensure all transactions comply with the "Invisible Grace" principle (anonymity for donors/recipients where applicable).
*   **Dana Kasih Administration**:
    *   Participate in the multi-signature approval flow for Dana Kasih disbursements (co-approves with Wakil Ketua II).
    *   Oversee the escrow mechanism for Dana Kasih donations (via Xendit).
    *   Ensure funds are disbursed according to approved requests and criteria.
*   **Dana Duka Administration**:
    *   Input `iuran` (dues) for Dana Duka.
    *   Process and manage the disbursement of funds for bereaved families, coordinating with Ketua Lingkungan (KL).
*   **Financial Reporting (Social Funds)**:
    *   Generate specific reports on Dana Kasih and Dana Duka activities.
    *   Provide data for reconciliation and audit processes, focusing on RK-2.
*   **Compliance & Audit**:
    *   Ensure adherence to financial policies for social funds.
    *   Collaborate with the Audit Team during audits of RK-2.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   RK-2 balance and detailed transaction history (donations, disbursements).
    *   Queue for Dana Kasih disbursement approvals.
    *   Interface for managing Dana Duka contributions and payouts.
    *   Reports for social fund activities.
    *   Alerts for any anomalies in RK-2.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view financial history related to social contributions or aid received by users, as per RLS.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 6 access, granting specific read/write permissions for RK-2, Dana Kasih, and Dana Duka.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules, particularly social financial dashboards.
-   **Backend Endpoints**: Interacts with APIs for `dana_kasih`, `dana_duka`, and financial transactions related to RK-2. Integrates with Xendit webhooks for escrow.
-   **Database Tables**: Access to `public.financial_accounts` (RK-2), `public.financial_transactions`, `public.dana_kasih`, `public.dana_kasih_donations`, `public.dana_kasih_disbursements`, `public.data_gakin` (for context).

## Edge Cases
-   **Escrow Failures**: System should have clear handling for Xendit escrow failures or discrepancies.
-   **Disbursement to Unbanked**: Workflow for disbursing funds through KLs to parishioners without bank accounts.
-   **Invisible Grace Violation**: System must strictly enforce anonymity where defined, preventing exposure of sensitive recipient/donor data.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: Dana Kasih Escrow](docs/features/dana_kasih_escrow.md) (will create later)
-   [Feature: 3 Pintu Kasih](docs/features/3_pintu_kasih.md) (will create later)
-   [Feature: Dana Duka Digital](docs/features/dana_duka_digital.md) (will create later)
-   [Feature: Audit Keuangan Otomatis](docs/features/audit_keuangan_otomatis.md) (will create later)