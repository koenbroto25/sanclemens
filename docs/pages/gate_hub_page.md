# Gate Hub Page

This document details the Gate Hub page, which serves as the central entry point for authenticated users (Layer 2+) to navigate to the three main portals of the Paroki Santo Klemens Digital Ecosystem.

## URL
-   `/gate-hub` (within the `src/app/gate-hub/` route group)

## Purpose
-   Provide a clear choice for users to enter Portal 1 (Paroki), Portal 2 (Lingkungan), or Portal 3 (Pasar Kasih).
-   Display a personalized welcome message and quick overview of family status.
-   Offer quick access to information and a conversational AI bot.

## UI/UX Design
-   **Header**: Personalized welcome, e.g., "Selamat datang, [Nama]!".
-   **Main Content**: A grid of three `GateCard` components for each portal:
    1.  **Portal 1 - Paroki**: Icon (church), title, brief description (e.g., "Informasi Keumatan & Administrasi"), "Masuk Portal" button.
    2.  **Portal 2 - Lingkungan**: Icon (houses), title, brief description (e.g., "Wilayah, Kegiatan, Solidaritas"), "Masuk Portal" button.
    3.  **Portal 3 - Pasar Kasih**: Icon (basket with leaf), title, brief description (e.g., "Belanja & Jual dari Sesama Umat"), "Coming Soon" badge (Fase 1), "Masuk" button (possibly disabled or leading to pre-registration in Fase 1).
-   **Family Panel (`FamilyPanel.tsx`)**: Located below the portal cards, displaying:
    *   Family name (e.g., "Keluarga Handoko")
    *   Status of family members (online/offline/belum daftar)
    *   Action buttons: "Cari Anggota Keluarga" (Search Family Member) and "Lihat Halaman Keluarga" (View Family Page).
-   **Parish Information Banner**: A rotating banner area (max 3 slides) displaying announcements, upcoming events, or mass schedules.
-   **Gate Bot Bubble (`GateBotBubble.tsx`)**: A floating action button (FAB) in the bottom-right corner, expanding into a chat bubble.
    *   **Mode "Panduan Baru"**: For users less than 7 days registered, offering guidance on portals.
    *   **Mode "Tanya Portal"**: For older users, offering assistance on portal features.
-   **Footer**: Minimal copyright information.
-   **Palette**: Netral, hangat, mengundang (as per [UI/UX Overview](docs/_main_overview/uiux_overview.md)).

## Userflow
1.  **Post-Login Redirection**: Upon successful login, users with `access_layer >= Layer 2` are redirected to `/gate-hub`.
2.  **Information Display**: The page loads, displaying personalized greetings, family status (retrieved from `public.families` and `public.profiles`), and parish announcements.
3.  **Portal Selection**: User clicks on a `GateCard` to enter the desired portal.
    *   Clicking Portal 1 redirects to `/`.
    *   Clicking Portal 2 redirects to `/lingkungan/[slug]` (based on user's `lingkungan_id`).
    *   Clicking Portal 3 redirects to `/pasar-kasih`.
4.  **Family Interaction**: User can interact with the Family Panel to view family details, search for members, or invite new members.
5.  **Gate Bot Interaction**: User can click the `Gate Bot Bubble` to open a chat interface for guidance or questions.

## Technical Details
-   **Frontend Component**: `src/app/gate-hub/page.tsx`.
-   **UI Components**: `GateCard.tsx`, `FamilyPanel.tsx`, `GateBotBubble.tsx`, `GateHubBanner.tsx`.
-   **Data Sources**: User profile (`public.profiles`), family data (`public.families`), announcements (from a CMS or `public.parish_info` table).
-   **Routing**: Next.js in-app routing (App Router).
-   **State Management**: Potentially uses Zustand for client-side state of `FamilyPanel` or `GateBotBubble`.

## Edge Cases
-   **No Family Connected**: `FamilyPanel` prompts the user to create a new family or search for one.
-   **Portal 2 Access**: Only visible or accessible if the user has a `lingkungan_id`.
-   **Portal 3 (Fase 1)**: Displays "Coming Soon" and offers pre-registration.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0 "TIGA PORTAL HOMEPAGE"
-   [UI/UX Design System v3.0] §5.2 "Layout Gate Hub", §8.18 "GateCard", §8.19 "FamilyPanel", §8.26 "GateBotBubble"
-   [Userflow v4.0] Bagian 1 "Gate Hub & Navigasi Tiga Portal"
-   [AI Bot System](docs/features/ai_bot_system.md) (for Gate Bot details)
-   [Family Management](docs/features/family_management.md)