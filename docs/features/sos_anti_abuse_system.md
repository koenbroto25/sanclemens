# Feature: SOS Anti-Abuse System

This document describes the implementation and user flow for the SOS Anti-Abuse System within the Paroki Santo Klemens Digital Ecosystem. This system is designed to prevent misuse of the critical Pastoral SOS button, which sends urgent notifications, while ensuring that genuine emergencies are never blocked.

## Purpose
-   Prevent frivolous or accidental triggers of the Pastoral SOS button.
-   Provide a progressive escalation of restrictions for users who repeatedly misuse the SOS function.
-   Ensure that genuine emergency SOS requests are always delivered, even for users with past abuse history (up to a certain level).
-   Enable administrators (Pastor, KL) to review and restore SOS access for users.

## Key Functionalities
*   **Progressive Restriction Levels**: Implement a tiered system of restriction (Normal, Warning, Cooldown, Blocked) based on trigger frequency.
*   **Initial Confirmation Popup**: For all users (Level 0), a popup confirms the emergency nature of SOS before sending.
*   **Warning Notification**: For Level 1 users (2 triggers in 24h), SOS is sent with a warning popup for the user and a note for responders.
*   **Cooldown with Delay**: For Level 2 users (4 triggers in 7d OR 3 triggers in 24h), SOS is sent after a confirmation and a 10-second delay; responders receive an abuse note.
*   **Blocking Access**: For Level 3 users (6 triggers in 30d OR repeated Level 2 abuse), SOS is completely blocked, and the user is instructed to contact an admin.
*   **Automatic Detection (Cron Job)**: A nightly cron job analyzes trigger patterns to update user restriction levels.
*   **Administrator Restoration**: Pastor or Layer 9+ roles have a dashboard to review and restore SOS access for blocked users.
*   **WhatsApp Notifications**: Automated WhatsApp messages sent to users whose restriction level increases.

## UI/UX & User Flow
1.  **SOS Trigger (Normal User)**: User clicks SOS button. A confirmation popup appears outlining emergency use cases and abuse warnings. User confirms. SOS is sent.
2.  **SOS Trigger (Level 1 - Warning)**: User confirms SOS. SOS is sent. A popup appears warning against repeated use. Responders receive an SOS notification with a "⚠️ User already triggered 2x in 24h" note.
3.  **SOS Trigger (Level 2 - Cooldown)**: User confirms SOS. A stronger popup appears, requiring explicit confirmation: "Saya sadar ini darurat" (I understand this is an emergency), followed by a 10-second delay. SOS is sent. Responders receive an SOS notification with a "🚨 User is in Cooldown" note.
4.  **SOS Trigger (Level 3 - Blocked)**: User clicks SOS. A message appears: "Akun Anda telah dibatasi. Hubungi Pastor atau Ketua Lingkungan untuk pemulihan akses SOS." SOS is NOT sent.
5.  **Admin Restore Flow**: Pastor/Layer 9+ navigates to `/admin/sos-restore` to view users with restricted SOS access. They can select a user and click "Pulihkan Akses" (Restore Access).

## Technical Details
-   **Backend Endpoint**: `POST /api/sos/trigger` (handles abuse check and SOS sending).
-   **Cron Job Endpoint**: `GET /api/cron/sos-abuse-check` (triggered nightly).
-   **Database Table**: `public.sos_abuse_tracker`
    ```sql
    CREATE TABLE public.sos_abuse_tracker (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
        trigger_count_30d INTEGER DEFAULT 0,
        last_trigger_at TIMESTAMPTZ,
        restriction_level INTEGER DEFAULT 0,
        restriction_until TIMESTAMPTZ,
        restriction_reason TEXT,
        flags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_sos_abuse_user ON public.sos_abuse_tracker(user_id);
    CREATE INDEX idx_sos_abuse_restriction ON public.sos_abuse_tracker(restriction_level);
    ```
-   **Restriction Logic**: Implemented directly in `/api/sos/trigger` and updated by `/api/cron/sos-abuse-check`.
-   **Notification**: Utilizes FCM (Firebase Cloud Messaging) for critical notifications and WhatsApp for backup alerts.
-   **Admin Restoration UI**: Frontend page `/admin/sos-restore` for Pastor/Layer 9+ roles.

## Edge Cases
-   **False Positives**: The progressive nature (warnings, delay) minimizes blocking genuine emergencies. Level 3 is only reached after significant repeated triggers.
-   **Admin Override**: Pastor/Layer 9+ can manually restore access, allowing for pastoral discernment.
-   **Privacy**: SOS triggers are logged, but the *content* of the emergency (e.g., from Companion) may be E2E encrypted, maintaining user privacy.

## References
-   [GDD v4.0] BAB III "Backend System" - 3.3 "Pastoral SOS", 3.3a "Anti-Penyalahgunaan SOS"
-   [GDD v4.0] BAB XVIII-B "Error Check Engine" - 997 "Guard" (Dead Man's Switch for cron)
-   [GDD v4.0] BAB XXIII "Sistem Login & Dashboard Admin (Fase 7)" - 23.7 "Monitoring Sistem & Maintenance" (`SOS Abuse Tracker`)
-   [Page: Companion PWA Page](docs/pages/companion_pwa_page.md) (for context of SOS trigger location)
-   [Role: Pastor Paroki](docs/roles/portal1_dpp_roles/pastor_paroki_role.md)
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)