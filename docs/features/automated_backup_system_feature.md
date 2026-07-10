# Feature: Automated Backup System (Two-Tiered)

This document describes the implementation of the automated, two-tiered backup system for the Paroki Santo Klemens Digital Ecosystem. This system ensures the integrity and availability of critical database data through local and cloud backups, transitioning from manual to automated processes as the deployment evolves.

## Purpose
-   Protect against data loss due to system failures, human error, or catastrophic events.
-   Ensure business continuity by enabling rapid data restoration.
-   Provide redundant backup storage locations for enhanced data security.
-   Automate the backup process for efficiency and reliability in the full deployment phase.

## Key Functionalities
*   **Database Backup (pg_dump)**: Utilizes PostgreSQL's `pg_dump` utility to create a complete backup of the primary Supabase database.
*   **Local Storage (VPS Phase)**: Backups are initially stored locally on the VPS with a short retention period (e.g., 7 days).
*   **Cloud Storage (Cloudflare R2)**: Backups are then copied to Cloudflare R2 for off-site, long-term storage (e.g., 30-day retention with lifecycle rules).
*   **Automated Scheduling (VPS Phase)**: A Linux Crontab job on the VPS automates the daily backup process.
*   **Weekly Verification (VPS Phase)**: A separate script is scheduled weekly to restore a backup to a temporary database and perform basic data integrity checks (e.g., checking record counts).
*   **Manual Backup (Vercel Free Phase)**: During the initial Vercel Free phase, backups are performed manually by developers.

## UI/UX & User Flow
1.  **Manual Backup (Fase Vercel Free)**:
    *   Developer manually triggers `pg_dump` locally or exports via Supabase Dashboard.
    *   Backup files are saved to developer's local machine, Google Drive, or manually uploaded to Cloudflare R2.
2.  **Automated Backup (Fase VPS)**:
    *   A nightly cron job executes `backup.sh` on the VPS.
    *   `pg_dump` captures Supabase DB, compresses it, and saves it locally.
    *   `rclone` copies the local backup to Cloudflare R2.
3.  **Weekly Backup Verification (Fase VPS)**:
    *   A weekly cron job executes `verify-backup.sh`.
    *   The script restores a backup to a temporary DB and runs checks (e.g., `umat_profiles` count).
    *   If verification fails, a WhatsApp alert is sent to `DEVELOPER_PHONE`.
4.  **Super Admin Monitoring**: Super Admin (developer) can view "Status Backup" on the `/super-admin/dashboard` to see the last backup time and verification results.

## Technical Details
-   **Backup Script**: `scripts/backup.sh` (for VPS phase)
    ```bash
    #!/bin/bash
    set -euo pipefail
    DATE=$(date +%Y-%m-%d)
    BACKUP_FILE="/backups/paroki-$DATE.sql.gz"
    pg_dump "$SUPABASE_DB_URL" | gzip > "$BACKUP_FILE"
    rclone copy "$BACKUP_FILE" r2:paroki-backups/daily/
    find /backups -name "paroki-*.sql.gz" -mtime +7 -delete
    ```
-   **Verification Script**: `scripts/verify-backup.sh` (for VPS phase)
-   **Cron Jobs**: Linux Crontab on VPS.
    *   Daily backup: `0 2 * * * /home/deploy/scripts/backup.sh` (02:00 WITA)
    *   Weekly verification: `0 3 * * 0 /home/deploy/scripts/verify-backup.sh` (03:00 WITA, Sunday)
-   **Storage**: Cloudflare R2 bucket `paroki-backups`.
-   **Environment Variables**: `SUPABASE_DB_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_BACKUP`, `BACKUP_DIR`, `BACKUP_RETENTION_LOCAL_DAYS`, `BACKUP_RETENTION_R2_DAYS`, `DEVELOPER_PHONE`.
-   **Monitoring**: Integrated with `Error Check Engine` for alerts on backup failures.

## Edge Cases
-   **Supabase Downtime**: If Supabase is unreachable, `pg_dump` will fail. Monitoring systems should alert developers.
-   **R2 Connectivity**: Failure to copy to R2 will leave backups only on the VPS; alerts are crucial.
-   **Corrupt Backups**: The verification script helps detect basic corruption, but full data integrity checks might require more extensive tools.
-   **Retention Policies**: R2 lifecycle rules ensure old backups are automatically purged.

## References
-   [GDD v4.0] BAB XVIII-C "Sistem Backup Bertahap Dua Tujuan" - "Arsitektur Backup", "Script Backup Harian", "Script Verifikasi Mingguan", "Catatan Fase Vercel Free"
-   [GDD v4.0] BAB XVII "CI/CD & Deployment" - 17.1 "Arsitektur Deployment Bertahap", 17.4 "Setup VPS + Coolify"
-   [GDD v4.0] APPENDIX B "Cron Jobs Schedule"
-   [GDD v4.0] APPENDIX C "Environment Variables" (`SUPABASE_DB_URL`, `R2_*`, `DEVELOPER_PHONE`)
-   [Feature: Error Check Engine](docs/features/error_check_engine_feature.md)
-   [Role: Super Admin](docs/roles/admin_roles/super_admin_role.md)