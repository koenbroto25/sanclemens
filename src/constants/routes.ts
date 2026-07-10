/**
 * Route constants for the application.
 */

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // App 1 — Pastoral
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  VAULT: '/dashboard/vault',
  COMPANION: '/dashboard/companion',
  KASIH: '/dashboard/kasih',
  SOS: '/dashboard/kasih/sos',
  DANA_KASIH: '/dashboard/kasih/dana-kasih',
  KARTU_ANGGOTA: '/dashboard/kartu-anggota',
  KEAKTIFAN: '/dashboard/keaktifan',
  WALI_DIGITAL: '/dashboard/wali-digital',
  LANSIA: '/dashboard/lansia',

  // Layer 4 — Ketua Lingkungan
  KL_VERIFIKASI: '/dashboard/kl/verifikasi',
  KL_MATCHING: '/dashboard/kl/matching',
  KL_ENDORSEMENT: '/dashboard/kl/endorsement',

  // Layer 5 — Sekretaris
  SEKRETARIS_DATA_UMAT: '/dashboard/sekretaris/data-umat',
  SEKRETARIS_VAULT: '/dashboard/sekretaris/vault-verify',
  SEKRETARIS_JADWAL: '/dashboard/sekretaris/jadwal-petugas',
  SEKRETARIS_MODERASI: '/dashboard/sekretaris/moderasi',

  // Layer 6 — Bendahara
  FINANCE_TRANSAKSI: '/dashboard/finance/transactions',
  FINANCE_KOLERTE: '/dashboard/finance/kolekte',
  FINANCE_DANA_DUKA: '/dashboard/finance/dana-duka',
  FINANCE_REPORTS: '/dashboard/finance/reports',

  // Layer 7 — Koordinator
  KOORDINATOR_KEGIATAN: '/dashboard/koordinator/kegiatan',
  KOORDINATOR_LAPORAN: '/dashboard/koordinator/laporan',

  // Layer 8 — Ketua DPP & Tim Audit
  KETUA_DPP_AUDIT: '/dashboard/ketua-dpp/audit',
  KETUA_DPP_APPROVAL: '/dashboard/ketua-dpp/approval',
  KETUA_DPP_REKONSILIASI: '/dashboard/ketua-dpp/rekonsiliasi',

  // Layer 9 — Pastor
  PASTORAL_SOS: '/dashboard/pastoral/sos',
  PASTORAL_SURAT: '/dashboard/pastoral/surat',

  // Admin
  ADMIN_IMPORT: '/dashboard/admin/import',
  ADMIN_ASET: '/dashboard/admin/aset',

  // App 2 — Ekonomi
  EKONOMI: '/ekonomi',
  EKONOMI_MARKETPLACE: '/ekonomi/marketplace',
  EKONOMI_OJOL: '/ekonomi/ojol',
} as const;
