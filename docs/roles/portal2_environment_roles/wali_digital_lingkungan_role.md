# Role: Wali Digital Lingkungan (WDL - Digital Guardian of Environment)

This document defines the role, responsibilities, and system access for the Wali Digital Lingkungan (WDL) within the Paroki Santo Klemens Digital Ecosystem. WDL is a delegated proxy role for trusted parishioners who assist other parishioners—especially elderly or digitally vulnerable members—with limited, consent-based access.

## Access Layer
-   **Layer 3** (Delegated proxy access, built on top of the user's underlying Layer 2 parishioner access)

## Purpose
-   Provide trusted digital assistance to parishioners who need help using the ecosystem.
-   Help elderly, sick, or digitally vulnerable parishioners access permitted features without sharing their passwords.
-   Reduce digital exclusion while preserving user privacy and consent.
-   Support the KL by assisting with proxy-related tasks within clearly defined boundaries.

## Key Responsibilities
*   **Proxy Assistance**:
    *   Assist assigned parishioners in viewing permitted information, submitting requests, or navigating the app.
    *   Help users complete forms, upload documents, or check schedules when authorized by consent.
*   **Consent Management**:
    *   Operate only within the scope of explicit WDL consent granted by the assisted parishioner and/or KL.
    *   Respect revocation of consent immediately when a parishioner withdraws WDL access.
*   **Digital Inclusion Support**:
    *   Provide basic digital literacy support for elderly or less tech-savvy parishioners.
    *   Encourage parishioners to use the system independently when possible.
*   **Privacy Protection**:
    *   Do not access, copy, or disclose information outside the consent scope.
    *   Do not use proxy access for personal benefit or unrelated purposes.
*   **Escalation**:
    *   Escalate suspicious activity, access issues, or urgent pastoral/social cases to the KL or designated pastoral contact.

## Default Landing Page (Portal Context)
-   `/wdl/dashboard` (WDL Dashboard, with quick access to assigned assisted parishioners and consent status).

## UI/UX & Key Functionalities
-   **Login**: Via `/admin/login` or standard authenticated login depending on the implementation, using the WDL's own WhatsApp number and password.
-   **Dashboard**: Access to `WDL Dashboard`, including:
    *   List of parishioners assigned for proxy assistance.
    *   Consent status and scope for each assisted parishioner.
    *   Quick actions for permitted tasks, such as checking schedules, submitting forms, or viewing permitted documents.
    *   Audit log showing proxy actions taken on behalf of assisted parishioners.
-   **Cross-Portal Data Access**: Access to general user features like Family Data, Personal Profile, and Companion Rohani only within the limits of explicit consent and RLS policies.

## Technical Details
-   **Authentication**: Supabase Auth (phone + password) using the WDL's own credentials.
-   **Authorization**: Layer 3 access enforced by RLS policies through `public.wdl_consent` and related proxy-permission tables.
-   **Frontend Component**: `src/app/(dashboard)/wdl/dashboard/page.tsx` or equivalent WDL dashboard component.
-   **Backend Endpoints**: Interacts with APIs for WDL consent, proxy access validation, assisted parishioner lists, and audit logs.
-   **Database Tables**: Access to `public.profiles`, `public.families`, `public.wdl_consent`, `public.digital_vault` metadata, and audit/proxy logs.

## Edge Cases
-   **Consent Revocation**: System must immediately revoke access when consent is removed.
-   **Over-delegation**: System should prevent WDL from assisting too many parishioners or accessing data outside the defined scope.
-   **Emergency Access**: WDL should not be used as a substitute for KL/SOS emergency response unless explicitly allowed by policy.

## References
-   [Role Matrix and Access Layers Overview](docs/roles/_overview/role_matrix.md)
-   [Page: Portal 2 Environment Homepage](docs/pages/portal2_environment_homepage.md)
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Feature: Wali Digital Lingkungan (WDL) Proxy Flow](docs/features/wdl_proxy_flow_feature.md)
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)