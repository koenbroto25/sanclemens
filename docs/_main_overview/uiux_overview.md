# UI/UX DESIGN SYSTEM - OVERVIEW

This document provides a high-level overview of the UI/UX Design System for the Paroki Santo Klemens Digital Ecosystem. For detailed design guidelines, component specifications, and page layouts, please refer to the modular documentation organized by pages, roles, and features in the `docs/` directory.

## Core Design Philosophy:
-   **Four Interfaces, One Soul**: The ecosystem features four distinct interfaces (Gate Hub + three Portals), each with a unique visual personality but unified by a common spirit of service, community, and solidarity.
-   **Sacred but Human**: Design balances a sacred aesthetic with human-centric usability.
-   **Invisible Grace**: Emphasizes protection of user privacy and anonymity, especially in sensitive areas like donations and GAKIN data.
-   **Consistency over Uniformity**: Maintains a consistent brand identity while allowing for visual distinctions between portals.
-   **Role-RLS-Feature Integration**: Design directly supports the role-based access control (RLS) system.

## Key Design Updates (v3.0):
-   **Gate Hub Introduction**: A new central landing page after login with a neutral, warm, and inviting palette.
-   **Domain Consolidation**: All portals now operate under a single domain (`sanclemens.com`), eliminating the need for SSO token exchange between portals.
-   **WhatsApp OTP Integration**: Design adaptations for WhatsApp-based authentication flows.
-   **New Palette & Icons**: Introduction of a dedicated palette for the Gate Hub and 11 new icons across Gate Hub, Family, GAKIN, Klemen Kerja, and SOS features.
-   **12 New Components**: Including `GateCard`, `FamilyPanel`, `FamilyTree`, `GakinCard`, `SOSAbuseWarning`, `SOSRestorePanel`, `GateBotBubble`, and more, to support new features and interfaces.
-   **Updated Page Layouts**: Specific design guidelines for Gate Hub, Portal 1 Demography Page, Family Page, Portal 2 Homepage, and Portal 3 Coming Soon page.
-   **New Empty States**: Specific messages for empty states across various new features like Family, GAKIN, and Klemen Kerja.
-   **User Settings Hub (2026)**: A centralized 8-tab settings page (`app/(dashboard)/settings/`) replacing scattered preference forms. Sidebar navigation with Profile, Family, Security, Notifications, AI & API Keys, Portal, Data, and Help tabs. Consistent with Gate Hub neutral-warm palette.
-   **Admin API Key Pool Dashboard (2026)**: New admin page (`app/admin/settings/api-keys/`) with statistics cards, provider breakdown, rotation strategy configuration, and key management list.
-   **Technical Guide Modal**: Step-by-step guide for obtaining free API keys (OpenRouter & Gemini), integrated directly into the user settings interface.

## Design Components Highlights:
-   **Color Palettes**: Distinct palettes for Gate Hub, Portal 1 (Paroki), Portal 2 (Lingkungan), and Portal 3 (Pasar Kasih).
-   **Typography**: Consistent use of Cormorant Garamond for headings, Inter for body text, Merriweather for liturgical text, and JetBrains Mono for monospace.
-   **Grid System**: A 12-column grid with responsive breakpoints.
-   **Feature Components**: A rich library of reusable UI components for specific features, ensuring consistency and accelerated development.

For further details on specific design elements, components, or page layouts, please navigate to the respective modular documents in the `docs/` directory.