# Super Admin Dashboard Page

This document details the Super Admin Dashboard page, which provides a comprehensive suite of tools for global oversight, high-level management, and system maintenance. This dashboard is designed primarily for developers and highly authorized personnel.

## URL
-   `/super-admin/dashboard` (within the `src/app/super-admin/` route group)

## Purpose
-   Provide global administrative control over the entire digital ecosystem.
-   Facilitate user and admin management, including pending registrations.
-   Monitor system health, error logs, cron jobs, and backup statuses.
-   Offer tools for developer-centric tasks like bypass mode and data injection.

## UI/UX Design
-   **Dashboard Layout**: A comprehensive layout with various panels and widgets for different functionalities.
-   **Overview Statistics**: Displays key system statistics, such as total users, total environments, pending registrations, and critical error counts.
-   **Admin & User Management**:
    *   **Pending Admin Registrations List**: Shows new admin registrations awaiting approval (Paroki, Lingkungan, Marketplace). Includes "Approve" and "Reject" actions.
    *   **Active Admin List**: Displays all registered and active administrators.
    *   **Active User List (All Layers)**: Comprehensive list of all users, with options to view profile details.
    *   **User Search & Detail**: Functionality to search users by name, WhatsApp number, or ID, and view their full profile.
    *   **Role & Access Layer Management**: Tools to modify user `access_layer` or `role`.
    *   **Environment Settings**: Set or change `lingkungan_slug` for environment admins or users.
-   **System Monitoring & Maintenance (Developer-centric)**:
    *   **System Error Logs**: Displays logs from `public.error_logs` with filter and search capabilities.
    *   **Cron Job Status**: Monitors `cron_heartbeat` to ensure all cron jobs are running; highlights Dead Man's Switch triggers.
    *   **Backup Status**: Shows the status of recent `pg_dump` backups (local and R2) and weekly verification results.
    *   **SOS Abuse Tracker**: Monitors `public.sos_abuse_tracker` for users frequently triggering SOS, with an option to "Pulihkan Akses" (Restore SOS Access).
    *   **Application Health Check**: Displays overall health status of the application (e.g., Supabase connection, main API availability).
    *   **Environment Variables Management**: (Optional, highly sensitive) View or edit environment variables for quick testing/debugging (dev/staging only).
-   **Content & Data Oversight**:
    *   **Public Content Management**: Manage content for the public homepage or Gate Hub banners.
    *   **Global GAKIN Data Management**: View all GAKIN data without environment restrictions, with processing/status change capabilities.
    *   **Global Family Data Management**: Manage family data, invitations, and connections across the system.
-   **Developer & Bypass Mode Features**:
    *   **Global Bypass Mode Toggle**: A toggle to bypass all authentication and RLS checks throughout the application for full inspection and debugging.
    *   **Role Simulation**: Allows Super Admin to simulate login as any other role (e.g., Parish Admin, KL, Regular User).
    *   **Test Data Injection**: Tools to quickly inject test data into the database.
    *   **Cache/Migrations Reload**: Options to clear application cache or re-trigger database migrations (with confirmation).

## Userflow
1.  **Login**: Super Admin accesses `/super-admin/login` and logs in with a password (special authentication, not WhatsApp OTP).
2.  **Dashboard Access**: Upon successful login, the Super Admin is redirected to `/super-admin/dashboard`.
3.  **Management Tasks**: Super Admin uses various panels to perform high-level management, monitoring, and developer tasks.
4.  **Admin Registration Approval**: Reviews pending admin registrations and approves/rejects them, triggering automated WhatsApp notifications for new admin passwords.
5.  **Monitoring**: Regularly checks system logs, backup statuses, and SOS abuse reports.
6.  **Developer Tools**: Utilizes bypass mode or data injection for testing and debugging.

## Technical Details
-   **Frontend Component**: `src/app/super-admin/dashboard/page.tsx`.
-   **Backend Endpoints**:
    *   `GET /api/super-admin/registrations`: List pending admin registrations.
    *   `POST /api/super-admin/registrations/[id]/approve`: Approve registration.
    *   `POST /api/super-admin/registrations/[id]/reject`: Reject registration.
    *   Endpoints for all data access and system controls.
-   **Database Tables**: `public.super_admin_credentials`, `public.super_admin_logs`, `public.admin_registrations`, `public.profiles`, `public.error_logs`, `public.cron_heartbeat`, `public.sos_abuse_tracker`, `public.data_gakin`, etc.
-   **Authentication**: Special password-only login for Super Admin (`super_admin_credentials`).
-   **Authorization**: Layer 10 (Super Admin) bypasses all RLS and route checks, but logs all actions.

## Edge Cases
-   **Forgotten Password**: Handled via direct SQL reset in `public.super_admin_credentials`.
-   **Security**: Extreme caution required when using developer tools like bypass mode or environment variable editing. All Super Admin actions are logged.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB XXIII "Sistem Login & Dashboard Admin (Fase 7)"
-   [Masterplan v4.0] Fase 7 "SISTEM LOGIN & DASHBOARD ADMIN"
-   [Userflow v4.0] Bagian 22 "Sistem Login & Dashboard Admin (Fase 7)"
-   [Role: Super Admin](docs/roles/admin_roles/super_admin_role.md)