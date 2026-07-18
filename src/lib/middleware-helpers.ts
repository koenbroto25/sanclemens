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

    // Layer 7 (Komsos)
    case 'komsos': return 7;

    // Layer 8 (DPP/Wakil)
    case 'wakil_ketua': return 8;
    case 'vikaris': return 8;
    case 'teolog': return 8;
    case 'bendahara_dpp': return 8;

    // Layer 6 (Paroki Admin - additional)
    case 'admin_marketplace': return 6;
    case 'koordinator_bidang': return 6;
    case 'operator_ict': return 6;

    // Layer 4 (Lingkungan - additional)
    case 'koordinator_stasi': return 4;

    // Layer 2 (General - additional)
    case 'mitra_eksternal': return 2;

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

/**
 * Returns the required access layer for a given URL path.
 * This is used by middleware to enforce role-based access control.
 * Public routes return 0 (no authentication required).
 */
export function getRequiredLayerForPath(pathname: string): number {
  // Public routes - no auth required
  if (
    pathname.startsWith('/public') ||
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register') ||
    pathname.startsWith('/auth/waiting-room') ||
    pathname.startsWith('/marketplace') && !pathname.includes('/seller/') && !pathname.includes('/ojek-solidaritas/') && !pathname.includes('/admin/')
  ) {
    return 0;
  }

  // Layer 2: Authenticated user routes
  if (
    pathname.startsWith('/user/') ||
    pathname.startsWith('/marketplace/seller/') ||
    pathname.startsWith('/marketplace/ojek-solidaritas/')
  ) {
    return 2;
  }

  // Layer 3: Wali Digital
  if (pathname.startsWith('/dashboard/wali-digital')) {
    return 3;
  }

  // Layer 4: Lingkungan admin routes
  if (pathname.startsWith('/admin/lingkungan/')) {
    return 4;
  }

  // Layer 6: Paroki admin routes
  if (
    pathname.startsWith('/admin/paroki/') ||
    pathname.startsWith('/marketplace/admin/')
  ) {
    return 6;
  }

  // Layer 9: Pastor routes
  if (pathname.startsWith('/admin/pastor/')) {
    return 9;
  }

  // Layer 10: Super Admin routes
  if (pathname.startsWith('/super-admin/')) {
    return 10;
  }

  // Default: require authentication (Layer 2 minimum)
  return 2;
}