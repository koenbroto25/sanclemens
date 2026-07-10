# Feature: Wali Digital Lingkungan (WDL) Proxy Flow

This document describes the implementation and user flow for the Wali Digital Lingkungan (WDL - Digital Guardian of Environment) proxy feature within the Paroki Santo Klemens Digital Ecosystem. WDL enables trusted parishioners to assist others, particularly elderly or digitally challenged members, with their digital interactions, based on explicit consent.

## Purpose
-   Improve digital inclusion for all parishioners, especially those facing digital barriers.
-   Provide a secure and consented mechanism for delegated digital assistance.
-   Reduce the burden on Ketua Lingkungan (KL) for routine assistance tasks.
-   Maintain privacy and accountability while enabling proxy access.

## Key Functionalities
*   **WDL Appointment**: Ketua Lingkungan (KL) can identify and appoint 1-2 trusted parishioners per environment as WDLs.
*   **Consent Mechanism**: Parishioners needing assistance explicitly grant consent to a WDL, specifying the scope of access (e.g., "view family data", "submit forms", "access digital vault documents").
*   **Proxy Access**: Once consented, a WDL can access limited features on behalf of the assisted parishioner through their own WDL dashboard.
*   **Audit Logging**: All actions performed by a WDL on behalf of another parishioner are logged for transparency and accountability.
*   **Consent Revocation**: Assisted parishioners, or the KL, can revoke WDL consent at any time, immediately terminating proxy access.
*   **Restricted Scope**: WDL access is always restricted by explicit consent and system-level RLS policies, preventing unauthorized data access or actions.

## UI/UX & User Flow
1.  **WDL Appointment (KL)**:
    *   KL identifies suitable parishioners in their environment.
    *   KL accesses their dashboard and uses a "Manage WDLs" interface to appoint a WDL and set initial permissions.
2.  **Consent Request (Assisted Parishioner)**:
    *   An assisted parishioner (or KL on their behalf) initiates a consent grant to a specific WDL.
    *   The consent specifies which types of data or actions the WDL can perform (e.g., "can view my family profile", "can upload documents to my vault").
    *   Consent can be managed via the assisted parishioner's profile page.
3.  **WDL Dashboard Access**:
    *   An approved WDL logs into their account (Layer 3).
    *   They are directed to the `/wdl/dashboard` which lists parishioners they are authorized to assist and the scope of their consent.
4.  **Proxy Action**:
    *   WDL selects an assisted parishioner from their dashboard.
    *   The WDL's interface then shifts to a "proxy view" or "on behalf of" mode, displaying only the features and data permitted by the consent.
    *   Any actions taken (e.g., viewing a family record, uploading a document) are recorded in an audit log.
5.  **Consent Revocation**:
    *   Assisted parishioner goes to their profile and revokes WDL access.
    *   KL uses "Manage WDLs" to revoke access.
    *   System immediately updates `wdl_consent` and terminates proxy sessions.

## Technical Details
-   **Database Table**: `public.wdl_consent`
    ```sql
    CREATE TABLE public.wdl_consent (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wdl_id UUID NOT NULL REFERENCES public.profiles(id),       -- The WDL user
        assisted_user_id UUID NOT NULL REFERENCES public.profiles(id), -- The user being assisted
        consent_scope JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g., ['read_family_data', 'upload_vault_document']
        granted_by UUID NOT NULL REFERENCES public.profiles(id),  -- Who granted (assisted_user or KL)
        granted_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ, -- Optional, for time-limited consent
        revoked_at TIMESTAMPTZ,
        revoked_by UUID REFERENCES public.profiles(id),
        status TEXT DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(wdl_id, assisted_user_id)
    );
    ```
-   **Authorization**: Layer 3 access for WDLs, with RLS policies leveraging the `public.wdl_consent` table to dynamically grant/revoke access to specific data rows and actions on behalf of the `assisted_user_id`.
-   **Backend Endpoints**: APIs for managing WDL appointments, consent grants/revocations, and proxy action validation.
-   **Frontend Component**: `/wdl/dashboard` and integrated proxy-enabled interfaces.
-   **Audit Logging**: Integration with `public.audit_log` (or similar) to record all WDL actions.

## Edge Cases
-   **Overlapping WDLs**: A parishioner might have multiple WDLs, each with different consent scopes. The system must manage these correctly.
-   **Abuse of Trust**: While consent-based, the audit log and revocation features are crucial for addressing potential misuse.
-   **Technical Limitations**: Certain highly sensitive actions (e.g., changing passwords) may not be proxyable for security reasons.

## References
-   [GDD v4.0] BAB VI "Authentication & Authorization" - 6.4 "Role Matrix" (WDL)
-   [GDD v4.0] BAB IV "Database Schema & Data Model" - `public.wdl_consent` (implicitly, in the new tables list)
-   [GDD v4.0] BAB VIII "Userflow System" - "8.2-8.6 (WDL Scope)"
-   [Role: Wali Digital Lingkungan (WDL)](docs/roles/portal2_environment_roles/wali_digital_lingkungan_role.md)
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)
-   [Page: Digital Vault Page](docs/pages/digital_vault_page.md)