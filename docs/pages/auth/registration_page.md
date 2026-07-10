# Registration Page

This document details the user registration process and UI/UX for the Paroki Santo Klemens Digital Ecosystem.

## URL
-   `/register` (within the `src/app/(auth)/` route group)

## Purpose
-   Allows new users to create an account using their WhatsApp number and password.
-   Initiates the WhatsApp OTP verification flow.
-   Offers an option to connect with an existing family during registration.

## UI/UX Design
-   **Multi-Step Form**: A stepper indicating the progress (e.g., 3 steps: Info, OTP, Family).
-   **Step 1: User Info**:
    *   **Input Fields**: Full Name, WhatsApp Number (with WhatsApp icon), Password, Confirm Password.
    *   **Button**: "Daftar" (Register).
-   **Step 2: OTP Verification**:
    *   **Input Field**: 6-digit OTP input.
    *   **Button**: "Verifikasi" (Verify).
    *   **Link**: "Kirim Ulang OTP" (Resend OTP).
-   **Step 3: Family Connection**:
    *   **Question**: "Apakah Anda bagian dari keluarga yang sudah terdaftar?" (Are you part of a registered family?)
    *   **Options**: "Ya" (Yes) / "Tidak" (No).
    *   **If "Ya"**: Input field for Head of Family's WhatsApp number or Family Code. Button: "Kirim Permintaan Koneksi" (Send Connection Request).
    *   **If "Tidak"**: Input field for new family name and address. Button: "Buat Keluarga Baru" (Create New Family).
-   **Error Messages**: Clear error messages for invalid inputs, existing WhatsApp numbers, expired/incorrect OTP, or network issues.

## Userflow
1.  **User Access**: User navigates to `/register` or clicks "Daftar" from the login/public landing page.
2.  **Step 1 (User Info)**: User fills in their full name, unique WhatsApp number, and chosen password.
3.  **OTP Generation & Send**: On submitting Step 1, the system:
    *   Validates the WhatsApp number for uniqueness.
    *   Generates a 6-digit OTP.
    *   Stores registration data (Name, Password, etc.) temporarily in `otp_verification.registration_data`.
    *   Sends the OTP via WhatsApp to the provided number using `POST /api/otp/send-registration-otp`.
    *   Redirects the user to the OTP verification step.
4.  **Step 2 (OTP Verification)**: User enters the 6-digit OTP received via WhatsApp.
5.  **OTP Verification Request**: System sends a POST request to `/api/otp/verify-registration-otp` to verify the code.
6.  **System Response (OTP)**:
    *   **Success**: If OTP is valid, the system retrieves `registration_data`, calls `supabase.auth.signUp` to create the user, inserts profile data into `public.profiles`, and moves to the Family Connection step.
    *   **Invalid/Expired OTP**: Displays an error message and allows the user to request a new OTP.
    *   **Too Many Attempts**: After 3 failed attempts, prevents further OTP attempts for a period.
7.  **Step 3 (Family Connection)**:
    *   **"Ya" (Connect)**: User provides Head of Family's WhatsApp number or Family Code. A connection request is sent to the Head of Family.
    *   **"Tidak" (New Family)**: User creates a new family, becoming the Head of Family.
8.  **Waiting Room**: After successful registration and family connection (or new family creation), the user's account is set to `PENDING` (Layer 1 - Waiting Room). A notification is sent to the relevant Ketua Lingkungan (KL) for approval.
9.  **KL Approval**: Once approved by KL, the user's account becomes `ACTIVE` (Layer 2), and they can access the Gate Hub upon their next login.

## Technical Details
-   **Frontend Component**: `src/app/(auth)/register/page.tsx` and `src/app/(auth)/verify-otp/page.tsx`.
-   **Backend Endpoints**:
    *   `POST /api/otp/send-registration-otp`: Handles OTP generation and sending via WhatsApp, storing temporary registration data.
    *   `POST /api/otp/verify-registration-otp`: Handles OTP verification, Supabase user creation, and profile insertion.
-   **Database Table**: `public.otp_verification` (with `registration_data` JSONB column).
-   **Authentication Method**: Supabase Auth using phone number.
-   **WhatsApp Integration**: Uses `WABLAS_API_KEY` or similar provider.

## Edge Cases
-   **Existing WhatsApp Number**: User is prompted to log in instead.
-   **OTP Expired**: User can request a new OTP.
-   **OTP Incorrect 3x**: Temporary lockout from OTP attempts.
-   **KL Non-Responsive**: Escalation process as per Userflow.
-   **Family Not Found**: Message to contact secretariat or create new family.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Userflow v4.0] Bagian 2 "Onboarding Umat Baru (WhatsApp OTP + Keluarga)"
-   [GDD v4.0] BAB VI "Authentication & Authorization"
-   [UI/UX Design System v3.0] §10.2 "Login & Registrasi"
-   [Feature: WhatsApp OTP](docs/features/whatsapp_otp.md)
-   [Feature: Family Management](docs/features/family_management.md)