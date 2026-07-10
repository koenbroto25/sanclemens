# Role: Bendahara Lingkungan (Environment Treasurer)

This document defines the role, responsibilities, and system access for the Bendahara Lingkungan (Environment Treasurer) within the Paroki Santo Klemens Digital Ecosystem. This role is responsible for managing the local finances, particularly the collection of environment dues and management of local funds within their assigned environment.

## Access Layer
-   **Layer 2-4** (Specific layer depends on delegated authority from KL, but generally Layer 2 for basic input, Layer 4 for full management)

## Purpose
-   Manage the financial resources and transactions specific to their assigned environment.
-   Ensure timely collection of `iuran lingkungan` (environment dues) from parishioners.
-   Maintain transparency and accountability for local funds.
-   Support the Ketua Lingkungan (KL) in financial reporting and budget management.

## Key Responsibilities
*   **Dues Collection**: Record and track the collection of `iuran lingkungan` from each family/parishioner in their environment.
*   **Local Fund Management**: Oversee any small local funds or contributions, ensuring proper record-keeping.
*   **Dana Duka Contributions**: Facilitate the collection of `iuran Dana Duka` (Bereavement Fund dues) from environment members.
*   **Reporting**: Prepare regular financial reports for the Ketua Lingkungan (KL) on the status of dues collection and local fund utilization.
*   **Financial Records**: Maintain detailed digital records of all financial inflows and outflows within the environment.
*   **Budget Support**: Assist the KL in preparing the annual budget for environment activities.

## Default Landing Page (Portal Context)
-   `/lingkungan/[slug]` (Environment Homepage, with specific financial modules visible for their role).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (if they hold an administrative access layer).
-   **Dashboard / Financial Modules**: Access to financial sections within `/lingkungan/[slug]`, including:
    *   Dashboard for tracking `iuran lingkungan` collection status per family.
    *   Interface for inputting received dues and contributions.
    *   Reports on local fund balances and transaction histories.
    *   Alerts for overdue payments.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani. Permissions are limited to viewing relevant financial data for members within their environment.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: RLS policies enforce access based on `access_layer` and `lingkungan_id`, ensuring the treasurer only manages finances for their assigned environment.
-   **Frontend Component**: Integrates financial components within `src/app/(dashboard)/lingkungan/[slug]/page.tsx`.
-   **Backend Endpoints**: Interacts with APIs for environment-specific financial transactions and `iuran` management.
-   **Database Tables**: Access to `public.environment_dues`, `public.financial_transactions` (local scope), `public.profiles`, `public.families`.

## Edge Cases
-   **Payment Discrepancies**: System should provide tools to reconcile payment discrepancies.
-   **Security**: Ensuring secure handling and recording of financial data at the local level.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 2 Environment Homepage](docs/pages/portal2_environment_homepage.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for DPP structure context)
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)