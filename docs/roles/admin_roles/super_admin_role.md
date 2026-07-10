# Role: Super Admin

This document defines the Super Admin role within the Paroki Santo Klemens Digital Ecosystem. The Super Admin holds the highest level of access and is primarily intended for core developers and system administrators.

## Access Layer
-   **Layer 10**

## Purpose
-   Full, unrestricted control over the entire digital ecosystem.
-   System-level monitoring, maintenance, and configuration.
-   Management of all user accounts, including other administrators.
-   Developer support, debugging, and testing capabilities.

## Key Responsibilities
-   **Global System Oversight**: Monitor application health, error logs, cron job status, and backup integrity across all portals.
-   **User & Admin Management**:
    *   Approve or reject new admin registrations (Paroki, Lingkungan, Marketplace).
    *   Manage `access_layer` and roles for any user in the system.
    *   Restore SOS access for users who have been restricted due to abuse.
    *   View and manage all user profiles and family data.
-   **Data Management**:
    *   Global access to all GAKIN data, with the ability to process and change status.
    *   Oversight of public content (e.g., announcements, banners).
-   **Security & Audit**:
    *   Monitor audit logs and system activities (though E2E encrypted data remains inaccessible).
    *   Ensure compliance with privacy and security policies.
-   **Developer Tools**:
    *   Activate global bypass mode for testing without RLS restrictions.
    *   Simulate other user roles for testing specific functionalities.
    *   Inject test data into the database.
    *   Manage (view/edit) environment variables (in dev/staging environments only, with extreme caution).

## Default Landing Page (Portal Context)
-   `/super-admin/dashboard`

## UI/UX & Key Functionalities
-   **Login**: Special password-only login at `/super-admin/login`.
-   **Dashboard**: `SuperAdminDashboard.tsx` provides a centralized interface with widgets for:
    *   System statistics (total users, environments, errors).
    *   Pending admin registrations queue.
    *   SOS Abuse Tracker panel.
    *   Links to error logs, backup status, cron job heartbeats.
    *   Toggle for "Global Bypass Mode."
    *   Role simulation tool.
-   **Cross-Portal Data Access**: Can view and manage virtually all data across all portals (Family, Profile, Digital Vault, Companion metadata) by bypassing RLS. *Note: E2E encrypted data (like Companion chat transcripts or Whistle-Blower reports) remains inaccessible even to Super Admin.*

## Technical Details
-   **Authentication**: Unique password-based login stored in `public.super_admin_credentials` (bcrypt hashed).
-   **Authorization**: Layer 10 is hardcoded in middleware to bypass all standard RLS and route protection. All actions are logged in `public.super_admin_logs`.
-   **Backend Endpoints**: Direct access to underlying API routes for all features (e.g., `/api/super-admin/registrations`, `/api/v1/users`, `/api/v1/gakin`).
-   **Security**: Actions are heavily logged. Extreme care is required when exercising this role.

## Edge Cases
-   **Forgotten Password**: Requires direct database intervention (SQL update to `super_admin_credentials`).
-   **Accidental Data Modification**: High risk due to bypass mode; robust logging and backup systems are critical.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB XXIII "Sistem Login & Dashboard Admin (Fase 7)"
-   [Masterplan v4.0] Fase 7 "SISTEM LOGIN & DASHBOARD ADMIN"
-   [Userflow v4.0] Bagian 22.1 "Alur Super Admin"
-   [Page: Super Admin Dashboard](docs/pages/admin_dashboards/super_admin_dashboard_page.md)
-   [Feature: SOS Anti-Abuse System](docs/features/sos_anti_abuse_system.md)
-   [Feature: Error Check Engine](docs/features/error_check_engine_feature.md)
-   [Feature: Automated Backup System](docs/features/automated_backup_system_feature.md)
