# Role: Buyer (Pasar Kasih Buyer)

This document defines the role, responsibilities, and system access for buyers within the Pasar Kasih marketplace in the Paroki Santo Klemens Digital Ecosystem. Buyers are approved parishioners who browse, purchase, and receive products or services through the internal marketplace.

## Access Layer
-   **Layer 2** (Approved parishioner with buyer capability)

## Purpose
-   Provide parishioners with a trusted internal channel to purchase goods and services.
-   Support local producers and the parish solidarity economy.
-   Encourage transparent, documented, and fair transactions.
-   Enable convenient ordering and delivery coordination through the marketplace.

## Key Responsibilities
*   **Product Discovery**: Browse products, compare prices, read descriptions, and select items that meet their needs.
*   **Order Placement**: Place orders through the official marketplace payment flow.
*   **Payment Compliance**: Use approved payment methods such as Xendit, QRIS, or other configured parish payment options.
*   **Order Communication**: Communicate with sellers regarding availability, delivery timing, and order details.
*   **Ethical Use**: Avoid abuse, false disputes, chargeback misuse, or off-platform transactions that bypass system records.
*   **Feedback**: Provide ratings, reviews, or issue reports to improve marketplace quality.

## Default Landing Page (Portal Context)
-   `/pasar-kasih` (Marketplace Homepage).

## UI/UX & Key Functionalities
-   **Login**: Standard authenticated login as an approved parishioner.
-   **Buyer Experience**: Access to:
    *   Product catalog and search.
    *   Product detail pages.
    *   Cart and checkout.
    *   Order history and tracking.
    *   Seller communication.
    *   Delivery options, including Ojek Solidaritas when available.
    *   Ratings, reviews, and dispute submission.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, Digital Vault, and Companion Rohani as a Layer 2 user.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) after parishioner approval.
-   **Authorization**: RLS policies limit buyers to their own orders, payment records, and marketplace interactions.
-   **Frontend Component**: Marketplace buyer components under `/pasar-kasih`.
-   **Backend Endpoints**: Interacts with marketplace APIs for products, cart, checkout, orders, payments, delivery, and feedback.
-   **Database Tables**: Access to `public.products`, `public.orders`, `public.orders_items`, `public.financial_transactions` metadata, `public.profiles`, and marketplace feedback tables.

## Edge Cases
-   **Seller Out of Stock**: Checkout should prevent purchase or prompt seller confirmation.
-   **Failed Payment**: Orders remain pending until payment is confirmed or expired.
-   **Dispute Abuse**: Repeated false disputes should trigger review by Marketplace Manager.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 3 Charity Marketplace](docs/pages/portal3_charity_market_page.md)
-   [Role: Seller](docs/roles/portal3_marketplace_roles/seller_role.md)
-   [Role: Ojek Solidaritas](docs/roles/portal3_marketplace_roles/ojek_solidaritas_role.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)