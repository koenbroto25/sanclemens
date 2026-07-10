# Role: Keuangan Marketplace (Marketplace Finance)

This document defines the role, responsibilities, and system access for the Keuangan Marketplace (Marketplace Finance) within the Pasar Kasih marketplace in the Paroki Santo Klemens Digital Ecosystem. This role focuses on RK-3 financial oversight, payment reconciliation, fee management, and marketplace financial reporting.

## Access Layer
-   **Layer 6**

## Purpose
-   Ensure transparent and accountable financial management for the Pasar Kasih marketplace.
-   Reconcile marketplace transactions with Xendit/payment gateway records and internal RK-3 accounts.
-   Monitor marketplace fees, driver compensation, refunds, and operational expenses.
-   Provide financial reports to Bendahara III, Pastor, and DPP as needed.

## Key Responsibilities
*   **RK-3 Financial Oversight**: Monitor marketplace-related income, expenses, fees, and transfers under RK-3.
*   **Payment Reconciliation**: Reconcile Xendit/QRIS payments with internal order and transaction records.
*   **Fee Management**: Ensure marketplace fees are applied correctly and recorded transparently.
*   **Driver Compensation**: Verify driver compensation and payout calculations.
*   **Refund & Dispute Finance**: Process or approve refunds, cancellations, and dispute-related financial adjustments.
*   **Reporting**: Generate financial reports for marketplace revenue, fees, refunds, operational costs, and net income.
*   **Audit Support**: Provide data and explanations during internal or external audits of RK-3.

## Default Landing Page (Portal Context)
-   `/dashboard/marketplace` (Marketplace Admin Dashboard, finance section).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password after Super Admin approval.
-   **Dashboard**: Access to `Portal3AdminDashboardPage.md` with finance modules:
    *   RK-3 marketplace balance and transaction history.
    *   Xendit/payment reconciliation panel.
    *   Fee and commission reports.
    *   Refund and cancellation log.
    *   Driver payout summary.
    *   Exportable financial reports.
    *   Anomaly alerts for suspicious or unusual transactions.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, Digital Vault, and Companion Rohani as permitted by Layer 6.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: RLS policies and middleware enforce marketplace finance access.
-   **Frontend Component**: `src/app/(dashboard)/marketplace/page.tsx` with finance-focused sub-components.
-   **Backend Endpoints**: Interacts with marketplace finance APIs, Xendit webhook endpoints, and RK-3 financial transaction APIs.
-   **Database Tables**: Access to `public.financial_accounts` (RK-3), `public.financial_transactions`, `public.orders`, `public.products`, `public.delivery_tasks`, `public.refunds`, `public.profiles`.

## Edge Cases
-   **Payment Gateway Discrepancy**: System should flag mismatches between Xendit records and internal order payments.
-   **Refund Abuse**: Repeated or suspicious refunds should trigger review by Marketplace Manager.
-   **Fee Misconfiguration**: Fee changes should require approval and audit logging.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 3 Marketplace Admin Dashboard](docs/pages/admin_dashboards/portal3_admin_dashboard_page.md)
-   [Role: Manager Marketplace](docs/roles/portal3_marketplace_roles/marketplace_manager_role.md)
-   [Role: Bendahara III](docs/roles/portal1_dpp_roles/bendahara_iii_role.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)