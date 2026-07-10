# Feature: Cross-Portal Access & Global Navigation

This document describes the design and functionality of cross-portal access and global navigation within the Paroki Santo Klemens Digital Ecosystem. This feature ensures that core user functionalities and data, such as Family Data, Personal Profile, Digital Vault, and Companion Rohani, are accessible consistently across different user portals without requiring re-authentication or context switching.

## Purpose
-   Provide a seamless user experience by allowing access to essential features from any portal (Demografi Paroki, Lingkungan, Pasar Kasih).
-   Reinforce the idea of a unified digital ecosystem where user data is central and accessible according to their roles and permissions.
-   Reduce user friction and cognitive load by maintaining a consistent global navigation structure.
-   Ensure that critical personal data management and spiritual support tools are always within reach.

## Key Functionalities
*   **Global Navigation**: A persistent navigation element (e.g., a sidebar, top navigation bar, or floating action button) will be available across all authenticated portals. This navigation will include links to:
    *   **Family Data**: Allows users to view and manage their family members' profiles and relationships.
    *   **Personal Profile**: Provides access to their own personal information, sacramental records, and contact details.
    *   **Digital Vault**: Enables users to view, upload, and manage their personal and family documents.
    *   **Companion Rohani**: Direct access to the Spiritual Companion PWA for personal spiritual guidance and support.
*   **Context Preservation**: When navigating to a cross-portal feature, the system will attempt to preserve the user's previous portal context, allowing for easy return.
*   **Role-Based Access (RLS)**: While the navigation links are global, the actual data and actions within each feature remain strictly governed by Row-Level Security (RLS) policies based on the user's `access_layer` and any specific role-based permissions (e.g., only KLs can view certain environment-wide family data; a regular Umat Aktif can only view their own family data).
*   **Single Sign-On (SSO)**: Users remain authenticated across all portals once logged in via Gate Hub, eliminating the need for repeated logins.

## UI/UX & Key Implementations
-   **Consistent UI Element**: The global navigation component will have a consistent visual design and placement across all portal dashboards.
-   **Dynamic Content**: Content displayed within cross-portal features will dynamically adjust based on the user's `access_layer` and specific RLS rules. For example, a Ketua Lingkungan viewing "Family Data" might see options to edit family details within their environment, while a regular parishioner only sees their own family's data.
-   **Clear Feedback**: Users will receive clear feedback if they attempt to access data or functionality for which they do not have permissions, rather than a broken page.

## Technical Details
-   **Middleware**: Application middleware will handle route protection and ensure users are authenticated and authorized before accessing any portal or cross-portal feature.
-   **Supabase RLS**: Extensive use of Supabase Row-Level Security policies on tables like `public.profiles`, `public.families`, `public.digital_vault`, and `public.companion_interactions` to enforce fine-grained access control.
-   **Shared Data Layer**: Core data models and API endpoints for Family, Profile, Digital Vault, and Companion Rohani will be designed to be accessible by all portals, with authorization checks at the API level.
-   **Frontend Routing**: Frontend routing will manage navigation transitions between portals and cross-portal features, potentially using client-side routing libraries (e.g., Next.js App Router).

## Edge Cases
-   **Unauthorized Access**: Robust RLS and middleware prevent unauthorized users from bypassing restrictions, even if they somehow obtain a direct link.
-   **Data Synchronization**: Ensure data changes made through one portal or feature are immediately reflected across all relevant views.
-   **Performance**: Optimize data fetching and rendering for cross-portal features to maintain a smooth user experience, especially when dealing with large datasets or complex RLS.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Gate Hub](docs/pages/gate_hub_page.md)
-   [Page: Portal 1 Demography](docs/pages/portal1_demography_page.md)
-   [Page: Portal 2 Environment Homepage](docs/pages/portal2_environment_homepage.md)
-   [Page: Portal 3 Charity Marketplace](docs/pages/portal3_charity_market_page.md)
-   [Page: Family Data Page](docs/pages/family_page.md)
-   [Page: Personal Profile Page](docs/pages/personal_profile_page.md)
-   [Feature: Digital Vault & OCR Integration](docs/features/digital_vault_ocr_feature.md)
-   [Page: Companion PWA](docs/pages/companion_pwa_page.md)
-   [Feature: Security RLS](docs/features/security_rls.md)