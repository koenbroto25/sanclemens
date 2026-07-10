# Backend Functions Overview

This document provides a summary of key PL/pgSQL functions implemented in the Paroki Santo Klemens Digital Ecosystem, based on `project_backend_snapshot.md` as of 2026-06-17. It highlights their purpose and usage within the backend.

## Key Database Functions

*   **`public.check_lansia()`**:
    *   **Purpose**: A trigger function that automatically sets the `is_lansia` boolean flag in the `public.profiles` table based on the user's `date_of_birth`. If the age is 60 or above, `is_lansia` is set to `TRUE`.
    *   **Usage**: Triggered `BEFORE INSERT OR UPDATE` on `public.profiles`.

*   **`public.approve_admin_registration(p_registration_id UUID, p_role TEXT, p_access_layer INTEGER, p_lingkungan_slug TEXT DEFAULT NULL) RETURNS UUID`**:
    *   **Purpose**: Used by a Super Admin to approve a pending admin registration. It updates the status of the `admin_registrations` record and marks who approved it. Note: user creation in `auth.users` is handled by the API layer, not directly in this SQL function.
    *   **Usage**: Called by the application backend, typically after a Super Admin action.

*   **`public.log_super_admin_action(p_action TEXT) RETURNS UUID`**:
    *   **Purpose**: Records actions performed by a Super Admin in the `public.super_admin_logs` table. Captures the admin's ID, the action performed, and their IP address.
    *   **Usage**: Called by the application backend whenever a Super Admin performs a sensitive action.

*   **`public.get_user_access_layer(p_user_id UUID) RETURNS INTEGER`**:
    *   **Purpose**: A helper function to retrieve the access layer of a given user. It first checks if the user is a `super_admin` (returning 10 if so), then checks the `access_layer` in their `public.profiles` entry. Defaults to 0 if not found.
    *   **Usage**: Likely used by the backend API or other database functions/views to quickly determine a user's permission level.

*   **`public.update_user_access_layer_from_role()`**:
    *   **Purpose**: A trigger function that updates the `access_layer` column in `public.profiles` whenever the `role` column is changed, ensuring consistency with the `public.roles` table.
    *   **Usage**: Triggered `BEFORE INSERT OR UPDATE` on `public.profiles`.

*   **`public.audit_balance_change()`**:
    *   **Purpose**: A trigger function for financial transactions. It logs changes to account balances (`public.rekenings`) after an approved financial transaction, ensuring an audit trail for financial movements.
    *   **Usage**: Triggered `AFTER INSERT OR UPDATE` on `public.financial_transactions`.

*   **`public.notify_sos_escalation()`**:
    *   **Purpose**: A trigger function designed to send notifications or trigger external actions (e.g., via `pg_net` for HTTP requests) when an SOS request's status changes or is escalated.
    *   **Usage**: Triggered `AFTER UPDATE` on `public.pastoral_sos`.

*   **`public.get_family_members(p_family_id UUID) RETURNS SETOF public.profiles`**:
    *   **Purpose**: Returns all `profiles` (family members) associated with a given `family_id`.
    *   **Usage**: For fetching family member lists in the application.

*   **`public.calculate_lingkungan_members(p_lingkungan_id UUID) RETURNS INTEGER`**:
    *   **Purpose**: Calculates the total number of members in a specific `lingkungan`.
    *   **Usage**: For reporting or dashboard statistics.

*   **`public.get_liturgi_schedule(p_date DATE) RETURNS TABLE(...)`**:
    *   **Purpose**: Retrieves the liturgy schedule for a given date.
    *   **Usage**: For displaying mass schedules.

*   **`public.get_upcoming_activities(p_user_id UUID) RETURNS SETOF public.kegiatan`**:
    *   **Purpose**: Fetches upcoming activities relevant to a specific user (e.g., activities they are PIC for, or from their lingkungan).
    *   **Usage**: For user dashboards.

## API Key Management Functions (051_api_key_management)

*   **`public.get_next_api_key(p_provider VARCHAR(50), p_bot_mode VARCHAR(50) DEFAULT NULL) RETURNS UUID`**:
    *   **Purpose**: Returns the next available API key ID based on rotation strategy (least used, round-robin, etc.). Used for load balancing across the admin key pool.
    *   **Usage**: Called by API key manager to select the best key for each request.

*   **`public.update_api_key_usage(p_key_id UUID, p_success BOOLEAN DEFAULT TRUE, p_error TEXT DEFAULT NULL) RETURNS VOID`**:
    *   **Purpose**: Updates usage statistics for an API key. Marks key as exhausted if errors occur. Called after each API request.
    *   **Usage**: Called after LLM provider API calls to track key health.

*   **`public.get_api_key_stats() RETURNS TABLE (...)`**:
    *   **Purpose**: Returns aggregate statistics per provider (total keys, active keys, exhausted keys, total usage, average usage). Used for admin dashboard.
    *   **Usage**: Admin dashboard to monitor API key pool health.

### Security Note
*   All three functions use `SECURITY DEFINER` to allow the application to read/write encrypted API keys without exposing decryption to the client.
