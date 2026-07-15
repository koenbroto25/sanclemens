// src/lib/middleware-helpers.ts

// A helper function to determine the access layer from a role string.
// Aligned with src/lib/constants/roles.ts
export function getAccessLayer(role: string): number {
  switch (role) {
    // Layer 2 (General + Marketplace)
    case 'umat': return 2;
    case 'seller': return 2;
    case 'buyer': return 2;
    case 'ojek_solidaritas': return 2;

    // Layer 3
    case 'wali_digital': return 3;

    // Layer 4 (Lingkungan)
    case 'ketua_lingkungan': return 4;
    case 'sekretaris_lingkungan': return 4;
    case 'bendahara_lingkungan': return 4;

    // Layer 5-6 (Paroki Admin)
    case 'sekretaris': return 5;
    case 'admin_paroki': return 6;

    // Layer 9 (Pastor)
    case 'pastor': return 9;

    // Layer 10 (Super Admin)
    case 'super_admin': return 10;

    // Default
    default: return 1;
  }
}

// A helper function to check if a user's profile grants access to a required layer.
// This function might be extended to include specific role checks if needed,
// but for now, it primarily checks the access_layer.
export function roleHasAccess(userAccessLayer: number, requiredLayer: number): boolean {
  return userAccessLayer >= requiredLayer;
}