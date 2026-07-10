# Role: Sekretaris I (Secretary I of DPP)

This document defines the role, responsibilities, and system access for the Sekretaris I (Secretary I) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. Sekretaris I manages core administrative tasks, documentation, and communication for the parish.

## Access Layer
-   **Layer 5**

## Purpose
-   Manage the central administration and record-keeping of the parish.
-   Oversee the Digital Vault and verification of official documents.
-   Facilitate internal and external communication for the DPP.
-   Support the Pastor Paroki and Wakil Ketua in administrative duties.

## Key Responsibilities
*   **Administrative Hub**:
    *   Manage all parish records, official documents, and correspondence.
    *   Prepare agendas, minutes, and follow-up actions for DPP meetings.
*   **Digital Vault Administration**:
    *   Verify and approve documents uploaded by parishioners to the Digital Vault (e.g., sacrament certificates, family cards).
    *   Ensure the integrity and accessibility of digital records.
*   **New Parishioner Verification**: Act as an escalation point or secondary verifier for new user registrations (Layer 1 - Waiting Room) if KLs are unresponsive, or for special cases.
*   **Communication Management**:
    *   Draft and distribute official parish announcements and communications.
    *   Manage the parish's communication channels within the digital ecosystem.
*   **KPD/KTPD Review**: Review KPD (Kegiatan dengan Permohonan Dana) and KTPD (Kegiatan tanpa Permohonan Dana) proposals for completeness and adherence to administrative guidelines before forwarding for approval.
*   **Archiving & Reporting**:
    *   Maintain a digital archive of all parish activities and reports.
    *   Generate administrative reports as required by the DPP.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   Queue of pending new user registrations.
    *   Digital Vault admin panel for document verification and management.
    *   Interface for drafting announcements and managing communication.
    *   Overview of KPD/KTPD proposals awaiting administrative review.
    *   Access to parish-wide reports and archives.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view relevant administrative details (e.g., user verification status, document metadata in Vault).

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 5 access, granting specific read/write permissions for administrative tasks, particularly in managing profiles, documents, and communications.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules.
-   **Backend Endpoints**: Interacts with APIs for user management, digital vault, KPD/KTPD review, and communication.
-   **Database Tables**: Access to `public.profiles`, `public.digital_vault`, `public.kegiatan`, `public.system_notifications`.

## Edge Cases
-   **Document Irregularities**: Flagging and escalating issues with uploaded documents to higher authority.
-   **Communication Failures**: Monitoring and ensuring delivery of important parish announcements.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Page: Waiting Room Page](docs/pages/auth/waiting_room_page.md)
-   [Feature: Digital Vault & OCR Integration](docs/features/digital_vault_ocr_feature.md)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)