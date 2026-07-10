# Role: Public Visitor (Non-Authenticated User)

This document defines the role and access for non-authenticated visitors of the Paroki Santo Klemens Digital Ecosystem. Public visitors can view public-facing information but cannot access personal, family, environment, or administrative data.

## Access Layer
-   **Layer 0**

## Purpose
-   Provide public access to parish information, announcements, and basic resources.
-   Allow visitors to explore the parish's digital presence without requiring an account.
-   Guide visitors toward registration or login when they need personalized features.

## Key Responsibilities
*   **Public Information Access**: View public homepage, parish profile, announcements, mass schedules, and general contact information.
*   **No Personal Data Access**: Do not access family records, user profiles, environment data, or administrative dashboards.
*   **Respect Usage Limits**: Use public bots and information services within intended boundaries.

## Default Landing Page (Portal Context)
-   `/` (Public Homepage / Demografi Paroki public section).

## UI/UX & Key Functionalities
-   **Homepage Access**: View public content without authentication.
-   **Registration/Login Entry Points**: Access registration and login pages.
-   **Public Bot**: Access Bot 1 for public parish information if available.
-   **Restricted Navigation**: Gate Hub and authenticated portal features are unavailable until login.

## Technical Details
-   **Authentication**: None.
-   **Authorization**: Public read-only access to configured public content.
-   **Frontend Components**: Uses public homepage components and public announcement/schedule views.
-   **Backend Endpoints**: Interacts only with public APIs for static content, announcements, schedules, and bot queries.
-   **Database Tables**: No direct authenticated user access; public data is exposed through controlled APIs or public-safe views.

## Edge Cases
-   **Sensitive Data Leakage**: Public APIs must never expose profile, family, GAKIN, SOS, or document metadata.
-   **Bot Misuse**: Public bot should have rate limits and safe responses.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Public Homepage](docs/pages/homepage_public.md)
-   [Page: Login](docs/pages/auth/login_page.md)
-   [Page: Registration](docs/pages/auth/registration_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)