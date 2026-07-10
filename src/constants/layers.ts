/**
 * Access Layers for Twin App Architecture
 * Ref: GDD Bab VI "Authentication & Authorization"
 */

export const LAYERS = {
  /** Layer 0 — Publik: Halaman publik tanpa login */
  PUBLIC: 0,

  /** Layer 1 — Waiting Room: Umat baru yang belum diverifikasi */
  WAITING_ROOM: 1,

  /** Layer 2 — Umat Terverifikasi: Akses penuh fitur pastoral dasar */
  UMAT_TERVERIFIKASI: 2,

  /** Layer 3 — Wali Digital: Proxy terbatas untuk umat yang membutuhkan asistensi */
  WALI_DIGITAL: 3,

  /** Layer 4 — Ketua Lingkungan: Manajemen wilayah */
  KETUA_LINGKUNGAN: 4,

  /** Layer 5 — Sekretaris: Verifikasi vault, CRUD data umat, moderasi (TANPA akses keuangan) */
  SEKRETARIS: 5,

  /** Layer 6 — Bendahara: Keuangan, transaksi, laporan */
  BENDAHARA: 6,

  /** Layer 7 — Koordinator Bidang: Program kerja, kegiatan, laporan */
  KOORDINATOR_BIDANG: 7,

  /** Layer 8 — Ketua DPP & Tim Audit: Laporan agregat, rekonsiliasi, audit */
  KETUA_DPP: 8,

  /** Layer 9 — Pastor Paroki: Dashboard pastoral penuh, SOS, surat pastoral */
  PASTOR: 9,

  /** Layer 10 — Super Admin: Akses teknis penuh (kecuali isi Companion & identitas donatur) */
  SUPER_ADMIN: 10,
} as const;

/**
 * Minimum layer required for each route group.
 * Used in middleware for route protection.
 */
export const ROUTE_LAYERS: Record<string, number> = {
  '/dashboard': LAYERS.UMAT_TERVERIFIKASI,
  '/dashboard/vault': LAYERS.UMAT_TERVERIFIKASI,
  '/dashboard/companion': LAYERS.UMAT_TERVERIFIKASI,
  '/dashboard/kasih': LAYERS.UMAT_TERVERIFIKASI,
  '/dashboard/kartu-anggota': LAYERS.UMAT_TERVERIFIKASI,
  '/dashboard/keaktifan': LAYERS.UMAT_TERVERIFIKASI,
  '/dashboard/wali-digital': LAYERS.WALI_DIGITAL,
  '/dashboard/kl': LAYERS.KETUA_LINGKUNGAN,
  '/dashboard/sekretaris': LAYERS.SEKRETARIS,
  '/dashboard/finance': LAYERS.BENDAHARA,
  '/dashboard/koordinator': LAYERS.KOORDINATOR_BIDANG,
  '/dashboard/ketua-dpp': LAYERS.KETUA_DPP,
  '/dashboard/pastoral': LAYERS.PASTOR,
  '/dashboard/admin': LAYERS.SUPER_ADMIN,
};
