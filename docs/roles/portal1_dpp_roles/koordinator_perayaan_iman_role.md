# Role: Koordinator Bidang Perayaan Iman (Coordinator of Celebration of Faith Division)

This document defines the role, responsibilities, and system access for the Koordinator Bidang Perayaan Iman (Coordinator of the Celebration of Faith Division) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. This role focuses on the liturgical life and sacramental celebrations of the parish.

## Access Layer
-   **Layer 7** (As a Koordinator Bidang)

## Purpose
-   Lead and coordinate all activities related to liturgy, sacraments, and devotions within the parish.
-   Ensure the solemnity, beauty, and active participation in all faith celebrations.
-   Oversee sub-bidangs like Misa & Devosi (Mass & Devotions), Lektor (Lectors), Mazmur (Psalmists), Musik Liturgi Gereja (Church Liturgical Music), Misdinar (Altar Servers), Paramenta (Vestments), and Prodiakon (Eucharistic Ministers).
-   Initiate and manage KPD/KTPD proposals for liturgical activities.

## Key Responsibilities
*   **Liturgical Planning**: Plan and coordinate mass schedules, liturgical calendars, and special devotions.
*   **Sacrament Coordination**: Oversee the preparation and celebration of sacraments, in collaboration with the Pastor and Sekretaris.
*   **KPD/KTPD Management**:
    *   Initiate KPD (Kegiatan dengan Permohonan Dana) and KTPD (Kegiatan tanpa Permohonan Dana) proposals for liturgical activities.
    *   Track the approval status of these proposals.
    *   Submit Laporan Pertanggung Jawaban (LPJ) for completed activities.
*   **Sub-Bidang Coordination**: Coordinate the various sub-bidangs involved in liturgical ministries, ensuring trained and prepared personnel.
*   **Resource Management**: Oversee the management of liturgical resources (e.g., music, vestments, altar supplies).
*   **Data Entry & Reporting**:
    *   Ensure data related to liturgical events (e.g., mass attendance, sacrament counts) is entered into the system.
    *   Generate reports on liturgical participation and sacramental statistics.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities, with a focus on Liturgia-related modules).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   Overview of active KPD/KTPD for the Perayaan Iman Bidang.
    *   Interface for creating new activity proposals (e.g., special mass events).
    *   Reporting tools for submitting LPJ.
    *   Access to liturgical schedules and resource management tools.
    *   Sacrament statistics and participation data.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view participant data for liturgical events and sacrament history.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 7 access, granting specific read/write permissions for managing liturgical activities and resources.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules, particularly for activity and schedule management.
-   **Backend Endpoints**: Interacts with APIs for `kegiatan` (KPD/KTPD), `sacraments`, and scheduling.
-   **Database Tables**: Access to `public.kegiatan`, `public.sacraments`, `public.profiles` (for ministry members), and potentially `public.digital_vault` (for liturgical documents).

## Edge Cases
-   **Scheduling Conflicts**: System alerts for potential conflicts in mass or event scheduling.
-   **Resource Shortages**: Inventory management for liturgical supplies.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)