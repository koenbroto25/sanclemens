# Role: Manager Marketplace (Marketplace Operations Manager)

This document defines the role, responsibilities, and system access for the Manager Marketplace within the Pasar Kasih marketplace in the Paroki Santo Klemens Digital Ecosystem. This role oversees marketplace operations, moderation, user support, and day-to-day quality control.

## Access Layer
-   **Layer 6-7** (Specific layer depends on delegated authority; generally Layer 7 for operations oversight, Layer 6 for marketplace management)

## Purpose
-   Ensure the Pasar Kasih marketplace operates fairly, transparently, and efficiently.
-   Maintain product quality, seller integrity, and buyer trust.
-   Support sellers, buyers, and Ojek Solidaritas drivers in resolving operational issues.
-   Coordinate with Bendahara III/Keuangan Marketplace for RK-3 financial reporting.

## Key Responsibilities
*   **Product Moderation**: Review and approve/reject product listings to ensure compliance with marketplace rules.
*   **User Management**: Manage seller and buyer registrations, resolve account issues, and enforce marketplace policies.
*   **Order Oversight**: Monitor order fulfillment, delivery issues, cancellations, and disputes.
*   **Campaigns & Promotions**: Plan and execute marketplace campaigns, promotions, and community engagement activities.
*   **Driver Oversight**: Monitor Ojek Solidaritas performance, delivery completion, and incident handling.
*   **Dispute Resolution**: Mediate conflicts between buyers, sellers, and drivers.
*   **Reporting**: Generate operational reports on sales, active sellers, product categories, order volume, and service quality.

## Default Landing Page (Portal Context)
-   `/dashboard/marketplace` (Marketplace Admin Dashboard, operations section).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password after Super Admin approval.
-   **Dashboard**: Access to `Portal3AdminDashboardPage.md` with operations modules:
    *   Product moderation queue.
    *   Seller and buyer management.
    *   Order tracking and fulfillment overview.
    *   Dispute resolution interface.
    *   Campaign management tools.
    *   Driver performance dashboard.
    *   Operational reports and alerts.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, Digital Vault, and Companion Rohani as permitted by Layer 6-7.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: RLS policies and middleware enforce marketplace operations access.
-   **Frontend Component**: `src/app/(dashboard)/marketplace/page.tsx` with operations-focused sub-components.
-   **Backend Endpoints**: Interacts with marketplace APIs for products, orders, users, disputes, campaigns, and delivery tasks.
-   **Database Tables**: Access to `public.products`, `public.orders`, `public.seller_profiles`, `public.delivery_tasks`, `public.disputes`, `public.profiles`, `public.financial_transactions` metadata.

## Edge Cases
-   **Non-compliant Products**: Products should be blocked until reviewed.
-   **Dispute Escalation**: Serious disputes should escalate to Pastor/Wakil or parish admin if fraud or abuse is suspected.
-   **Driver Safety**: Safety incidents should trigger immediate notification to marketplace admin and relevant pastoral contact.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 3 Marketplace Admin Dashboard](docs/pages/admin_dashboards/portal3_admin_dashboard_page.md)
-   [Page: Portal 3 Charity Marketplace](docs/pages/portal3_charity_market_page.md)
-   [Role: Keuangan Marketplace](docs/roles/portal3_marketplace_roles/marketplace_finance_role.md)
-   [Role: Bendahara III](docs/roles/portal1_dpp_roles/bendahara_iii_role.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)