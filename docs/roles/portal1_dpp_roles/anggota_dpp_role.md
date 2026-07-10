# Role: Anggota DPP (DPP Member)

This document defines the role, responsibilities, and system access for general Anggota (Members) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. These members contribute to various aspects of parish life and administration, often within sub-bidangs.

## Access Layer
-   **Layer 2-7** (Specific layer depends on the sub-bidang and delegated authority)

## Purpose
-   Actively participate in the planning and execution of parish programs and activities.
-   Support the Koordinator Bidang in their respective areas of pastoral, administrative, or social work.
-   Provide input and feedback for decision-making processes within the DPP.
-   Represent the parish community in various initiatives.

## Key Responsibilities
*   **Activity Participation**: Actively engage in activities and programs organized by their assigned Bidang or Sub-Bidang.
*   **Reporting & Documentation**: Assist Koordinator Bidang in preparing activity reports (LPJ for KPD/KTPD) and other necessary documentation.
*   **Data Contribution**: Input data relevant to their specific tasks (e.g., activity attendance, social outreach data) into the system.
*   **Information Dissemination**: Help in disseminating information and announcements to the parish community, particularly within their areas of influence.
*   **Feedback & Input**: Provide valuable feedback and insights to their Koordinator Bidang and the broader DPP.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, as general users). Their dashboard functionalities within `/dashboard/admin-paroki` will be limited to their specific tasks or sub-bidang reports.

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, potentially showing:
    *   Overview of activities relevant to their Bidang/Sub-Bidang.
    *   Interface for submitting activity reports or data entries.
    *   Access to read certain parish announcements or documents.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani. Their access to broader parish data is limited by RLS to what is necessary for their delegated responsibilities.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 2-7 access, with RLS policies defining specific read/write permissions based on their assigned role and sub-bidang.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md`, but with highly restricted views.
-   **Backend Endpoints**: Interacts with APIs for activity management (`/api/v1/kegiatan`), data entry, and reading reports.
-   **Database Tables**: Access to `public.profiles`, `public.kegiatan`, and other tables as required by their specific duties.

## Edge Cases
-   **Delegation Scope**: Responsibilities are often delegated by Koordinator Bidang, and system access should mirror this delegation.
-   **Data Entry Errors**: Mechanisms for review and correction of data entered by members.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)