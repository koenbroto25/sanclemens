# Portal 3: Pasar Kasih Page

This document details the Portal 3 (Pasar Kasih) page, which initially serves as a "Coming Soon" page in Phase 1 and will evolve into a full-fledged marketplace in Phase 4.

## URL
-   `/pasar-kasih` (within the `src/app/pasar-kasih/` route group, accessible from Gate Hub)

## Purpose
-   **Phase 1 (Coming Soon)**: Inform users about the upcoming solidarity marketplace, gather interest through pre-registration, and build anticipation.
-   **Phase 4 (Full Marketplace)**: Provide a platform for parishioners to buy and sell goods and services, fostering internal economy and solidarity.

## UI/UX Design
### Phase 1: Coming Soon
-   **Header**: "🛒 PASAR KASIH — SEGERA HADIR!" (CHARITY MARKET — COMING SOON!).
-   **Description**: Text explaining the concept of a digital market for the parish community, highlighting features like "Berjualan" (Selling), "Belanja" (Shopping), "Ojek Solidaritas" (Solidarity Delivery), and "Beli untuk Sesama" (Buy for Others).
-   **Pre-registration**: Buttons for "Daftar Jadi Seller" (Register as Seller) and "Pelajari Lebih Lanjut" (Learn More).
-   **Interest Metrics**: Displays statistics of pre-registered sellers and drivers (e.g., "12 Umat Siap Berjualan", "5 Driver Siap Antar").
-   **Launch Target**: "Target Peluncuran: Fase 4 (Q1 2027)".
-   **Testimonials (Optional)**: Short quotes from parishioners expressing excitement.
-   **Palette**: Modern, dynamic, energetic (as per [UI/UX Overview](docs/_main_overview/uiux_overview.md) for Portal 3).

### Phase 4: Full Marketplace (Conceptual, will be detailed in separate documents)
-   Product catalog with categories and filters.
-   Checkout process integrated with Xendit.
-   Dashboards for sellers, buyers, and marketplace administrators.
-   Internal "Ojek Solidaritas" (delivery service).

## Userflow
### Phase 1: Coming Soon
1.  **Entry from Gate Hub**: User selects "Portal 3 - Pasar Kasih" from the Gate Hub.
2.  **Information Display**: The "Coming Soon" page loads, providing details about the future marketplace.
3.  **Pre-registration**: Users (Layer 2+) can click "Daftar Jadi Seller" or "Daftar Jadi Driver" to express their interest. This typically involves submitting a simple form that saves their intent in a database (e.g., `public.marketplace_preregistration`).
4.  **Learning More**: Users can click "Pelajari Lebih Lanjut" for more details about the marketplace concept.

### Phase 4: Full Marketplace
1.  **Product Management**: Sellers create and manage product listings.
2.  **Browsing & Purchasing**: Buyers browse products, add to cart, and complete purchases via Xendit.
3.  **Order Fulfillment**: Sellers process orders, and Ojek Solidaritas drivers handle deliveries.
4.  **Admin Oversight**: Marketplace managers and finance roles oversee operations, product moderation, and financial transactions.

## Technical Details
-   **Frontend Component**: `src/app/pasar-kasih/page.tsx` (for Phase 1), with a sub-route `(fase4)/` for the full marketplace.
-   **UI Components**: Custom components for "Coming Soon" display, pre-registration forms.
-   **Data Sources**: (Phase 1) `public.marketplace_preregistration` table. (Phase 4) `public.products`, `public.orders`, `public.sellers`, `public.drivers` tables.
-   **Payment Gateway**: Xendit (for Phase 4).
-   **Routing**: Next.js in-app routing, with `/pasar-kasih` as a sub-route of `sanclemens.com`.

## Edge Cases
-   **Public Access**: The "Coming Soon" page may be accessible to Layer 0 users as well, with pre-registration restricted to Layer 2+ users.
-   **Transition**: A clear plan is needed for transitioning from the "Coming Soon" page to the full marketplace in Phase 4.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0.5 "Portal 3 — Pasar Kasih (Coming Soon)"
-   [UI/UX Design System v3.0] §12.1 "Fase 1 — Coming Soon"
-   [Userflow v4.0] Bagian 18 "Pintu 3: Pasar Kasih (Coming Soon → Marketplace)"