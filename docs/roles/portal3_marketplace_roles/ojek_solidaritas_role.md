# Role: Ojek Solidaritas (Marketplace Delivery Driver)

This document defines the role, responsibilities, and system access for Ojek Solidaritas drivers within the Pasar Kasih marketplace in the Paroki Santo Klemens Digital Ecosystem. Ojek Solidaritas is the internal delivery service that supports marketplace orders and parish logistics.

## Access Layer
-   **Layer 2** (Approved parishioner with driver capability)

## Purpose
-   Provide trusted internal delivery services for marketplace orders.
-   Support parishioners who need logistical assistance, especially elderly or vulnerable members.
-   Strengthen the solidarity economy by keeping delivery services within the parish community.
-   Create transparent, documented, and accountable delivery workflows.

## Key Responsibilities
*   **Delivery Acceptance**: Accept delivery tasks assigned through the marketplace system.
*   **Order Pickup and Delivery**: Pick up products from sellers and deliver them to buyers according to agreed timing and instructions.
*   **Status Updates**: Update order delivery status accurately (accepted, picked up, in transit, delivered, failed).
*   **Cashless Preference**: Use the official payment/delivery flow whenever possible; avoid undocumented cash handling unless explicitly allowed.
*   **Care for Vulnerable Customers**: Provide respectful and safe assistance to elderly or vulnerable recipients.
-   **Incident Reporting**: Report failed deliveries, damaged goods, missing recipients, or suspicious activity through the system.

## Default Landing Page (Portal Context)
-   `/pasar-kasih/ojek-internal` (Ojek Solidaritas dashboard).

## UI/UX & Key Functionalities
-   **Login**: Standard authenticated login as an approved parishioner.
-   **Driver Dashboard**: Access to:
    *   Available delivery tasks.
    *   Assigned order details and route information.
    *   Delivery status update buttons.
    *   Earnings or compensation summary.
    *   Incident reporting form.
    *   Delivery history.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, Digital Vault, and Companion Rohani as a Layer 2 user.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) after parishioner approval.
-   **Authorization**: RLS policies limit drivers to assigned delivery tasks and related order metadata only.
-   **Frontend Component**: Ojek Solidaritas components under `/pasar-kasih/ojek-internal`.
-   **Backend Endpoints**: Interacts with marketplace delivery APIs for task assignment, status updates, route data, and incident reports.
-   **Database Tables**: Access to `public.orders`, `public.delivery_tasks`, `public.delivery_incidents`, `public.profiles`, and related metadata.

## Edge Cases
-   **Failed Delivery**: Driver must record reason and trigger buyer/seller notification.
-   **Recipient Unavailable**: System should support reschedule or return-to-seller workflow.
-   **Safety Incident**: Drivers should be able to report unsafe situations and escalate to KL or marketplace admin.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 3 Charity Marketplace](docs/pages/portal3_charity_market_page.md)
-   [Role: Buyer](docs/roles/portal3_marketplace_roles/buyer_role.md)
-   [Role: Seller](docs/roles/portal3_marketplace_roles/seller_role.md)
-   [Role: Manager Marketplace](docs/roles/portal3_marketplace_roles/marketplace_manager_role.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)