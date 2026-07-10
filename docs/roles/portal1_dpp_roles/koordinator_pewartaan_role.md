# Role: Koordinator Bidang Pewartaan (Coordinator of Proclamation Division)

This document defines the role, responsibilities, and system access for the Koordinator Bidang Pewartaan (Coordinator of the Proclamation Division) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. This role focuses on evangelization, catechesis, and communication of faith.

## Access Layer
-   **Layer 7** (As a Koordinator Bidang)

## Purpose
-   Lead and coordinate all activities related to evangelization, catechesis, and faith formation within the parish.
-   Ensure effective communication of the Gospel message and Church teachings.
-   Oversee sub-bidangs like Panggilan (Vocations), Inisiasi & Katekese (Initiation & Catechesis), Pendalaman Iman (Faith Deepening), Pendidikan Agama (Religious Education), and KOMSOS (Social Communication).
-   Initiate and manage KPD/KTPD proposals for activities within the Pewartaan Bidang.

## Key Responsibilities
*   **Program Leadership**: Plan, organize, and oversee all programs related to faith proclamation and education.
*   **KPD/KTPD Management**:
    *   Initiate KPD (Kegiatan dengan Permohonan Dana) and KTPD (Kegiatan tanpa Permohonan Dana) proposals for activities within the Pewartaan Bidang.
    *   Track the approval status of these proposals.
    *   Submit Laporan Pertanggung Jawaban (LPJ) for completed activities.
*   **Sub-Bidang Coordination**: Coordinate the activities of the Sub Bidang Panggilan, Inisiasi & Katekese, Pendalaman Iman, Pendidikan Agama, and KOMSOS.
*   **Content Creation & Dissemination**:
    *   Oversee the creation and dissemination of catechetical materials.
    *   Collaborate with Sekretaris DPP for parish-wide communication.
*   **Data Entry & Reporting**:
    *   Ensure data related to programs (e.g., participant lists, activity summaries) is entered into the system.
    *   Generate reports on the effectiveness and reach of evangelization efforts.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities, with a focus on Pewartaan-related modules).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   Overview of active KPD/KTPD for the Pewartaan Bidang.
    *   Interface for creating new activity proposals.
    *   Reporting tools for submitting LPJ.
    *   Access to educational resources and communication platforms.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view participant data for catechesis and events.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 7 access, granting specific read/write permissions for managing activities and resources within the Pewartaan Bidang.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules, particularly for activity management.
-   **Backend Endpoints**: Interacts with APIs for `kegiatan` (KPD/KTPD), content management, and reporting.
-   **Database Tables**: Access to `public.kegiatan`, `public.profiles` (for participant management), and potentially `public.digital_vault` (for educational materials).

## Edge Cases
-   **LPJ Overdue**: System flags overdue LPJ and potentially blocks new proposals from the Bidang.
-   **Budget Constraints**: KPD proposals are checked against budget availability.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)