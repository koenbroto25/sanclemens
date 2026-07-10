# Feature: WhatsApp OTP (One-Time Password)

This document describes the implementation and user flow for the WhatsApp OTP feature, which is central to user registration and authentication within the Paroki Santo Klemens Digital Ecosystem. It replaces email-based OTP for improved accessibility and reliability.

## Purpose
-   Provide a secure and widely accessible method for user verification.
-   Streamline the registration and login process by leveraging WhatsApp as a primary communication channel.
-   Enhance security by implementing a time-limited, single-use code.

## Key Functionalities
*   **OTP Generation**: Generate a 6-digit one-time password upon user registration or password reset request.
*   **WhatsApp Delivery**: Send the generated OTP to the user's registered WhatsApp number via an integrated WhatsApp API provider (e.g., Wablas, Fonnte, Whacenter).
*   **OTP Verification**: Allow users to input the received OTP for validation.
*   **Rate Limiting & Expiry**: Implement limits on OTP attempts (e.g., 3 attempts) and set an expiry time for the OTP (e.g., 5 minutes) to prevent brute-force attacks.
*   **Account Activation**: Successfully verified OTP activates the user's account into the Layer 1 (Waiting Room) state for further approval.

## UI/UX & User Flow
1.  **Registration/Login**: User initiates registration by providing Name, WhatsApp Number, and Password.
2.  **OTP Request**: Upon submission, the system generates and sends an OTP to the provided WhatsApp number.
3.  **OTP Input Screen**: User is directed to an OTP verification screen to input the 6-digit code.
4.  **Verification**:
    *   **Success**: If the OTP is correct and within expiry/attempt limits, the user's account is verified and transitions to Layer 1 (Waiting Room).
    *   **Failure**: Incorrect OTP or expiry prompts error messages and allows for re-attempt or resend (with rate limiting).
    *   **Max Attempts**: Account may be temporarily locked after too many failed attempts.

## Technical Details
-   **Backend Endpoint**:
    *   `POST /api/otp/send`: Generates and sends OTP.
    *   `POST /api/otp/verify`: Validates the submitted OTP.
-   **Database Table**: `public.otp_verification`
    ```sql
    CREATE TABLE public.otp_verification (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_otp_phone ON public.otp_verification(phone, created_at DESC);
    ```
-   **WhatsApp Provider**: Integrates with a third-party WhatsApp API service (configurable via `WHATSAPP_PROVIDER` and API key environment variables).
-   **Environment Variables**: `WABLAS_API_KEY`, `WHATSAPP_PROVIDER`, `OTP_CODE_LENGTH`, `OTP_EXPIRY_MINUTES`.

## Edge Cases
-   **Network Delays**: Users may experience delays in receiving OTP; a "Resend OTP" option is provided with appropriate cooldowns.
-   **Incorrect WhatsApp Number**: User must be able to edit their number during registration if they made a mistake.
-   **Abuse Prevention**: Rate limiting on OTP send requests to prevent spamming.

## References
-   [GDD v4.0] BAB III "Backend System" - 3.2 "WhatsApp OTP Endpoints"
-   [GDD v4.0] BAB VI "Authentication & Authorization" - 6.1 "Authentication Flow", 6.2 "Tabel `otp_verification`", 6.3 "Alur Lengkap WhatsApp OTP"
-   [GDD v4.0] BAB VIII "Userflow System" - 8.1 "Onboarding Umat Baru"
-   [Page: Registration Page](docs/pages/auth/registration_page.md)
-   [Page: OTP Verification Page](docs/pages/auth/otp_verification_page.md)
-   [Page: Login Page](docs/pages/auth/login_page.md)