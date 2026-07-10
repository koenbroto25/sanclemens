// src/lib/middleware-helpers.ts

// A helper function to determine the access layer from a role string.
// This is a simplified example and might need to be more robust based on actual role definitions.
export function getAccessLayer(role: string): number {
  switch (role) {
    case 'umat_aktif': return 2;
    case 'wali_digital': return 3;
    case 'admin_lingkungan': return 4;
    case 'sekretaris': return 5;
    case 'manager_marketplace': return 6; // New role for marketplace admin
    case 'keuangan_marketplace': return 7; // New role for marketplace finance
    case 'admin_paroki': return 8; // Assuming admin_paroki is Layer 8+
    case 'pastor': return 9;
    case 'super_admin': return 10;
    default: return 1; // Default to Layer 1 (Waiting Room) for unassigned or unknown roles
  }
}

// A helper function to check if a user's profile grants access to a required layer.
// This function might be extended to include specific role checks if needed,
// but for now, it primarily checks the access_layer.
export function roleHasAccess(userAccessLayer: number, requiredLayer: number): boolean {
  return userAccessLayer >= requiredLayer;
}