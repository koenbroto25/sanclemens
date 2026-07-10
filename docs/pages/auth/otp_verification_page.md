# OTP Verification Page

This document details the One-Time Password (OTP) verification process and UI/UX, primarily used during user registration and password reset flows.

## URL
-   `/verify-otp` (within the `src/app/(auth)/` route group)

## Purpose
-   Verifies the user's identity by confirming a 6-digit code sent to their registered WhatsApp number.
-   A crucial step in both new user registration and password recovery.

## UI/UX Design
-   **Header**: "Verifikasi Kode OTP Anda" (Verify Your OTP Code).
-   **Instruction Text**: "Kami telah mengirimkan kode 6 digit ke nomor WhatsApp Anda. Mohon masukkan kode tersebut di bawah." (We have sent a 6-digit code to your WhatsApp number. Please enter the code below.)
-   **Input Field**: Six individual input boxes or a single masked input for the 6-digit OTP.
-   **Timer**: A countdown timer indicating when the OTP will expire (e.g., "Kode akan kedaluwarsa dalam 04:30").
-   **Button**: "Verifikasi" (Verify).
-   **Links**: "Kirim Ulang OTP" (Resend OTP), "Bantuan?" (Help?).
-   **Error Messages**: Specific messages for incorrect codes, expired codes, or too many failed attempts.

## Userflow
1.  **OTP Generation & Send**: (Triggered from Registration Page or Forgot Password flow)
    *   System generates a 6-digit OTP and sends it to the user's WhatsApp number.
    *   OTP is stored in `public.otp_verification` with an expiry time (e.g., 5 minutes) and attempt counter.
2.  **User Access**: User is redirected to `/verify-otp` with a contextual payload (e.g., via query parameters or client-side store) indicating if it's for registration or password reset.
3.  **Input OTP**: User checks their WhatsApp and enters the received 6-digit code.
4.  **Verification Request**: System sends a POST request to `/api/otp/verify-registration-otp` (for registration) or `/api/otp/verify-password-reset` (for password reset) with the OTP and associated user identifier.
5.  **System Response**:
    *   **Success**:
        *   **Registration**: If successful, the user's account is created/activated in Supabase Auth, profile data is inserted, and the user proceeds to the Family Connection step (if applicable) or the Waiting Room.
        *   **Password Reset**: If successful, the user is redirected to a "Set New Password" page.
    *   **Incorrect Code**: Displays "Kode OTP salah. Mohon coba lagi." (Incorrect OTP code. Please try again.). Increments attempt counter.
    *   **Expired Code**: Displays "Kode OTP telah kedaluwarsa. Mohon minta kirim ulang." (OTP code has expired. Please request a resend.).
    *   **Too Many Attempts**: After 3 failed attempts, displays "Terlalu banyak percobaan. Silakan minta kode baru." (Too many attempts. Please request a new code.) and potentially locks the user out for a short period.
6.  **Resend OTP**: If the OTP expires or the user requests it, a new OTP is generated and sent, resetting the timer and attempt counter.

## Technical Details
-   **Frontend Component**: `src/app/(auth)/verify-otp/page.tsx`.
-   **Backend Endpoints**:
    *   `POST /api/otp/send-registration-otp`
    *   `POST /api/otp/verify-registration-otp`
    *   `POST /api/otp/send-password-reset-otp` (for password reset)
    *   `POST /api/otp/verify-password-reset` (for password reset)
-   **Database Table**: `public.otp_verification` (stores OTP, phone, expiry, attempts).
-   **OTP Mechanism**: 6-digit numerical code, 5-minute expiry.

## Edge Cases
-   **No WhatsApp Message Received**: User can request resend or contact support.
-   **Network Latency**: Potential delay in OTP delivery, handled by resend option.
-   **Expired OTP**: User must request a new code.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Userflow v4.0] Bagian 2.2 "Alur Lengkap WhatsApp OTP"
-   [GDD v4.0] BAB VI "Authentication & Authorization"
-   [GDD v4.0] BAB VI.3 "Alur Lengkap WhatsApp OTP"
-   [UI/UX Design System v3.0] §10.2 "Login & Registrasi"
-   [Feature: WhatsApp OTP](docs/features/whatsapp_otp.md)