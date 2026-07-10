# Portal 1: Parish Demography Page

This document details the Parish Demography page, which is the default landing page for users (Layer 2+) entering Portal 1 (Paroki). It provides a statistical overview of the parish before users navigate to their specific role dashboards.

## URL
-   `/` (within the `src/app/(dashboard)/` route group, after selecting Portal 1 from Gate Hub)

## Purpose
-   Provide a high-level statistical overview of the parish's demographics.
-   Display key metrics for total parishioners, new members, active environments, and worship participation.
-   Offer a glimpse into sensitive data like GAKIN for authorized roles.
-   Serve as an informational hub before deeper role-specific dashboards.

## UI/UX Design
-   **Header**: "🏛️ PORTAL 1 — PAROKI" with a welcoming tone.
-   **Key Statistics Cards (`StatCard.tsx`)**: Four cards displaying:
    1.  Total Parishioners (e.g., "2.847 Jiwa") with an icon.
    2.  New Parishioners This Month (e.g., "+12 Jiwa") with an upward trend indicator.
    3.  Active Environments (e.g., "10 dari 12 Lingkungan") with a progress bar.
    4.  Worship Participation (e.g., "68% Minggu Ini") with a donut chart or similar visual.
-   **"Selamat Datang Umat Baru" Section (`WelcomeNewUmat.tsx`)**: Displays a list of recently registered parishioners with their respective environments.
-   **Demographic Statistics Grid**: A grid (e.g., 2x4 or 4x2 layout) showing detailed demographic breakdowns:
    *   Gender (Laki-laki, Perempuan)
    *   Age Groups (Anak, Remaja, Dewasa, Lansia)
    *   Families (KK) and Regions (Wilayah).
-   **Sacrament Statistics Table (`SakramenChart.tsx`)**: Displays annual and all-time statistics for Sacraments (Baptism, Communion, Confirmation, Marriage).
-   **GAKIN Data Card (`GakinCard.tsx`)**: (Only visible for Pastor, Wakil DPP, Komsos/Seksos, KL)
    *   Summary of verified impoverished families (e.g., "Total KK GAKIN Aktif: 47 KK (6.6%)")
    *   Breakdown per region.
    *   "Lihat Detail Data GAKIN" button, linking to `/data-gakin`.
-   **Call to Action**: "Dashboard Saya" button, which scrolls to the user's role-specific dashboard if applicable, or "Lihat Semua Statistik" button.

## Userflow
1.  **Entry from Gate Hub**: User selects "Portal 1 - Paroki" from the Gate Hub.
2.  **Initial View**: The Parish Demography page loads, presenting a general overview.
3.  **Information Consumption**: Users can review the statistics, new member greetings, and sacrament data.
4.  **Accessing Role Dashboard**: Users with specific roles (e.g., Pastor, KL) can scroll down or click a "Dashboard Saya" button to access their role-specific dashboard content, which is integrated below the general demography.
5.  **GAKIN Data Access**: Authorized roles can view the GAKIN summary and navigate to the detailed `/data-gakin` page.

## Technical Details
-   **Frontend Component**: `src/app/(dashboard)/page.tsx`.
-   **UI Components**: `StatCard.tsx`, `WelcomeNewUmat.tsx`, `SakramenChart.tsx`, `GakinCard.tsx`.
-   **Data Sources**: Aggregated data from `public.profiles`, `public.families`, `public.sacraments`, `public.data_gakin` tables.
-   **Authorization**: Role-Based Access Control (RLS) is applied to display sensitive data like GAKIN based on the user's `access_layer`.
-   **Data Fetching**: Likely uses TanStack Query for efficient server-side state management and caching.

## Edge Cases
-   **No Data**: Appropriate empty states for statistics if data is not yet available.
-   **Unauthorized GAKIN Access**: The `GakinCard` component is conditionally rendered or data within it is masked for unauthorized users.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0.3 "Portal 1 — Paroki (Demografi → Dashboard)"
-   [UI/UX Design System v3.0] §5.3 "Layout Demografi Paroki", §10.2a "Halaman Demografi Paroki"
-   [Userflow v4.0] Bagian 3 "Portal 1: Demografi → Dashboard per Role"
-   [Feature: GAKIN Approval Flow](docs/features/gakin_approval_flow.md)