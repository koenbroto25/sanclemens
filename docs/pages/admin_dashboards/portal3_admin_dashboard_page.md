# Portal 3: Marketplace Admin Dashboard Page

This document details the Marketplace Admin Dashboard page, designed for administrators overseeing the Pasar Kasih (Charity Market) within Portal 3. This includes roles such as Marketplace Manager and Marketplace Finance.

## URL
-   `/dashboard/marketplace` (within `src/app/(dashboard)/marketplace/` route group)

## Purpose
-   Provide a centralized dashboard for managing all aspects of the Pasar Kasih marketplace.
-   Enable administrators to oversee product listings, seller/buyer management, order fulfillment, and financial transactions.
-   Monitor marketplace performance and ensure fair and transparent operations.

## UI/UX Design
-   **Dashboard Layout**: A customized layout presenting panels and widgets for marketplace-specific functionalities.
-   **Overview Statistics**: Displays key marketplace metrics, such as total sellers, active products, total orders, revenue, and pending issues.
-   **Product Management**:
    *   **Product Catalog**: View and manage all listed products, including approval/rejection for new submissions, editing details, and managing inventory.
    *   **Product Moderation**: Tools to moderate product content for compliance with guidelines.
-   **User Management (Sellers & Buyers)**:
    *   **Seller List**: Manage registered sellers, including verification, status updates, and performance monitoring.
    *   **Buyer List**: View registered buyers and their activity.
    *   **Ojek Driver List**: Manage registered Ojek Solidaritas drivers, including approval and assignment.
-   **Order Fulfillment**:
    *   **Order List**: Track all orders from placement to fulfillment, with status updates.
    *   **Delivery Management**: Oversee Ojek Solidaritas delivery assignments and progress.
-   **Financial Management**:
    *   **Transaction Logs**: Detailed logs of all marketplace transactions, including payments via Xendit and disbursements.
    *   **RK-3 (Ekonomi & Digital) Monitoring**: Overview of RK-3's financial status, including income from marketplace fees and operational expenses.
    *   **Fee Management**: Configure marketplace fees (e.g., 3-5% as per GDD).
-   **Dispute Resolution**: Tools to handle buyer-seller disputes or other marketplace-related issues.
-   **Communication**: Tools to broadcast announcements or policy updates to sellers and buyers.

## Userflow
1.  **Login**: Admin logs in via `/admin/login` (WhatsApp number + password) after being approved by Super Admin.
2.  **Redirection**: Upon successful login, the admin is redirected to `/dashboard/marketplace`.
3.  **Marketplace Oversight**: The dashboard dynamically displays data and tools relevant to their role (Marketplace Manager or Marketplace Finance).
4.  **Product & Order Management**: Approves new products, manages existing listings, and monitors the order fulfillment process.
5.  **Financial Monitoring**: Oversees marketplace financial performance, ensures proper transaction logging, and manages RK-3.
6.  **User Support**: Addresses seller/buyer queries or disputes.

## Technical Details
-   **Frontend Component**: `src/app/(dashboard)/marketplace/page.tsx`.
-   **UI Components**: Various custom components for product listings, order tables, user management, and financial charts.
-   **Backend Endpoints**: APIs under `/api/pasar-kasih/` and `/api/v1/marketplace/` (e.g., `/api/pasar-kasih/products`, `/api/pasar-kasih/orders`, `/api/v1/financial/rk3`).
-   **Database Tables**: Access to `public.products`, `public.orders`, `public.sellers`, `public.drivers`, `public.financial_transactions` (for RK-3), `public.profiles` (for seller/buyer/driver roles).
-   **Authorization**: RLS policies and middleware enforce access based on `access_layer` and marketplace-specific roles.
-   **Payment Gateway**: Xendit integration for transaction processing.

## Edge Cases
-   **Product Moderation Issues**: Automatic flagging of non-compliant products for review.
-   **Payment Failures**: Logging and reconciliation processes for failed Xendit transactions.
-   **RK-3 Anomalies**: Alerts for unusual financial activities within RK-3.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0.5 "Portal 3 — Pasar Kasih (Coming Soon)"
-   [GDD v4.0] BAB XI "Dual-Ledger Financial Engine" (for RK-3)
-   [Masterplan v4.0] Fase 4 "EKONOMI INTERNAL"
-   [Userflow v4.0] Bagian 18 "Pintu 3: Pasar Kasih (Coming Soon → Marketplace)", Bagian 22.3 "Dashboard Per Role Admin"
-   [Role: Marketplace Manager](docs/roles/portal3_marketplace_roles/marketplace_manager_role.md)
-   [Role: Marketplace Finance](docs/roles/portal3_marketplace_roles/marketplace_finance_role.md)