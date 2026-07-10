# Role: Koordinator Bidang Pelayanan Cinta Kasih (Coordinator of Service and Charity Division / Diakonia)

This document defines the role, responsibilities, and system access for the Koordinator Bidang Pelayanan Cinta Kasih (Coordinator of the Service and Charity Division / Diakonia) of the Dewan Pastoral Paroki (DPP) within the Paroki Santo Klemens Digital Ecosystem. This role focuses on social welfare, health services, and bereavement support for the parish community.

## Access Layer
-   **Layer 7** (As a Koordinator Bidang)

## Purpose
-   Lead and coordinate all activities related to social service, charity, and pastoral care for those in need.
-   Oversee sub-bidangs like Pengembangan Sosial Ekonomi (Socio-Economic Development), Kesehatan (Health), and Rukun Kematian / Kedukaan & Jenazah (Bereavement Support & Funeral Services).
-   Ensure the compassionate and effective delivery of assistance to vulnerable parishioners (e.g., GAKIN, elderly, sick).
-   Initiate and manage KPD/KTPD proposals for activities within the Pelayanan Cinta Kasih Bidang.

## Key Responsibilities
*   **Social Programs Leadership**: Plan, organize, and oversee initiatives for social welfare, health, and bereavement support.
*   **GAKIN Data Management (Seksos)**: As a key Seksos (Social Section) role, propose new GAKIN families and participate in the 3/4 approval flow. Oversee status changes for GAKIN families.
*   **Dana Kasih Management**: Oversee the process of requesting and disbursing Dana Kasih (Charity Fund), ensuring needs are verified and funds are allocated appropriately.
*   **KPD/KTPD Management**:
    *   Initiate KPD (Kegiatan dengan Permohonan Dana) and KTPD (Kegiatan tanpa Permohonan Dana) proposals for activities within the Pelayanan Cinta Kasih Bidang.
    *   Track the approval status of these proposals.
    *   Submit Laporan Pertanggung Jawaban (LPJ) for completed activities, often emphasizing the impact on beneficiaries.
*   **Sub-Bidang Coordination**: Coordinate the various sub-bidangs under Diakonia, ensuring their programs align with the overall parish vision of charity and service.
*   **Emergency Response**: Collaborate with the SOS system to ensure pastoral response to emergencies involving health or social crises.
*   **Data Entry & Reporting**:
    *   Ensure data related to social programs (e.g., beneficiary lists, aid disbursed, health records) is entered into the system.
    *   Generate reports on social impact and program effectiveness, adhering to privacy principles.

## Default Landing Page (Portal Context)
-   `/` (Demografi Paroki first, then `/dashboard/admin-paroki` for main administrative dashboard functionalities, with a focus on Diakonia-related modules, including GAKIN data).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` using WhatsApp number and password (after initial approval by Super Admin).
-   **Dashboard**: Access a customized view within `/dashboard/admin-paroki`, including:
    *   Overview of active KPD/KTPD for the Pelayanan Cinta Kasih Bidang.
    *   Interface for creating new activity proposals.
    *   Reporting tools for submitting LPJ.
    *   GAKIN data management panel (proposals, approval tracking, status updates).
    *   Dana Kasih request and disbursement tracking.
    *   SOS related alerts and follow-up tools.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani, with permissions to view relevant social and health data of parishioners (e.g., GAKIN status, SOS history, WDL consent).

## Technical Details
-   **Authentication**: Supabase Auth (phone + password).
-   **Authorization**: Layer 7 access, granting specific read/write permissions for managing social welfare, health, and bereavement activities, with critical access to GAKIN and Dana Kasih data.
-   **Frontend Component**: Leverages components from `Portal1AdminDashboardPage.md` to display role-specific modules.
-   **Backend Endpoints**: Interacts with APIs for `kegiatan` (KPD/KTPD), `data_gakin`, `dana_kasih`, `sos`.
-   **Database Tables**: Access to `public.kegiatan`, `public.profiles`, `public.families`, `public.data_gakin`, `public.gakin_approvals`, `public.dana_kasih`, `public.sos_abuse_tracker`.

## Edge Cases
-   **Sensitive Data Protection**: Strict adherence to "Invisible Grace" and privacy principles for GAKIN and Dana Kasih beneficiaries.
-   **Emergency Response Coordination**: Seamless integration with SOS system for quick response.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 1 Parish Admin Dashboard](docs/pages/admin_dashboards/portal1_admin_dashboard_page.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Susunan_DPP_Paroki_Sepinggan_2024-2027.pdf] (for official DPP structure)
-   [Feature: GAKIN Approval Flow](docs/features/gakin_approval_flow.md)
-   [Feature: Dana Kasih Escrow](docs/features/dana_kasih_escrow.md) (will create later)
-   [Feature: KPD & KTPD](docs/features/kpd_ktpd.md) (will create this later)