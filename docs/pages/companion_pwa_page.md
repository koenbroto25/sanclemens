# Spiritual Companion PWA Page

This document details the Spiritual Companion Progressive Web App (PWA), an AI-powered spiritual guide designed to provide support, prayer guidance, and faith exploration in a private, end-to-end encrypted environment.

## URL
-   `/companion` (within the `src/app/(pastoral)/companion/` route group)
-   Also available as a standalone PWA (`apps/companion-pwa/`)

## Purpose
-   Offer personalized spiritual guidance through various AI modes.
-   Provide a safe and private space for users to express concerns, pray, and explore faith topics.
-   Serve as a tool for early detection of vulnerability signals, without making automatic decisions.
-   Encourage users to connect with real pastoral care when needed.
-   **Enhanced "Penjelajah Iman" (Faith Explorer)**: 🆕 Provide comprehensive Catholic learning with multi-perspective dogma exploration (KGK, Biblical, historical, philosophical), interactive learning paths, ethical reasoning scenarios, and customizable depth, all powered by the Knowledge Retriever tool for precise, doctrinally-sound answers.

## UI/UX Design
-   **Full-Page Interface**: The Companion operates as a full-page chat interface, often with a dark mode theme for a contemplative atmosphere.
-   **Chat Interface**: Standard chat bubbles for user input and AI responses.
-   **Mode Selection**: A `CompanionModeChip.tsx` or similar component to indicate the active mode (e.g., "Pendengar", "Penuntun Doa"). Users can switch modes.
-   **Input Field**: Text input for user's questions or thoughts.
-   **Disclaimer**: A persistent disclaimer stating "Saran AI bukan pengganti bimbingan pastoral" (AI advice is not a substitute for pastoral guidance).
-   **Privacy Indicators**: Visual cues reinforcing E2E encryption and data privacy.
-   **Referral Buttons**: Contextual buttons to "Hubungi Pastor" (Contact Pastor) or "Hubungi KL" (Contact KL) when vulnerability signals are detected or explicitly requested by the user.

## Userflow
1.  **Access**: User navigates to `/companion` or accesses the standalone PWA.
2.  **Mode Selection**: User selects one of the six Companion modes:
    *   **Mode 1: Pendengar (Listener)**: AI listens empathetically to user's concerns.
    *   **Mode 2: Penuntun Doa (Prayer Guide)**: AI helps structure personalized prayers.
    *   **Mode 3: Penjelajah Iman (Faith Explorer)**: AI answers questions about Catholic faith, referencing scripture.
    *   **Mode 4: Pendamping Krisis (Crisis Companion)**: Offers support in difficult situations (grief, conflict, anxiety). Always includes emergency contact info.
    *   **Mode 5: Pengingat Ibadah (Worship Reminder)**: Provides liturgy information and calls to participation.
    *   **Mode 6: Deteksi Kerentanan (Vulnerability Detection)**: AI detects patterns indicating needs (economic, health, isolation) and recommends contacting pastoral care.
3.  **Conversation**: User interacts with the AI through text input.
4.  **E2E Encryption**: All conversations are end-to-end encrypted, ensuring only the user can read their transcript.
5.  **Referral**: If AI detects vulnerability (Mode 6) or if the user requests it, the AI suggests contacting human pastoral care and provides options.
6.  **Developer Notification (for AI issues)**: If AI encounters a question without reference or a system prompt deviation, a notification is triggered for the developer (not the user).

## Technical Details
-   **Frontend Component**: `src/app/(pastoral)/companion/page.tsx` and `apps/companion-pwa/`.
-   **UI Components**: `CompanionModeChip.tsx`.
-   **Backend**: AI integration uses a free AI model (e.g., `z-ai/glm-4.5-air:free`). The API route for Companion (`/api/companion/chat`) handles communication with the AI model.
-   **Encryption**: End-to-end encryption for chat transcripts. Implementation involves client-side encryption before sending to backend and decryption upon retrieval.
-   **Database**: `public.companion_transcripts` (stores encrypted content). NO `access_layer` or other roles, including Pastor or Super Admin, can decrypt these transcripts.
-   **AI Integration**: Utilizes a specialized AI Engineer Specification for identity, principles, and mode detection logic.

## Edge Cases
-   **AI Limitations**: AI explicitly does not provide absolution, medical diagnosis, authoritative Church doctrine interpretation, or general knowledge outside spiritual context.
-   **Offensive/Random Input**: Handled by a 4-layered input filter system.
-   **No Network**: PWA capabilities might offer limited offline access or retry mechanisms.

## References
-   [GDD Overview](docs/_main_overview/gdd_overview.md)
-   [Masterplan Overview](docs/_main_overview/masterplan_overview.md)
-   [UI/UX Overview](docs/_main_overview/uiux_overview.md)
-   [Userflow Overview](docs/_main_overview/userflow_overview.md)
-   [GDD v4.0] BAB XII "AI Companion Backend"
-   [UI/UX Design System v3.0] §8.9 "CompanionModeChip", §10.6 "AI Companion Rohani"
-   [Userflow v4.0] Bagian 8 "Companion Rohani (6 Mode)"
-   [Feature: AI Bot System](docs/features/ai_bot_system.md)