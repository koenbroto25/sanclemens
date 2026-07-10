# Family Page (Kartu Keluarga Digital & Management)

This document details the Digital Family Card page and associated features for managing family data, inviting members, and connecting with existing families within the Paroki Santo Klemens Digital Ecosystem.

## URL
-   `/keluarga` (within the `src/app/(dashboard)/keluarga/` route group)

## Purpose
-   Provide a digital representation of the family unit (Kartu Keluarga Digital).
-   Allow users to view all registered members of their family and their status.
-   Enable family heads to manage family members, invite new members, and approve connections.
-   Facilitate searching for and connecting with existing family members during registration or from the Gate Hub.

## UI/UX Design
-   **Header**: Displays the family name (e.g., "KELUARGA HANDOKO"), associated environment, and region.
-   **Family Member List**: A list of all registered family members, displaying:
    *   Name (e.g., "Bpk. Petrus Handoko")
    *   Role within the family (Kepala, Istri, Suami, Anak)
    *   Current `access_layer` or layer status
    *   Online/Offline Status (`✅ Online`, `❌ Belum Daftar`, `👶 (Diisi Orang Tua)` for underage members).
    *   "Undang via WhatsApp" button for unregistered members.
-   **Summary**: Brief summary of family status (e.g., "Iuran Lingkungan: ✅ Lunas", "Sakramen: 4 Baptis").
-   **Action Buttons**: "Atur Keluarga" (Manage Family), "Undang Anggota" (Invite Member), "Cetak Kartu Keluarga" (Print Family Card).
-   **Family Panel (`FamilyPanel.tsx`)**: (Displayed in Gate Hub and sidebar)
    *   Shows a condensed view of family members and their online/offline status.
    *   Buttons for "Cari Anggota Keluarga" (Search Family Member) and "Lihat Halaman Keluarga" (View Family Page).
-   **Family Search Input (`FamilySearchInput.tsx`)**: (Used in Gate Hub or dedicated search page)
    *   Input field for searching by name or WhatsApp number.
    *   Displays search results with an option to send a connection request.

## Userflow
1.  **Accessing Family Page**: Users can access `/keluarga` via:
    *   Clicking "Lihat Halaman Keluarga" from the `FamilyPanel` in the Gate Hub.
    *   Navigating via the "Keluarga Saya" link in the sidebar or navbar profile menu.
2.  **Viewing Family Details**: The page loads, displaying all registered family members and their key details.
3.  **Family Management (Head of Family)**:
    *   **"Atur Keluarga"**: Allows the Head of Family to edit family details or manage member roles.
    *   **"Undang Anggota"**: Initiates the "Undang via WhatsApp" flow for unregistered members.
    *   **"Cetak Kartu Keluarga"**: Generates a printable Digital Family Card.
4.  **Connecting New Members (during registration)**:
    *   During the registration process, users are asked if they are part of an existing family.
    *   If "Ya", they provide the Head of Family's WhatsApp number or a Family Code, sending a connection request.
    *   If "Tidak", they create a new family and become the Head of Family.
5.  **Searching for Members (from Gate Hub/dedicated search)**:
    *   Users can use `FamilySearchInput` to find other parishioners by name or WhatsApp number.
    *   If a match is found, they can send a connection request.
6.  **Connection Approval**: Head of Family receives a notification (via WhatsApp) for incoming connection requests and can approve or reject them.

## Technical Details
-   **Frontend Component**: `src/app/(dashboard)/keluarga/page.tsx`, `src/app/(dashboard)/keluarga/cari/page.tsx`, `src/app/(dashboard)/keluarga/undang/page.tsx`.
-   **UI Components**: `FamilyTree.tsx`, `FamilyMemberRow.tsx`, `FamilyPanel.tsx`, `FamilySearchInput.tsx`.
-   **Backend Endpoints**:
    *   `GET /api/v1/family`: Retrieve user's family details.
    *   `POST /api/v1/family/search`: Search for family members.
    *   `POST /api/v1/family/invite`: Send invitations via WhatsApp.
    *   `PUT /api/v1/family/invite/:id`: Approve/reject connection requests.
    *   `POST /api/v1/family/connect`: Connect to a family using a code/number.
-   **Database Tables**: `public.families`, `public.profiles`, `public.family_invitations`.
-   **Authorization**: RLS policies ensure that only family members or authorized roles can view/manage family data. Head of Family has more extensive management rights.

## Edge Cases
-   **Unregistered Family Member**: `FamilyPanel` and `family_page` will show "Belum Daftar" status and offer to invite via WhatsApp.
-   **Pending Invitation**: Displays the status of sent or received invitations.
-   **User Leaving Family**: Handled by the Head of Family, potentially with system validation.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB II §2.2-2.3 "Halaman Keluarga" & "Fitur Cari & Sambung Keluarga"
-   [UI/UX Design System v3.0] §5.4 "Layout Halaman Keluarga", §8.19 "FamilyPanel", §8.20 "FamilyTree", §8.21 "FamilyMemberRow", §8.30 "FamilySearchInput"
-   [Userflow v4.0] Bagian 4 "Kartu Keluarga Digital & Cari Sambung Keluarga"