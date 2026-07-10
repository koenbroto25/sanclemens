# Portal 2: Environment Homepage

This document details the Environment Homepage, which is the default landing page for users (Layer 2+) entering Portal 2 (Lingkungan). It provides environment-specific information and functionality.

## URL
-   `/lingkungan/[slug]` (within the `src/app/(dashboard)/lingkungan/[slug]/` route group, after selecting Portal 2 from Gate Hub)

## Purpose
-   Provide key information relevant to the user's specific environment (Lingkungan).
-   Display personal and environment-wide financial obligations (dues/iuran).
-   Show upcoming prayer schedules and activities within the environment.
-   Facilitate requests and submissions relevant to the environment.
-   Offer quick access to the KL dashboard for authorized users.

## UI/UX Design
-   **Header (`LingkunganHeader`)**: Displays the environment's name (e.g., "LINGKUNGAN SANTO YUSUF"), associated region, and the Ketua Lingkungan's (KL) name.
-   **"Tagihan & Iuran" Section**:
    *   Lists current dues (e.g., "Iuran Lingkungan", "Iuran Dana Duka") with payment buttons.
    *   Shows previous month's payment status (e.g., "✅ LUNAS").
    *   Displays total outstanding amount.
-   **"Jadwal Doa Keluarga" Section**:
    *   Lists upcoming prayer schedules within the environment, including location.
-   **"Pengajuan & Permohonan" Section**:
    *   Displays the status of user's requests (e.g., "Surat Pengantar ✅ Siap", "Permohonan Doa ⏳ Diproses").
    *   Action buttons: "Ajukan Surat" (Submit Letter), "Minta Doa" (Request Prayer), "Dana Kasih" (Charity Fund).
-   **"Kegiatan Mendatang" Section**:
    *   Lists upcoming events and activities within the environment.
-   **"Statistik Lingkungan" Section**:
    *   Summary of environment members (total, active, new this month).
    *   "Umat Baru" (New Parishioners) greetings for the environment.
-   **Palette**: Warm, personal, intimate (as per [UI/UX Overview](docs/_main_overview/uiux_overview.md) for Portal 2).

## Userflow
1.  **Entry from Gate Hub**: User selects "Portal 2 - Lingkungan" from the Gate Hub.
2.  **Contextual Loading**: The page loads, fetching and displaying data specific to the user's `lingkungan_id`.
3.  **Information Consumption**: Users can review their financial obligations, prayer schedules, activity listings, and request statuses.
4.  **Action Initiation**: Users can initiate new requests (letters, prayers) or make payments directly from this page.
5.  **KL Dashboard Access**: Users with the Ketua Lingkungan (KL) role can scroll down or use a specific navigation element to access their dedicated KL Dashboard within Portal 2.

## Technical Details
-   **Frontend Component**: `src/app/(dashboard)/lingkungan/[slug]/page.tsx`.
-   **UI Components**: `LingkunganHeader.tsx`, `TagihanCard.tsx` (or similar for dues), `JadwalDoaCard.tsx`, `PengajuanList.tsx`, `KegiatanCard.tsx`.
-   **Data Sources**: `public.profiles` (for `lingkungan_id`), `public.environment_dues`, `public.prayer_schedules`, `public.requests`, `public.activities` tables.
-   **Authorization**: Middleware ensures users can only access their own environment's slug unless they have higher administrative privileges.
-   **Data Fetching**: Efficient data retrieval based on `[slug]` parameter.

## Edge Cases
-   **No Environment Assigned**: User without a `lingkungan_id` might be redirected or shown an empty state message.
-   **Accessing Other Environments**: Middleware prevents unauthorized access to other environments' pages.
-   **Empty Sections**: Displays appropriate empty states if there are no upcoming activities, dues, or requests.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB 0.4 "Portal 2 — Lingkungan"
-   [UI/UX Design System v3.0] §11.1 "Homepage Lingkungan"
-   [Userflow v4.0] Bagian 5 "Portal 2: Homepage Lingkungan & KL Dashboard"
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)