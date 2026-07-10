# Feature: Digital Vault & OCR Integration

This document describes the implementation and user flow for the Digital Vault, including its integration with OCR (Optical Character Recognition) via Google Cloud Vision, within the Paroki Santo Klemens Digital Ecosystem. This feature allows parishioners to securely upload and manage their digital certificates and documents, with automated data extraction and administrative verification.

## Purpose
-   Provide a secure and centralized digital repository for parishioners' important documents (e.g., baptism certificates, marriage certificates, family cards).
-   Automate the extraction of key data from uploaded documents using OCR technology.
-   Streamline the administrative process of verifying and validating parishioner data.
-   Reduce reliance on physical documents and improve data accuracy.

## Key Functionalities
*   **Document Upload**: Users can securely upload various document types (e.g., images, PDFs) to their personal Digital Vault.
*   **Image Compression**: Uploaded images are automatically compressed (e.g., using `sharp` to WebP) to optimize storage and loading times.
*   **Cloudflare R2 Storage**: All files are stored securely in Cloudflare R2 buckets with appropriate access controls.
*   **OCR Data Extraction**: Google Cloud Vision API is used to perform OCR on uploaded documents, extracting text and identifying key fields.
*   **User Confirmation**: Extracted data is presented to the user for review and confirmation before it is saved or used to update their profile/family data.
*   **Sekretaris Verification**: A Sekretaris Paroki (Layer 5) role is responsible for reviewing and verifying the uploaded documents and the extracted/confirmed data.
*   **Signed URLs**: Secure, time-limited signed URLs are used for accessing private documents from the vault.

## UI/UX & User Flow
1.  **Access Digital Vault**: User navigates to `/vault` from the global navigation.
2.  **Upload Document**: User selects a document type (e.g., Baptism Certificate) and uploads the file.
3.  **Processing**: The system compresses the image, uploads it to R2, and sends it to Google Cloud Vision for OCR.
4.  **Data Review (User)**: The extracted data (e.g., name, date of birth, date of baptism) is displayed to the user. User reviews for accuracy, makes corrections if necessary, and confirms.
5.  **Pending Verification**: The document and its associated data are marked as "pending Sekretaris verification".
6.  **Sekretaris Verification**:
    *   Sekretaris Paroki accesses the Digital Vault admin panel.
    *   Reviews pending documents, comparing the original document with the extracted/user-confirmed data.
    *   Approves or rejects the verification, adding notes if needed.
    *   Upon approval, the data may update relevant profile/family fields.

## Technical Details
-   **Storage**: Cloudflare R2 buckets (`paroki-vault`, `paroki-certificates`).
    *   `paroki-vault`: Stores private user documents (e.g., KTP, KK, sacramental certificates).
    *   `paroki-certificates`: Stores system-generated digital certificates.
-   **Image Processing**: `sharp` library for image compression (e.g., to WebP, 80% quality).
-   **OCR Service**: Google Cloud Vision API (configurable via `OCR_SERVICE_API_KEY` environment variable).
-   **Backend Endpoint**: API routes for document upload, OCR processing, data extraction, user confirmation, and Sekretaris verification.
-   **Database Tables**:
    *   `public.digital_vault`: Stores metadata about uploaded documents, R2 paths, OCR results, and verification status.
    *   `public.profiles`, `public.families`: Updated with verified data from documents.
-   **Authorization**: RLS policies ensure users can only access their own vault documents. Sekretaris has broader access for verification.

## Edge Cases
-   **OCR Inaccuracy**: Users can correct OCR errors; Sekretaris review acts as a human fallback.
-   **File Size/Type Limits**: System enforces maximum file sizes and supported file types during upload.
-   **Security**: Use of signed URLs for private documents ensures temporary and controlled access.
-   **Document Rejection**: Sekretaris can reject documents, prompting the user to re-upload or provide clearer images.

## References
-   [GDD v4.0] BAB XIV "File Storage & Sertifikat Digital" - 14.1 "Cloudflare R2 Storage", 14.2 "Kompresi sharp", 14.3 "Digital Vault Flow — OCR via Google Cloud Vision"
-   [GDD v4.0] BAB VIII "Userflow System" - 8.1 "Onboarding Umat Baru"
-   [GDD v4.0] BAB XXIII "Sistem Login & Dashboard Admin (Fase 7)" - 23.6 "RLS Policies"
-   [Page: Digital Vault Page](docs/pages/digital_vault_page.md) (assuming this page exists or will be created)
-   [Role: Sekretaris I/II](docs/roles/portal1_dpp_roles/sekretaris_i_role.md)
-   [Role: Umat Aktif](docs/roles/general_user_roles/umat_aktif_role.md)