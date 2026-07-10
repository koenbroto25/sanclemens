# Role: Koordinator Bidang Kesaksian Iman (Coordinator of Witness of Faith Division / Martyria)

This document defines the role, responsibilities, and system access for the Koordinator Bidang Kesaksian Iman (Coordinator of the Witness of Faith Division / Martyria) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. This role focuses on the parish's external outreach, physical infrastructure, and legal/asset management.

## Access Layer
-   **Layer 7** (As a Koordinator Bidang)

## Purpose
-   Lead and coordinate all activities related to the parish's external witness, maintenance, and resource management.
-   Oversee sub-bidangs like Pemeliharaan/Pembangunan (Maintenance/Development), Sekretariat Paroki (Parish Secretariat), Tim Data & Pengembangan Umat (Data & Parishioner Development Team), and Legal & Aset (Legal & Assets).
-   Ensure the parish's physical and administrative infrastructure supports its mission effectively.
-   Initiate and manage KPD/KTPD proposals for activities within the Kesaksian Iman Bidang.

## Key Responsibilities
*   **Infrastructure & Development**: Plan and oversee projects related to the maintenance, development, and improvement of parish properties and facilities.
*   **Secretariat Oversight**: Supervise the Parish Secretariat's operations, ensuring efficient administrative support for the entire DPP. This includes user registration verification and digital vault management.
*   **Data & Development**: Oversee the collection, analysis, and development of parishioner data to inform pastoral planning and growth.
*   **Legal & Asset Management**: Coordinate legal matters and manage parish assets, ensuring proper documentation and compliance.
*   **KPD/KTPD Management**:
    *   Initiate KPD (Kegiatan dengan Permohonan Dana) and KTPD (Kegiatan tanpa Permohonan Dana) proposals for activities within the Kesaksian Iman Bidang (e.g., building renovations, data initiatives).
    *   Track the approval status of these proposals.
    *   Submit Laporan Pertanggung Jawaban (LPJ) for completed activities.
*   **Sub-Bidang Coordination**: Coordinate the various sub-bidangs under Martyria, ensuring smooth operations and strategic alignment.
*   **Reporting**: Ensure timely and accurate reporting on maintenance projects, data initiatives, and legal/asset matters.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities, with a focus on Martyria-related modules).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   Overview of active KPD/KTPD for the Kesaksian Iman Bidang.
    *   Interface for creating new activity proposals (e.g., maintenance requests, data projects).
    *   Reporting tools for submitting LPJ.
    *   Access to parish asset registry and legal document management (if integrated).
    *   Oversight of new user registration queue (through Secretariat Sub-Bidang).
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view data relevant to maintenance (e.g., property records), secretariat (user profiles), and data development.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 7 access, granting specific read/write permissions for managing infrastructure, administrative support, data, and legal/asset matters.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules.
-   **Backend Endpoints**: Interacts with APIs for `kegiatan` (KPD/KTPD), `profiles` (user data/registration), `digital_vault` (asset documents, legal files).
-   **Database Tables**: Access to `public.kegiatan`, `public.profiles`, `public.digital_vault`, `public.assets`.

## Edge Cases
-   **Inter-Sub-Bidang Dependencies**: Requires close coordination, especially between Pemeliharaan/Pembangunan and Legal & Aset, and with Sekretariat Paroki.
-   **Long-Term Projects**: Tracking progress and budget for multi-year development projects.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)