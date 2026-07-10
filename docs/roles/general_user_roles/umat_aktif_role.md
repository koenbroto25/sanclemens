# Role: Umat Aktif (Active Parishioner)

This document defines the role, responsibilities, and system access for the Umat Aktif (Active Parishioner) within the Paroki Santo Klemens Digital Ecosystem. This is the default role for approved parishioners and serves as the foundation for most user-facing features across all portals.

## Access Layer
-   **Layer 2**

## Purpose
-   Access the digital ecosystem as an approved parishioner.
-   Manage personal and family data responsibly.
-   Participate in parish life, environment activities, spiritual formation, and parish services.
-   Use cross-portal features such as Family Data, Personal Profile, Digital Vault, and Companion Rohani according to permission rules.

## Key Responsibilities
*   **Data Accuracy**: Keep personal profile, family data, contact information, and sacramental records up to date.
*   **Parish Participation**: Participate in mass schedules, environment activities, parish programs, and community events.
*   **Compliance with Digital Rules**: Use the system ethically, protect login credentials, and respect privacy of other parishioners.
*   **Service Requests**: Submit requests through appropriate channels, such as sacrament support, document verification, GAKIN status changes, or SOS assistance.
*   **Companion Rohani Usage**: Use the Spiritual Companion feature for personal spiritual support while understanding its privacy and safety boundaries.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki) or `/lingkungan/[slug]` (Environment Homepage), depending on the selected portal from Gate Hub.

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` or standard authenticated login, depending on implementation, using WhatsApp number and password.
-   **Gate Hub**: After login, users select a portal:
    *   **Portal 1 - Demografi Paroki**: View parish statistics, announcements, and general parish information.
    *   **Portal 2 - Lingkungan**: View environment homepage, prayer schedules, local announcements, activities, and personal family data.
    *   **Portal 3 - Pasar Kasih**: Browse marketplace, buy/sell products, or use Ojek Solidaritas services when available.
-   **Cross-Portal Data Access**: Access to Family Data, Personal Profile, Digital Vault, and Companion Rohani is available from global navigation elements, subject to RLS and feature-specific permissions.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) after registration and KL approval.
-   **Authorization**: Layer 2 access enforced by RLS policies, limiting users to their own family/profile data and public parish data.
-   **Frontend Components**: Uses portal-specific pages such as `docs/pages/portal1_demography_page.md`, `docs/pages/portal2_environment_homepage.md`, `docs/pages/family_page.md`, `docs/pages/companion_pwa_page.md`.
-   **Backend Endpoints**: Interacts with APIs for profiles, families, environment data, announcements, activities, digital vault metadata, and companion features.
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.digital_vault` metadata, `public.activities`, `public.prayer_schedules`, and feature-specific tables.

## Edge Cases
-   **Pending Approval**: New users remain in Layer 1 Waiting Room until KL approval.
-   **Data Change Requests**: Sensitive changes may require KL or Sekretaris Paroki verification.
-   **Companion Safety**: Companion interactions must follow safety, abuse, and escalation policies.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Gate Hub](docs/pages/gate_hub_page.md)
-   [Page: Portal 1 Demography](docs/pages/portal1_demography_page.md)
-   [Page: Portal 2 Environment Homepage](docs/pages/portal2_environment_homepage.md)
-   [Page: Family Data](docs/pages/family_page.md)
-   [Page: Companion PWA](docs/pages/companion_pwa_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)