# Waiting Room Page

This document details the Waiting Room page, which serves as a temporary holding area for newly registered users pending approval from the Ketua Lingkungan (KL).

## URL
-   `/waiting-room` (within the `src/app/(auth)/` route group)

## Purpose
-   Inform new users that their account is pending activation.
-   Provide instructions on what to expect next (KL approval).
-   Display relevant contact information if they have questions.

## UI/UX Design
-   **Header**: "Akun Anda Dalam Proses Verifikasi" (Your Account is Under Verification).
-   **Instruction Text**: "Terima kasih telah mendaftar di Ekosistem Digital Paroki Santo Klemens. Akun Anda saat ini sedang menunggu persetujuan dari Ketua Lingkungan (KL) Anda. Proses ini biasanya memakan waktu 1-2 hari kerja." (Thank you for registering. Your account is currently awaiting approval from your Ketua Lingkungan (KL). This process usually takes 1-2 business days.)
-   **Call to Action**: "Anda akan menerima notifikasi WhatsApp setelah akun Anda aktif." (You will receive a WhatsApp notification once your account is active.)
-   **Contact Information**: "Jika Anda memiliki pertanyaan, silakan hubungi Sekretariat Paroki." (If you have any questions, please contact the Parish Secretariat.)
-   **No Navigation**: Limited navigation to prevent access to unauthorized sections of the application.

## Userflow
1.  **Redirection to Waiting Room**: After successful registration and OTP verification, if the user's `access_layer` is `Layer 1 (Pending)`, the system redirects them to `/waiting-room`.
2.  **Notification to KL**: The system automatically sends a push notification and WhatsApp message to the relevant Ketua Lingkungan (KL) regarding the new pending user.
3.  **User Awaits Approval**: The user remains on this page (or returns to it if they try to log in before approval) until their account is activated.
4.  **KL Approval Action**: The KL reviews the new registration (e.g., from their dashboard in Portal 1 or Portal 2) and decides to `TERIMA` (Accept), `HUBUNGI DULU` (Contact First), or `TOLAK` (Reject) the registration.
5.  **Account Activation**:
    *   **Accepted**: If accepted by the KL, the user's `access_layer` is updated to `Layer 2 (Active)`.
    *   **Rejected**: If rejected, the user's account might be deactivated or receive specific instructions.
6.  **User Notification**:
    *   **Accepted**: The system sends a WhatsApp notification to the user informing them that their account is active. On their next login, they will be directed to the Gate Hub.
    *   **Rejected**: The system sends a WhatsApp notification informing them of the rejection, potentially with a reason.

## Technical Details
-   **Frontend Component**: `src/app/(auth)/waiting-room/page.tsx`.
-   **Backend Interactions**: Implicitly interacts with the KL's dashboard (via `/api/kl/pending-users`) to retrieve pending user data and the `/api/kl/approve-user` endpoint for activation.
-   **Database**: `public.profiles` table (specifically `access_layer` column), `public.system_notifications`, `public.whatsapp_logs`.
-   **Notifications**: FCM push notifications and WhatsApp messages (via `WABLAS_API_KEY`).

## Edge Cases
-   **KL Non-Responsive**: An escalation mechanism is in place if the KL does not respond within a defined timeframe (e.g., 7 days), escalating to higher-level administrators.
-   **Manual Registration**: For users without smartphones or WhatsApp, a manual registration process is handled by the Secretariat, bypassing the Waiting Room.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Userflow v4.0] Bagian 2 "Onboarding Umat Baru (WhatsApp OTP + Keluarga)"
-   [GDD v4.0] BAB VI "Authentication & Authorization"
-   [UI/UX Design System v3.0] §10.2 "Login & Registrasi"
-   [Role: Ketua Lingkungan](docs/roles/portal2_environment_roles/ketua_lingkungan_role.md)