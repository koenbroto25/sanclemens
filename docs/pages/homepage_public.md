# Public Homepage

This document describes the public-facing homepage of the Paroki Santo Klemens Digital Ecosystem, accessible to all users (Layer 0) without requiring authentication.

## URL
-   `/` (root of `sanclemens.com`)

## Purpose
-   Serve as the initial entry point for all users.
-   Provide general information about the parish, mass schedules, and announcements.
-   Offer clear calls to action for logging in or registering.
-   Showcase basic information bot (Bot 1).

## UI/UX Design
-   **Header**: Parish logo, navigation links (e.g., "Jadwal Misa", "Tentang Kami", "Kontak"), and "Masuk / Daftar" (Login / Register) buttons.
-   **Hero Section**: Prominent banner with parish imagery, a welcoming message, and key information or mission statement.
-   **Content Sections**:
    *   **Jadwal Misa**: Displays upcoming mass schedules.
    *   **Warta Paroki**: Latest news and announcements from the parish.
    *   **Profil Paroki**: Information about the parish history, vision, and mission.
    *   **Bot Info Publik (Bot 1)**: A floating chat bubble (similar to Gate Bot) or embedded widget for public information queries.
*   **Public Learning Page (`/learn-catholic`)**: 🆕 Direct access to the Unified Catholic Learning Module for guest users, featuring basic Catholic teachings, interactive Q&A via Bot 1 (Info Publik), and information about the full learning features available to registered users.
-   **Footer**: Comprehensive parish contact information, social media links, copyright.
-   **Palette**: Sacred, majestic, calm-liturgical (as per [UI/UX Overview](docs/_main_overview/uiux_overview.md) for Portal 1).

## Userflow
1.  **Access**: Any user navigates to `sanclemens.com`.
2.  **Information Browsing**: User can view public information about the parish, mass schedules, and news.
3.  **Bot Interaction**: User can interact with Bot 1 for general inquiries.
4.  **Login/Registration**: User can click "Masuk" or "Daftar" to initiate the authentication process.
5.  **No Gate Hub Access**: Layer 0 users do not see the `HomepageSwitcher` and cannot directly access the Gate Hub or other portals without logging in.

## Technical Details
-   **Frontend Component**: `apps/public-website/` (Next.js SSG - Static Site Generation) or the root `src/app/page.tsx` within the single monolith if the public-website app is merged.
-   **UI Components**: Standard informational components, navigation bar, hero banner, news cards, event listings.
-   **Data Sources**: Static content, or data fetched from a public API endpoint (e.g., `/api/public/mass-schedules`, `/api/public/announcements`).
-   **Routing**: Standard Next.js routing for public pages.

## Edge Cases
-   **Offline Access**: As an SSG (Static Site Generation) app, content can be served even if the backend is temporarily unavailable, offering basic information.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0 "TIGA PORTAL HOMEPAGE" (Layer 0 details)
-   [UI/UX Design System v3.0] §10.1 "Public Website (Layer 0)"
-   [Userflow v4.0] Bagian 1 "Gate Hub & Navigasi Tiga Portal" (Layer 0 context)
-   [AI Bot System](docs/features/ai_bot_system.md) (for Bot 1 details)