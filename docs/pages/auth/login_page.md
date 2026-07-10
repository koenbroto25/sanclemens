# Login Page

This document details the login process and UI/UX for accessing the Paroki Santo Klemens Digital Ecosystem.

## URL
-   `/login` (within the `src/app/(auth)/` route group)

## Purpose
-   Allows registered users (Layer 2+) to access the Gate Hub and subsequent portals.
-   Authenticates users using their WhatsApp number and password.

## UI/UX Design
-   **Input Fields**: Two primary input fields:
    1.  **WhatsApp Number**: Labeled "No WhatsApp" with a WhatsApp icon.
    2.  **Password**: Labeled "Password" with a password visibility toggle.
-   **Button**: "Login" button.
-   **Links**: "Lupa Password?" (Forgot Password) and "Belum punya akun? Daftar di sini" (Don't have an account? Register here).
-   **Error Messages**: Clear, concise error messages for invalid credentials, too many attempts, or blocked accounts.

## Userflow
1.  **User Access**: User navigates to `/login` or clicks "Masuk" from the public landing page.
2.  **Input Credentials**: User enters their registered WhatsApp number and password.
3.  **Authentication Request**: System sends a POST request to `/api/admin/login` (for admins) or `/api/auth/login` (for regular users) with credentials.
4.  **System Response**:
    *   **Success**: If credentials are valid, system generates a JWT and sets a session cookie. User is redirected to the Gate Hub (`/gate-hub`).
    *   **Invalid Credentials**: Displays an error message: "Nomor WhatsApp atau password salah." (Incorrect WhatsApp number or password).
    *   **Too Many Attempts**: After 3 failed attempts, displays "Terlalu banyak percobaan. Akun Anda diblokir sementara selama 15 menit." (Too many attempts. Your account is temporarily blocked for 15 minutes).
    *   **Blocked Account**: Displays "Akun Anda telah dibatasi. Harap hubungi Sekretariat Paroki." (Your account has been restricted. Please contact the Parish Secretariat).
5.  **Redirect**: On successful login, the user is redirected to the `/gate-hub` page.

## Technical Details
-   **Frontend Component**: `src/app/(auth)/login/page.tsx`, utilizing input components from `@paroki/ui`.
-   **Backend Endpoint**: `POST /api/admin/login` (for admin roles) or `POST /api/auth/login` (for regular users), which interacts with Supabase Auth.
-   **Authentication Method**: Supabase Auth using phone number as identifier.
-   **Session Management**: JWT (30 minutes idle, 24 hours absolute) stored in cookies.

## Edge Cases
-   **Unregistered WhatsApp Number**: System prompts user to register.
-   **Expired Session**: User is prompted to log in again.
-   **Network Error**: Displays a generic network error message.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [Userflow v4.0] Bagian 2.2 "Alur Lengkap WhatsApp OTP"
-   [GDD v4.0] BAB VI "Authentication & Authorization"
-   [UI/UX Design System v3.0] §10.2 "Login & Registrasi"