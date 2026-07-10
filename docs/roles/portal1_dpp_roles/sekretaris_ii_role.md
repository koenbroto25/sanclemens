# Role: Sekretaris II (Secretary II of DPP)

This document defines the role, responsibilities, and system access for the Sekretaris II (Secretary II) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. Sekretaris II supports Sekretaris I in administrative tasks, potentially with a focus on specific areas or as a backup.

## Access Layer
-   **Layer 5**

## Purpose
-   Support Sekretaris I in managing the central administration and record-keeping of the parish.
-   Assist with documentation, communication, and digital archiving.
-   Potentially focus on specific administrative sub-tasks or projects as delegated.

## Key Responsibilities
*   **Administrative Support**:
    *   Assist Sekretaris I in managing parish records, documents, and correspondence.
    *   Help prepare agendas, minutes, and follow-up actions for DPP meetings.
*   **Digital Vault Assistance**:
    *   Assist in the verification and approval of documents uploaded by parishioners to the Digital Vault.
    *   Contribute to ensuring the integrity and accessibility of digital records.
*   **Communication Support**:
    *   Assist in drafting and distributing official parish announcements and communications.
    *   Support the management of the parish's communication channels.
*   **KPD/KTPD Review**: Assist Sekretaris I in reviewing KPD and KTPD proposals for completeness and adherence to administrative guidelines.
*   **Archiving & Reporting**:
    *   Support the maintenance of a digital archive of all parish activities and reports.
    *   Assist in generating administrative reports as required.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   Access to queues of pending new user registrations.
    *   Digital Vault admin panel for document verification and management tasks.
    *   Interface for assisting with announcements and communication.
    *   Overview of KPD/KTPD proposals awaiting administrative review.
    *   Access to parish-wide reports and archives for data retrieval.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view relevant administrative details, similar to Sekretaris I but potentially with delegated scope.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 5 access, granting specific read/write permissions for administrative support tasks, often inheriting or assisting with Sekretaris I's scope.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules.
-   **Backend Endpoints**: Interacts with APIs for user management, digital vault, KPD/KTPD review, and communication, typically under the guidance of Sekretaris I.
-   **Database Tables**: Access to `public.profiles`, `public.digital_vault`, `public.kegiatan`, `public.system_notifications`.

## Edge Cases
-   **Delegated Authority**: Responsibilities are often delegated by Sekretaris I, requiring clear internal communication.
-   **Data Consistency**: Collaboration with Sekretaris I is critical to ensure data consistency and avoid conflicting actions.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Role: Sekretaris I](docs/roles/portal1_dpp_roles/sekretaris_i_role.md)
-   [Feature: Digital Vault & OCR Integration](docs/features/digital_vault_ocr_feature.md)
