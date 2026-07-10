# Data GAKIN Page (Data Keluarga Miskin)

This document details the Data GAKIN page, which provides functionality for managing data related to impoverished families, including submission, approval, and status updates. Access to this page is restricted to specific pastoral and administrative roles.

## URL
-   `/data-gakin` (within the `src/app/(dashboard)/data-gakin/` route group)

## Purpose
-   Provide a centralized platform for documenting and managing data for impoverished families (GAKIN).
-   Implement a multi-stakeholder approval flow (3 out of 4 approvers) for new GAKIN submissions.
-   Allow authorized roles to submit new GAKIN proposals, view existing data, and update statuses.
-   Ensure the privacy and integrity of sensitive GAKIN data.

## UI/UX Design
-   **Header**: "📊 DATA KELUARGA MISKIN (GAKIN)" with a clear indication of verified status.
-   **Overview Statistics**: Displays total active GAKIN families and a breakdown per region.
-   **GAKIN List**: A table or list of existing GAKIN families, showing:
    *   Family Name, Environment.
    *   Financial details (e.g., monthly income, number of dependents).
    *   Housing condition (layak, kurang_layak, tidak_layak).
    *   Status (`PROPOSED`, `ACTIVE`, `REJECTED`, `GRADUATED`).
    *   Approval Progress (e.g., "2/4" with `GakinApprovalBar.tsx`).
-   **"Ajukan Data GAKIN Baru" Button**: For authorized roles (Seksos/KL) to submit new proposals.
-   **Submission Form**: (Accessed via "Ajukan Data GAKIN Baru")
    *   Input fields for: family ID, monthly income, number of dependents, housing condition, Seksos notes, and photo uploads of living conditions.
    *   Button: "Kirim Pengajuan" (Submit Proposal).
-   **Approval View (`GakinApprovalBar.tsx`)**: For approvers (Pastor, Wakil DPP, Komsos/Seksos, KL) when viewing a specific GAKIN entry:
    *   Shows who has approved/rejected and who is pending.
    *   Buttons: "Setujui" (Approve), "Tolak" (Reject) with an option for notes.
-   **Status Update Controls**: For authorized roles to change status to `GRADUATED` (considered self-sufficient) or `REJECTED`.

## Userflow
1.  **Access**: Authorized roles (Pastor Layer 9, Wakil DPP Layer 8, Komsos/Seksos Layer 5-7, KL Layer 4 for their own environment) navigate to `/data-gakin`.
2.  **View GAKIN List**: The page loads, displaying a filtered list of GAKIN families based on the user's access privileges.
3.  **Propose New GAKIN**:
    *   Seksos or KL clicks "Ajukan Data GAKIN Baru".
    *   Fills out the submission form with required details and photo evidence.
    *   Submits the form, setting the GAKIN entry status to `PROPOSED`.
    *   System sends notifications to the four designated approvers.
4.  **Approval Process**:
    *   Approvers receive notifications and view the proposed GAKIN entry.
    *   Each approver uses "Setujui" or "Tolak" buttons, adding notes if necessary.
    *   The `GakinApprovalBar` updates in real-time.
    *   When 3 out of 4 approvers approve, the status changes to `ACTIVE`. If less than 3 approve, it becomes `REJECTED`.
5.  **Status Change**: Authorized roles can change an `ACTIVE` GAKIN entry to `GRADUATED` or `REJECTED` if circumstances change.

## Technical Details
-   **Frontend Component**: `src/app/(dashboard)/data-gakin/page.tsx`, `src/app/(dashboard)/data-gakin/ajukan/page.tsx`.
-   **UI Components**: `GakinCard.tsx` (for summary in demography page), `GakinApprovalBar.tsx`.
-   **Backend Endpoints**:
    *   `GET /api/v1/gakin`: List GAKIN data (filtered by role access).
    *   `POST /api/v1/gakin`: Submit new GAKIN proposal.
    *   `GET /api/v1/gakin/:id`: Retrieve detailed GAKIN entry.
    *   `POST /api/v1/gakin/:id/approve`: Handle approval/rejection.
    *   `PUT /api/v1/gakin/:id`: Update GAKIN status (e.g., `graduated`).
-   **Database Tables**: `public.data_gakin`, `public.gakin_approvals`, `public.families`, `public.profiles`.
-   **Authorization**: Strict RLS policies (`public.gakin_status` view) ensure data visibility and action permissions are strictly enforced based on `access_layer` and `role_saat_approve` (for `gakin_approvals`).
-   **File Storage**: Photo uploads use Cloudflare R2 with `sharp` compression.

## Edge Cases
-   **KL Approving Other Environments**: System automatically rejects approval if KL attempts to approve GAKIN outside their environment.
-   **Incomplete Approvals**: Reminders are sent to non-responsive approvers.
-   **Invalid Data**: Seksos/approvers can reject proposals with notes if data is inaccurate.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB IV §4.2 "Tabel `data_gakin` & Approval", BAB IX §9.1 "Fitur GAKIN — Alur Approval"
-   [UI/UX Design System v3.0] §8.22 "GakinCard", §8.23 "GakinApprovalBar"
-   [Userflow v4.0] Bagian 14 "Data GAKIN & Approval 3 dari 4"
-   [Feature: GAKIN Approval Flow](docs/features/gakin_approval_flow.md)
-   [Digital Vault Storage](docs/features/digital_vault_storage.md) (for photo uploads)