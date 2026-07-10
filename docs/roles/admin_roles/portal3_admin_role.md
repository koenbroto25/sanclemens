# Role: Admin Portal 3 (Marketplace Admin)

This document defines the responsibilities and access for administrators managing Portal 3 (Pasar Kasih) functions within the Paroki Santo Klemens Digital Ecosystem. This category includes roles such as Marketplace Manager and Marketplace Finance, overseeing the internal solidarity economy.

## Access Layer
-   **Layer 6-7** (Specific layer depends on the individual Marketplace role)

## Purpose
-   Oversee and manage the operational and financial aspects of the Pasar Kasih marketplace.
-   Ensure fair trade, product quality, and efficient transaction processing.
-   Support sellers, buyers, and Ojek Solidaritas drivers.
-   Monitor the financial health of RK-3 (Ekonomi & Digital) related to marketplace activities.

## Key Responsibilities
*   **Marketplace Manager (Layer 6-7)**:
    *   **Product Moderation**: Review and approve/reject new product listings to ensure compliance with marketplace guidelines.
    *   **Seller/Buyer Management**: Manage seller registrations, resolve disputes, and support users.
    *   **Order Oversight**: Monitor order fulfillment and delivery processes.
    *   **Campaigns & Promotions**: Plan and execute promotional activities for the marketplace.
    *   **Driver Management**: Oversee Ojek Solidaritas driver registrations and performance.
*   **Marketplace Finance (Layer 6)**:
    *   **RK-3 Financial Oversight**: Monitor income from marketplace fees and manage operational expenses within RK-3.
    *   **Transaction Reconciliation**: Reconcile Xendit payments with internal records.
    *   **Fee Management**: Ensure correct application of marketplace fees.
    *   **Reporting**: Generate financial reports specific to the marketplace.

## Default Landing Page (Portal Context)
-   `/dashboard/marketplace` (The specific content and tools within this dashboard are dynamically customized based on the user's detailed Marketplace admin role).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: `Portal3AdminDashboardPage.md` describes the marketplace-specific dashboard layout, which includes:
    *   Marketplace statistics (sellers, products, orders, revenue).
    *   Product catalog for moderation and management.
    *   Lists of sellers, buyers, and Ojek drivers.
    *   Order tracking and fulfillment tools.
    *   RK-3 financial overview (for finance roles).
    *   Dispute resolution interface.
    *   Communication tools for broadcasting messages.
-   **Navigation**: Contextual navigation within the dashboard to different modules. Global navigation elements (sidebar, navbar) allow access to cross-portal features.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani is available. Marketplace admins can view profiles of sellers/buyers/drivers for operational purposes.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) for admin users.
-   **Authorization**: RLS policies and middleware enforce access based on `access_layer` and marketplace-specific roles, ensuring data and functional segregation.
-   **Frontend Component**: `src/app/(dashboard)/marketplace/page.tsx`, which acts as a dispatcher for various role-specific sub-components.
-   **Backend Endpoints**: APIs under `/api/pasar-kasih/` and `/api/v1/marketplace/` (e.g., `/api/pasar-kasih/products`, `/api/pasar-kasih/orders`, `/api/v1/financial/rk3`).
-   **Database Tables**: Access to `public.products`, `public.orders`, `public.sellers`, `public.drivers`, `public.financial_transactions` (for RK-3), `public.profiles`.
-   **Payment Gateway**: Xendit integration for all transactions.

## Edge Cases
-   **Non-compliant Products**: System flags products for moderation, requiring admin review.
-   **Dispute Resolution**: Clear workflow for handling conflicts between marketplace participants.
-   **RK-3 Financial Anomalies**: Alerts generated for unusual transactions or discrepancies.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 3 Marketplace Admin Dashboard](docs/pages/admin_dashboards/portal3_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0.5 "Portal 3 — Pasar Kasih (Coming Soon)"
-   [Masterplan v4.0] Fase 4 "EKONOMI INTERNAL"
-   [Userflow v4.0] Bagian 18 "Pintu 3: Pasar Kasih (Coming Soon → Marketplace)"
-   [Role: Manager Marketplace](docs/roles/portal3_marketplace_roles/marketplace_manager_role.md)
-   [Role: Keuangan Marketplace](docs/roles/portal3_marketplace_roles/marketplace_finance_role.md)