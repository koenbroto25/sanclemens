// src/types/user.ts

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string; // e.g., "Umat", "Pastor", "Ketua Lingkungan"
  layer?: number; // Access layer
  // Add any other relevant user profile fields
}
