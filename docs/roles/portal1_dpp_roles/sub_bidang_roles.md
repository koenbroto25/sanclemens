# Role: Sub Bidang Roles (DPP Sub-Division Members)

This document provides a general overview of the various Sub-Bidang roles within each major Bidang of the Dewan Pastoral Paroki (DPP) in the Paroki Santo Klemens Digital Ecosystem. These roles typically have delegated responsibilities from their respective Koordinator Bidang and contribute to the execution of specific programs and tasks.

## Access Layer
-   **Layer 2-7** (Access layer varies significantly based on the specific Sub-Bidang, its responsibilities, and delegated authority from the Koordinator Bidang).

## Purpose
-   Execute specific tasks and programs as delegated by their Koordinator Bidang.
-   Provide specialized support within their area of expertise (e.g., catechesis, liturgy, social work, maintenance).
-   Contribute to data collection, reporting, and community engagement at a granular level.

## Key Responsibilities
*   **Specialized Task Execution**: Perform duties specific to their Sub-Bidang (e.g., teaching catechesis, assisting in liturgical preparations, coordinating youth activities, conducting health outreach, assisting in parish maintenance, managing KOMSOS content).
*   **Data Entry**: Input data relevant to their activities into the system (e.g., participant attendance, feedback forms, resource inventory, social case notes).
*   **Reporting Support**: Assist their Koordinator Bidang in compiling data and drafting Laporan Pertanggung Jawaban (LPJ) for activities.
*   **Communication**: Participate in communication efforts within their Sub-Bidang or to relevant parishioners.
*   **Resource Management**: May be responsible for managing specific resources or equipment related to their Sub-Bidang.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, or `/lingkungan/[slug]` if their primary focus is environment-based, as general users). Access to administrative dashboard functionalities within `/dashboard/admin-paroki` will be limited to task-specific interfaces or reports relevant to their delegated duties.

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (if they hold an administrative access layer and are approved by Super Admin). Regular members of Sub-Bidangs may log in as Layer 2 "Umat Aktif".
-   **Dashboard / Task Interfaces**: Access to specific modules or forms within `/dashboard/admin-paroki` or other portal contexts, which might include:
    *   Activity creation/management forms for their specific programs.
    *   Data entry interfaces for collecting program results or participant information.
    *   Access to view reports relevant to their Sub-Bidang.
    *   Communication tools for internal Sub-Bidang coordination.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani. Their access to broader parish data is strictly limited by RLS to what is necessary for their delegated responsibilities.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) for administrative members, regular members as Layer 2.
-   **Authorization**: RLS policies defining very specific read/write permissions for data and functionalities directly related to their Sub-Bidang's tasks. This includes granular control over `public.kegiatan`, `public.profiles`, `public.digital_vault`, and other relevant tables.
-   **Frontend Component**: Specific forms, tables, and views tailored for their task execution, integrated within larger dashboard pages or as standalone components.
-   **Backend Endpoints**: Interacts with APIs relevant to their specific tasks, often under the purview of their Koordinator Bidang's API access.
-   **Database Tables**: Access to `public.kegiatan`, `public.profiles`, `public.digital_vault`, and other tables as required by their delegated duties.

## Edge Cases
-   **Granular Permissions**: Implementing precise RLS for diverse Sub-Bidang roles requires careful mapping of responsibilities to data access.
-   **Delegation Clarity**: Clear documentation and system configuration for delegated tasks are essential to avoid scope creep or unauthorized actions.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure and list of sub-bidangs)
-   [Role: Koordinator Pewartaan](docs/roles/portal1_dpp_roles/koordinator_pewartaan_role.md) (and other Koordinator Bidang roles)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)