# Role: Sekretaris Lingkungan (Environment Secretary)

This document defines the role, responsibilities, and system access for the Sekretaris Lingkungan (Environment Secretary) within the Paroki Santo Klemens Digital Ecosystem. This role supports the Ketua Lingkungan (KL) in local administrative tasks, record keeping, and communication for the assigned environment.

## Access Layer
-   **Layer 2-4** (Specific layer depends on delegated authority from KL; generally Layer 2 for data entry, Layer 4 for delegated administrative management)

## Purpose
-   Maintain accurate administrative records for the assigned environment.
-   Support the KL in member verification, communication, and activity documentation.
-   Ensure local data such as family updates, prayer schedules, attendance, and announcements are current.
-   Improve administrative continuity at the environment level.

## Key Responsibilities
*   **Environment Records Management**:
    *   Maintain digital records for environment members, family updates, and local activity documentation.
    *   Keep prayer schedules, meeting notes, and environment announcements up to date.
*   **New Parishioner Verification Support**: Assist the KL in reviewing pending user registrations by checking completeness and local membership details before final approval/rejection.
*   **Communication Support**:
    *   Draft and distribute environment-level announcements.
    *   Help coordinate broadcast messages for prayer schedules, meetings, and local events.
*   **Activity Documentation**:
    *   Record attendance and outcomes for environment gatherings.
    *   Assist in preparing reports for local activities.
*   **Data Quality**:
    *   Identify incomplete or inconsistent family/profile data within the environment.
    *   Help parishioners correct profile or family records through the appropriate workflows.

## Default Landing Page (Portal Context)
-   `/lingkungan/[slug]` (Environment Homepage, with administrative modules visible for delegated environment tasks).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password if they hold delegated administrative access.
-   **Dashboard / Administrative Modules**: Access to sections within `/lingkungan/[slug]`, including:
    *   Environment member list with read-only or delegated edit capabilities.
    *   Pending registration review queue delegated by KL.
    *   Prayer schedule and announcement management.
    *   Activity attendance and report forms.
    *   Local document/archive folder for environment-level records.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani. Permissions are limited to members and activities within the assigned environment.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) for delegated administrative access.
-   **Authorization**: RLS policies enforce access based on `access_layer` and `lingkungan_id`, ensuring the secretary only manages records for the assigned environment.
-   **Frontend Component**: Integrates environment administrative components within `src/app/(dashboard)/lingkungan/[slug]/page.tsx`.
-   **Backend Endpoints**: Interacts with APIs for environment member records, announcements, prayer schedules, activities, and delegated user verification.
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.activities`, `public.prayer_schedules`, `public.system_notifications`, and environment-scoped verification tables.

## Edge Cases
-   **Delegated Scope**: Responsibilities depend on KL delegation; system should clearly distinguish read-only support from approval authority.
-   **Data Consistency**: Changes to local records should be auditable to avoid conflicts with KL or parish-level records.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 2 Environment Homepage](docs/pages/portal2_environment_homepage.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)
-   [Feature: Wali Digital Lingkungan (WDL) Proxy Flow](docs/features/wdl_proxy_flow_feature.md)
