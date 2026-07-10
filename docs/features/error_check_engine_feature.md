# Feature: Error Check Engine

This document describes the implementation of the three-layered Error Check Engine within the Paroki Santo Klemens Digital Ecosystem. This system is designed to capture, digest, and guard against system errors and failures, ensuring high reliability and prompt developer notification.

## Purpose
-   Proactively capture all system errors and warnings.
-   Provide developers with timely and actionable error digests.
-   Implement a "Dead Man's Switch" to ensure critical cron jobs are running.
-   Improve system stability, maintainability, and reduce downtime.

## Key Functionalities
*   **Layer 1 (Capture)**:
    *   `logError()` function: A centralized utility function to capture all errors, warnings, and critical events from various parts of the application (frontend, backend API routes, edge functions).
    *   Error Data: Logs include `source`, `message`, `severity` (info, warning, critical), and `metadata` (JSONB for detailed context like stack traces, user IDs, request payloads).
    *   Database Storage: All captured errors are stored in the `public.error_logs` table.
*   **Layer 2 (Digest)**:
    *   **Daily Error Digest Cron Job**: A scheduled cron job (e.g., daily at 07:00 WITA) processes new errors from `error_logs`.
    *   **Consolidation**: Groups similar errors, prioritizes critical ones, and creates a summary.
    *   **Developer Notification**: Sends a digest report (e.g., via WhatsApp to `DEVELOPER_PHONE`) containing critical errors and a summary of warnings.
    *   **Error Resolution Tracking**: Marks processed errors as `is_resolved` or updates their status after a digest is sent.
*   **Layer 3 (Guard - Dead Man's Switch)**:
    *   **Cron Heartbeat**: A dedicated API endpoint (`/api/health/cron`) is regularly pinged by an external monitoring service (e.g., Cron-job.org).
    *   **Database Heartbeat Record**: Each successful ping updates a `cron_heartbeat` timestamp in the database.
    *   **Dead Man's Check**: If the `cron_heartbeat` timestamp is not updated within a configured interval (e.g., 20 minutes), it indicates a failure in the external cron triggering system or the API route itself.
    *   **Critical Alert**: An immediate WhatsApp alert is sent to `DEVELOPER_PHONE` if the Dead Man's Switch is triggered.

## UI/UX & User Flow
1.  **Error Occurrence**: Any system error or warning calls `logError()` internally.
2.  **Daily Digest**: Developer receives a daily WhatsApp message with an error summary.
3.  **Dead Man's Alert**: If cron jobs fail to report, developer receives an immediate, critical WhatsApp alert.
4.  **Super Admin Dashboard**: Super Admin (developer) accesses the `/super-admin/dashboard` to view a detailed "Log Error Sistem" (Error Log System) with filtering and search capabilities. They can also monitor "Status Cron Jobs" for heartbeat.

## Technical Details
-   **Database Tables**:
    *   `public.error_logs`: Stores all captured error events.
        ```sql
        CREATE TABLE public.error_logs (
            id BIGSERIAL PRIMARY KEY,
            source TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT CHECK (severity IN ('info','warning','critical')),
            metadata JSONB,
            is_resolved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ```
    *   `public.cron_heartbeat`: Stores timestamps for cron job monitoring.
-   **Backend Endpoints**:
    *   `POST /api/log-error`: General endpoint for logging errors.
    *   `GET /api/cron/error-digest`: Cron job endpoint for processing and sending error digests.
    *   `GET /api/health/cron`: Endpoint for the Dead Man's Switch heartbeat.
    *   `GET /api/health`: General health check endpoint (used by UptimeRobot).
-   **Cron Jobs**: Managed by Cron-job.org (Fase Vercel Free) or Linux Crontab (Fase VPS).
-   **Notification**: WhatsApp API integration for alerts (`DEVELOPER_PHONE`).
-   **Monitoring**: Integrated with Coolify built-in monitoring and Sentry (for detailed stack traces/analytics).

## Edge Cases
-   **WhatsApp API Failure**: If the WhatsApp API itself fails, critical alerts might be delayed. Sentry/Coolify email alerts serve as a backup.
-   **Database Unavailability**: If `error_logs` cannot be written to, errors might be lost. This needs robust local logging or Sentry as primary capture.
-   **False Alarms**: Tuning of monitoring thresholds and error digest logic to minimize false alerts.

## References
-   [GDD v4.0] BAB X "Engineering System" (Implicitly, for overall system robustness)
-   [GDD v4.0] BAB XVIII "Monitoring & Logging" - (Implicitly, for Sentry integration)
-   [GDD v4.0] BAB XVIII-B "Error Check Engine" - "Arsitektur Tiga Lapisan", "Skema `error_logs`"
-   [GDD v4.0] BAB XVIII-C "Sistem Backup Bertahap Dua Tujuan" (Dead Man's Switch context)
-   [GDD v4.0] BAB XXII "Sistem Login & Dashboard Admin (Fase 7)" - 23.7 "Monitoring Sistem & Maintenance" (`Log Error Sistem`, `Status Cron Jobs`)
-   [GDD v4.0] APPENDIX B "Cron Jobs Schedule"
-   [GDD v4.0] APPENDIX C "Environment Variables" (`DEVELOPER_PHONE`)
-   [Role: Super Admin](docs/roles/admin_roles/super_admin_role.md)