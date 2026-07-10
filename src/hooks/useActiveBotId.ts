/**
 * Central bot routing logic for AI v6.0
 * Determines active bot_id based on pathname, user role, and access layer
 */

import { usePathname } from 'next/navigation';

export function useActiveBotId(
  userRole: string | null,
  accessLayer: number
): string {
  const pathname = usePathname();

  // Super Admin
  if (accessLayer === 10) return 'bot_superadmin';

  // Pastor
  if (accessLayer === 9 && userRole === 'pastor') return 'bot_pastor';

  // Admin routes
  if (pathname.startsWith('/admin/lingkungan')) return 'bot_5';
  if (pathname.startsWith('/admin/paroki')) {
    if (accessLayer >= 5 && accessLayer < 9) return 'bot_4';
    if (accessLayer >= 9) return 'bot_pastor';
  }

  // Dashboard routes
  if (pathname.startsWith('/dashboard/keluarga')) return 'bot_6';
  if (pathname.startsWith('/dashboard/sakramen')) return 'bot_6';
  if (pathname.startsWith('/dashboard/klemen-kerja')) return 'bot_7';
  if (pathname.startsWith('/dashboard/bantuan')) return 'bot_7';
  if (pathname.startsWith('/dashboard/learn-catholic')) return 'bot_8';
  if (pathname.startsWith('/dashboard')) return 'bot_3'; // Default dashboard = Companion Rohani

  // Public routes
  if (pathname.startsWith('/public/pasar-kasih')) return 'bot_7';
  if (pathname.startsWith('/public/learn-catholic')) return 'bot_8';

  // Homepage default
  return 'bot_1';
}