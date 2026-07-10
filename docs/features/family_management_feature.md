# Feature: Kartu Keluarga Digital & Cari/Sambung Keluarga (Digital Family Card & Search/Connect Family)

This document describes the implementation and user flow for the Digital Family Card and the "Search & Connect Family" features within the Paroki Santo Klemens Digital Ecosystem. These features allow parishioners to view and manage their family's digital records and connect with existing families in the system.

## Purpose
-   Provide a digital representation of the "Kartu Keluarga" (Family Card).
-   Enable parishioners to view and maintain their family's demographic and sacramental data.
-   Facilitate the connection of new users to existing families.
-   Support family-based pastoral care and administrative processes.

## Key Functionalities
*   **Digital Family Card Display**: Present a comprehensive view of family members, their roles (e.g., Head of Family, Spouse, Child), registration status, and key information (e.g., online status).
*   **Family Data Management**: Allow the Head of Family (Kepala Keluarga) to edit family details, invite new members, and approve/reject connection requests. Other members may have view-only access or suggest changes.
*   **Search Family Members**: Enable users to search for family members by name or WhatsApp number to facilitate connection requests.
*   **Send Connection Request**: Users can send requests to join an existing family. These requests are sent to the Head of Family for approval.
*   **Family Invitation Code**: Optionally, families can generate an invite code for new members to use during registration to streamline connection.
*   **New Family Creation**: Users who are not part of an existing family can create a new family and become its Head.

## UI/UX & User Flow
1.  **Access Family Page**: Users navigate to `/keluarga` from the Gate Hub or global navigation.
2.  **Digital Family Card**: Displays all family members, their status, and basic information.
3.  **Invite New Member**:
    *   Head of Family clicks "Undang Anggota".
    *   Inputs new member's WhatsApp number or name.
    *   System sends an invitation (e.g., via WhatsApp) to the potential member.
4.  **Connect to Existing Family (During Registration)**:
    *   New user registers and is prompted: "Apakah Anda bagian dari keluarga yang sudah terdaftar?"
    *   If "Ya", they input the Head of Family's WhatsApp number or a Family Code.
    *   A connection request is sent to the Head of Family.
5.  **Approve/Reject Connection**:
    *   Head of Family receives a notification about a pending connection request.
    *   They review the request and can approve or reject it.
    *   Upon approval, the new member's profile is linked to the family.

## Technical Details
-   **Backend Endpoints**:
    *   `GET /api/v1/family`: Retrieve own family data.
    *   `POST /api/v1/family/search`: Search for potential family members.
    *   `POST /api/v1/family/invite`: Send an invitation to a new family member.
    *   `PUT /api/v1/family/invite/:id`: Approve/reject a family connection request.
    *   `POST /api/v1/family/connect`: Connect to an existing family using a code or Head of Family's WhatsApp.
-   **Database Tables**:
    *   `public.families`: Stores family records.
    *   `public.profiles`: Links users to families and stores family roles.
    *   `public.family_invitations`: Manages pending invitations and connection requests.
        ```sql
        CREATE TABLE public.family_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            family_id UUID NOT NULL REFERENCES public.families(id),
            invited_by UUID NOT NULL REFERENCES public.profiles(id),
            invitee_phone TEXT NOT NULL,
            invitee_name TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
            invite_code TEXT UNIQUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
        );
        ```
-   **Frontend Components**: `FamilyPanel.tsx` (on Gate Hub/Sidebar), `FamilyTree.tsx`, `FamilyMemberRow.tsx`.
-   **Authorization**: RLS policies enforce access based on `family_id` and user role (`profiles.is_head_of_family`).

## Edge Cases
-   **Expired Invitations**: Invitations expire after a set period (e.g., 7 days).
-   **Duplicate Connections**: Prevent users from connecting to multiple families or already-connected family members.
-   **Invalid Family Code**: Provide clear error messages for incorrect invite codes.
-   **WhatsApp Integration**: Ensure reliable delivery of invitations/notifications via WhatsApp API.

## Integration with User Settings
The family management feature is now accessible via **Settings > Keluarga** (`app/(dashboard)/settings/`) in addition to the dedicated `/keluarga` page:

- **Settings Tab**: The Family tab within User Settings provides a centralized view of family data alongside other user preferences.
- **Features mirrored**:
  - View family members (active/invited)
  - Invite new members via WA code
  - Manage family roles (kepala keluarga/anggota)
  - Wali Digital (WDL) proxy settings
- **Smart Suggestions**: Settings page shows "Anggota keluarga belum memiliki akun → Kirim undangan" banner

## References
-   [GDD v4.0] BAB II "Frontend System" - 2.2 "Halaman Keluarga — `/keluarga`", 2.3 "Fitur Cari & Sambung Keluarga"
-   [GDD v4.0] BAB IV "Database Schema & Data Model" - 4.1 "Schema Overview", 4.2 "Tabel `family_invitations`" (implicitly, in the new tables list)
-   [GDD v4.0] BAB V "API Endpoints & Spesifikasi" - `/api/v1/family` endpoints
-   [GDD v4.0] BAB VII "Design System" - 7.2 "Komponen Baru" (`FamilyPanel.tsx`, `FamilyTree.tsx`, `FamilyMemberRow.tsx`)
-   [GDD v4.0] BAB VIII "Userflow System" - 8.1 "Onboarding Umat Baru"
-   [Page: Family Page](docs/pages/family_page.md)
-   [Page: Gate Hub Page](docs/pages/gate_hub_page.md)
-   [Page: Registration Page](docs/pages/auth/registration_page.md)
