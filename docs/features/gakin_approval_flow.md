# Feature: Data GAKIN with 3/4 Approval Flow

This document describes the implementation and user flow for managing "Keluarga Miskin" (GAKIN - Impoverished Families) data, including a critical 3/4 multi-signature approval process, within the Paroki Santo Klemens Digital Ecosystem. This ensures that the designation of GAKIN status is thoroughly vetted and transparent.

## Purpose
-   Identify and officially recognize impoverished families within the parish.
-   Provide a structured and transparent process for GAKIN designation and status changes.
-   Ensure accountability and prevent abuse in the allocation of social assistance.
-   Integrate GAKIN data with broader social and financial modules for targeted support (e.g., Dana Kasih).

## Key Functionalities
*   **GAKIN Proposal**: Authorized roles (Seksos, KL) can propose a new family to be designated as GAKIN.
*   **Detailed GAKIN Data Capture**: Capture relevant information such as monthly income, number of dependents, housing conditions, Seksos notes, and supporting photos.
*   **Multi-Signature Approval (3/4)**: A GAKIN proposal requires approval from at least 3 out of 4 designated approvers: Pastor Paroki, Wakil Ketua DPP, Koordinator Bidang Pelayanan Cinta Kasih (Seksos), and the relevant Ketua Lingkungan (KL).
*   **Status Management**: Track the status of GAKIN proposals (proposed, active, rejected, graduated).
*   **Graduation/Status Change**: Allow authorized roles to change an active GAKIN family's status to "graduated" (no longer impoverished) or "rejected" (if initially approved, then found ineligible).
*   **Restricted Data View**: GAKIN data is visible only to authorized roles (Pastor, Wakil DPP, Komsos/Seksos, KL for their environment).

## UI/UX & User Flow
1.  **Proposal Initiation**:
    *   Seksos (Koordinator Bidang Pelayanan Cinta Kasih) or a KL (for their environment) navigates to `/data-gakin` and clicks "Ajukan KK baru sebagai GAKIN".
    *   Inputs required data (income, dependents, housing, notes, photos).
    *   Submits the proposal, setting its status to `proposed`.
2.  **Approval Notifications**:
    *   Notifications are sent to all four designated approvers (Pastor, Wakil DPP, Seksos, relevant KL).
3.  **Approval Process**:
    *   Each approver accesses `/data-gakin` (or their dashboard) to see pending GAKIN proposals.
    *   They review the details and can `approve` or `reject` the proposal, adding optional notes.
    *   The system tracks individual approvals in `gakin_approvals` table.
4.  **Status Update**:
    *   Once 3 or more approvals are received, the `data_gakin.status` automatically updates to `active`.
    *   If fewer than 3 approvals are received (and all approvers have acted), the status may become `rejected`.
5.  **Status Change (Graduation)**:
    *   Authorized roles can change an `active` GAKIN family's status to `graduated` (e.g., if their economic situation improves).

## Technical Details
-   **Backend Endpoints**:
    *   `GET /api/v1/gakin`: List GAKIN families (filtered by role access).
    *   `POST /api/v1/gakin`: Propose a new GAKIN family.
    *   `GET /api/v1/gakin/:id`: Retrieve details of a specific GAKIN family.
    *   `POST /api/v1/gakin/:id/approve`: Approve/reject a GAKIN proposal.
    *   `PUT /api/v1/gakin/:id`: Update GAKIN status (e.g., to `graduated`).
-   **Database Tables**:
    *   `public.data_gakin`: Stores GAKIN family details and status.
        ```sql
        CREATE TABLE public.data_gakin (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            family_id UUID NOT NULL REFERENCES public.families(id),
            penghasilan_per_bulan DECIMAL(12,2),
            jumlah_tanggungan INTEGER,
            kondisi_rumah TEXT CHECK (kondisi_rumah IN ('layak','kurang_layak','tidak_layak')),
            catatan_seksos TEXT,
            foto_kondisi TEXT[],
            status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed','active','rejected','graduated')),
            proposed_by UUID NOT NULL REFERENCES public.profiles(id),
            proposed_at TIMESTAMPTZ DEFAULT NOW(),
            graduated_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ```
    *   `public.gakin_approvals`: Records individual approvals for GAKIN proposals.
        ```sql
        CREATE TABLE public.gakin_approvals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            gakin_id UUID NOT NULL REFERENCES public.data_gakin(id) ON DELETE CASCADE,
            approver_id UUID NOT NULL REFERENCES public.profiles(id),
            role_saat_approve TEXT NOT NULL,  -- 'pastor' | 'wakil_dpp' | 'komsos' | 'kl'
            approved BOOLEAN DEFAULT FALSE,
            catatan TEXT,
            approved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(gakin_id, approver_id)
        );
        ```
    *   `public.gakin_status` (View): Facilitates checking approval counts.
-   **Frontend Components**: `GakinCard.tsx`, `GakinApprovalBar.tsx`.
-   **Authorization**: RLS policies strictly control visibility and modification of GAKIN data based on `access_layer` and `lingkungan_id` (for KLs).

## Edge Cases
-   **Partial Approvals**: System must clearly indicate how many approvals are still needed.
-   **Conflicting Approvals**: If one approver rejects, while others approve, the 3/4 rule still applies.
-   **Data Privacy**: All GAKIN data is highly sensitive and protected by strict RLS and access control. Photos are stored securely (e.g., Cloudflare R2 signed URLs) and never publicly exposed.

## References
-   [GDD v4.0] BAB 0 "Tiga Portal Homepage" - 0.3 "Portal 1 — Paroki (Demografi → Dashboard)" - "Data GAKIN"
-   [GDD v4.0] BAB IV "Database Schema & Data Model" - 4.2 "Tabel `data_gakin` & Approval"
-   [GDD v4.0] BAB V "API Endpoints & Spesifikasi" - `/api/v1/gakin` endpoints
-   [GDD v4.0] BAB VII "Design System" - 7.2 "Komponen Baru" (`GakinCard.tsx`, `GakinApprovalBar.tsx`)
-   [GDD v4.0] BAB IX "Modul Kegiatan & Anggaran" - 9.1 "Fitur GAKIN — Alur Approval"
-   [GDD v4.0] BAB XXIII "Sistem Login & Dashboard Admin (Fase 7)" - 23.6 "RLS Policies"
-   [Page: Data GAKIN Page](docs/pages/data_gakin_page.md)
-   [Role: Koordinator Pelayanan Cinta Kasih](docs/roles/portal1_dpp_roles/koordinator_pelayanan_cinta_kasih_role.md)
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)