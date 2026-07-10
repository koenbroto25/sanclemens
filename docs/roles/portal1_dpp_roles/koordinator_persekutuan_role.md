# Role: Koordinator Bidang Persekutuan (Coordinator of Community Division / Koinonia)

This document defines the role, responsibilities, and system access for the Koordinator Bidang Persekutuan (Coordinator of the Community/Koinonia Division) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. This role focuses on fostering community, youth, family, and lay apostolate within the parish.

## Access Layer
-   **Layer 7** (As a Koordinator Bidang)

## Purpose
-   Lead and coordinate all activities aimed at building and strengthening community bonds within the parish.
-   Oversee programs for various community groups including youth, children (BIA/BIR), families, and lay apostolate.
-   Ensure active participation and spiritual growth of parishioners through community engagement.
-   Initiate and manage KPD/KTPD proposals for activities within the Persekutuan Bidang.

## Key Responsibilities
*   **Community Building Programs**: Plan, organize, and oversee initiatives for youth, family, and lay groups (e.g., Kepemudaan, Tim KKI, Kerasulan Keluarga, Kerasulan Awam, Kewanitaan, Lansia, Kelompok Kategorial).
*   **KPD/KTPD Management**:
    *   Initiate KPD (Kegiatan dengan Permohonan Dana) and KTPD (Kegiatan tanpa Permohonan Dana) proposals for activities within the Persekutuan Bidang.
    *   Track the approval status of these proposals.
    *   Submit Laporan Pertanggung Jawaban (LPJ) for completed activities.
*   **Sub-Bidang Coordination**: Coordinate the various sub-bidangs under Koinonia, ensuring their programs align with the overall parish vision.
*   **Engagement & Participation**: Implement strategies to increase active participation of parishioners in community life.
*   **Data Entry & Reporting**:
    *   Ensure data related to community programs (e.g., participant lists, attendance, impact assessments) is entered into the system.
    *   Generate reports on community engagement and program effectiveness.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities, with a focus on Koinonia-related modules).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   Overview of active KPD/KTPD for the Persekutuan Bidang.
    *   Interface for creating new activity proposals.
    *   Reporting tools for submitting LPJ.
    *   Participant management tools for various community groups.
    *   Statistics on community engagement and demographics.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view participant data for community events and group memberships.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 7 access, granting specific read/write permissions for managing activities and data within the Persekutuan Bidang.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules, particularly for activity and participant management.
-   **Backend Endpoints**: Interacts with APIs for `kegiatan` (KPD/KTPD), `profiles` (for group memberships), and `families`.
-   **Database Tables**: Access to `public.kegiatan`, `public.profiles`, `public.families`.

## Edge Cases
-   **Inter-Bidang Collaboration**: Needs clear communication protocols for activities involving multiple DPP Bidangs.
-   **Reporting Consistency**: Ensuring consistent reporting from various sub-bidangs.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)