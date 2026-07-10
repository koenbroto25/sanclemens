# Role: Seller (Pasar Kasih Seller)

This document defines the role, responsibilities, and system access for sellers within the Pasar Kasih marketplace in the Paroki Santo Klemens Digital Ecosystem. Sellers are approved parishioners or parish-affiliated producers who list and sell products through the internal marketplace.

## Access Layer
-   **Layer 2** (Approved parishioner with seller capability)

## Purpose
-   Provide parishioners with a trusted channel to sell products and services.
-   Support the local solidarity economy through fair and transparent transactions.
-   Help reduce dependency on external platforms by creating an internal marketplace.
-   Maintain product quality and compliance with marketplace guidelines.

## Key Responsibilities
*   **Product Listing**: Create and maintain product listings with accurate names, descriptions, prices, photos, categories, and stock information.
*   **Order Fulfillment**: Accept, prepare, and fulfill confirmed orders within the agreed timeframe.
*   **Customer Communication**: Respond to buyer inquiries and coordinate delivery options when necessary.
*   **Compliance**: Ensure products comply with parish marketplace rules, legal requirements, and ethical standards.
*   **Transaction Integrity**: Use the official marketplace payment flow and avoid off-platform transactions that bypass records.
*   **Reporting**: Monitor sales, revenue, fees, and order status through the seller dashboard.

## Default Landing Page (Portal Context)
-   `/pasar-kasih` (Marketplace Homepage, with seller tools visible after seller approval).

## UI/UX & Key Functionalities
-   **Login**: Standard authenticated login as an approved parishioner.
-   **Seller Dashboard**: Access to seller tools, including:
    *   Product catalog management.
    *   Order status board.
    *   Inventory and stock management.
    *   Sales and fee summary.
    *   Buyer communication tools.
    *   Delivery coordination for Ojek Solidaritas or self-pickup.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, Digital Vault, and Companion Rohani as a Layer 2 user.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) after parishioner approval.
-   **Authorization**: RLS policies limit sellers to their own products, orders, and seller profile.
-   **Frontend Component**: Marketplace seller components under `/pasar-kasih` and `/pasar-kasih/seller`.
-   **Backend Endpoints**: Interacts with marketplace APIs for products, orders, inventory, seller profile, and Xendit payment flows.
-   **Database Tables**: Access to `public.products`, `public.orders`, `public.seller_profiles`, `public.financial_transactions` metadata, and `public.profiles`.

## Edge Cases
-   **Product Moderation Pending**: New or edited products are hidden until approved by Marketplace Manager.
-   **Stock Discrepancy**: System should handle out-of-stock updates and failed fulfillment.
-   **Off-platform Transactions**: Users should be warned that off-platform transactions are not protected by the system.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 3 Charity Marketplace](docs/pages/portal3_charity_market_page.md)
-   [Page: Portal 3 Marketplace Admin Dashboard](docs/pages/admin_dashboards/portal3_admin_dashboard_page.md)
-   [Role: Manager Marketplace](docs/roles/portal3_marketplace_roles/marketplace_manager_role.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)