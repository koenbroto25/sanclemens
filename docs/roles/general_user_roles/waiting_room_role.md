# Role: Waiting Room User (Pending Parishioner)

This document defines the role, responsibilities, and system access for users who have registered but are not yet approved as active parishioners. These users are in the Waiting Room state and have highly restricted access until the Ketua Lingkungan (KL) approves their registration.

## Access Layer
-   **Layer 1**

## Purpose
-   Provide a safe holding state for newly registered users.
-   Prevent unverified users from accessing parish data, family data, environment features, or portal features.
-   Give pending users clear feedback about their registration status and next steps.
-   Allow KL or delegated parish administrators to verify and approve/reject applications.

## Key Responsibilities
*   **Complete Registration Truthfully**: Provide accurate personal, family, and environment information during registration.
*   **Wait for Verification**: Do not attempt to bypass Waiting Room restrictions before KL approval.
*   **Respond to Follow-up**: Provide additional information if requested by KL or Sekretaris Paroki.
*   **Protect Account Credentials**: Keep phone/password credentials secure even before approval.

## Default Landing Page (Portal Context)
-   `/auth/waiting-room` (Waiting Room Page).

## UI/UX & Key Functionalities
-   **Login**: Users may log in with their registered WhatsApp number and password, but are redirected to Waiting Room until approved.
-   **Waiting Room Page**: Displays:
    *   Registration status: pending, approved, rejected, or needs revision.
    *   Assigned environment and KL name if available.
    *   Instructions for follow-up or resubmission.
    *   Contact or escalation guidance if the request is stuck.
-   **Restricted Navigation**: Gate Hub and portal pages are hidden or disabled until approval.
-   **Cross-Portal Data Access**: None, except minimal data required to show registration status.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) exists, but profile `access_layer` remains Layer 1 until approval.
-   **Authorization**: RLS policies restrict access to only the user's own registration/profile record.
-   **Frontend Component**: `docs/pages/auth/waiting_room_page.md`.
-   **Backend Endpoints**: Interacts with registration status APIs and KL verification APIs.
-   **Database Tables**: Access to `public.profiles` and registration/verification metadata only.

## Edge Cases
-   **Rejected Application**: User can be shown reason for rejection and allowed to resubmit if policy permits.
-   **Non-responsive KL**: Escalation to Sekretaris Paroki or designated parish admin after a configured timeout.
-   **Duplicate Registration**: System should detect duplicate phone/family/environment combinations before approval.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Waiting Room](docs/pages/auth/waiting_room_page.md)
-   [Page: Registration](docs/pages/auth/registration_page.md)
-   [Page: OTP Verification](docs/pages/auth/otp_verification_page.md)
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)