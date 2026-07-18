/**
 * Canonical Role Definitions
 * Source: docs/roles/_overview/role_matrix.md and migration files
 */

export interface RoleDefinition {
  value: string;
  label: string;
  access_layer: number;
  category: 'admin' | 'dpp' | 'environment' | 'marketplace' | 'general';
  description: string;
}

export const ROLES: RoleDefinition[] = [
  // Layer 10: Super Admin
  {
    value: 'super_admin',
    label: 'Super Admin',
    access_layer: 10,
    category: 'admin',
    description: 'Developer/System administrator. Full system access (bypass RLS), monitoring, developer tools.',
  },

  // Layer 9: Pastor
  {
    value: 'pastor',
    label: 'Pastor Paroki',
    access_layer: 9,
    category: 'dpp',
    description: 'Parish pastor. Spiritual leader, ultimate approver, pastoral care oversight, whistle-blower access.',
  },
  {
    value: 'vikaris',
    label: 'Vikaris (Assistant Pastor)',
    access_layer: 9,
    category: 'dpp',
    description: 'Assistant pastor. Supports parish pastor, can perform most pastoral functions.',
  },
  {
    value: 'teolog',
    label: 'Teolog',
    access_layer: 9,
    category: 'dpp',
    description: 'Theologian. Can access and edit knowledge base content, AI prompt management.',
  },

  // Layer 8: Wakil DPP
  {
    value: 'wakil_ketua',
    label: 'Wakil Ketua DPP',
    access_layer: 8,
    category: 'dpp',
    description: 'Deputy council chair. High-level management, major approvals, audit reconciliation.',
  },
  {
    value: 'wakil_dpp',
    label: 'Wakil DPP (alias)',
    access_layer: 8,
    category: 'dpp',
    description: 'Alternative spelling for Wakil Ketua DPP.',
  },
  {
    value: 'bendahara_dpp',
    label: 'Bendahara DPP',
    access_layer: 8,
    category: 'dpp',
    description: 'DPP Treasurer. Financial oversight at DPP level, budget approval, major financial decisions.',
  },

  // Layer 7: Koordinator Bidang
  {
    value: 'koordinator_bidang',
    label: 'Koordinator Bidang',
    access_layer: 7,
    category: 'dpp',
    description: 'Program coordinator. Manages specific pastoral areas (Pewartaan, Liturgia, Koinonia, Diakonia, Martyria).',
  },
  {
    value: 'sub_koordinator',
    label: 'Sub-Koordinator',
    access_layer: 7,
    category: 'dpp',
    description: 'Sub-coordinator supporting Koordinator Bidang.',
  },
  {
    value: 'komsos',
    label: 'Komsos (Komisi Sosial)',
    access_layer: 7,
    category: 'dpp',
    description: 'Social services coordinator. Manages charity/social programs, GAKIN approvals.',
  },
  {
    value: 'seksos',
    label: 'Seksos (Sekretaris Sosial)',
    access_layer: 7,
    category: 'dpp',
    description: 'Secretary of social services. Supports Komsos functions.',
  },

  // Layer 6: Bendahara / Koordinator
  {
    value: 'bendahara',
    label: 'Bendahara Paroki',
    access_layer: 6,
    category: 'dpp',
    description: 'Parish treasurer. Financial management, transaction approvals, budget oversight, RK-1/RK-3.',
  },
  {
    value: 'admin_marketplace',
    label: 'Manager Marketplace',
    access_layer: 6,
    category: 'marketplace',
    description: 'Marketplace manager. Product moderation, seller/buyer management, marketplace finance.',
  },
  {
    value: 'koordinator_stasi',
    label: 'Koordinator Stasi',
    access_layer: 6,
    category: 'dpp',
    description: 'Station coordinator. Manages specific church stations.',
  },

  // Layer 5: Sekretaris
  {
    value: 'sekretaris',
    label: 'Sekretaris Paroki',
    access_layer: 5,
    category: 'dpp',
    description: 'Parish secretary. Handles parish records, document verification, new user verification, kegiatan management.',
  },
  {
    value: 'operator_ict',
    label: 'Operator ICT',
    access_layer: 5,
    category: 'admin',
    description: 'ICT operator. Technical maintenance, system monitoring, error logs access.',
  },

  // Layer 4: Ketua Lingkungan
  {
    value: 'ketua_lingkungan',
    label: 'Ketua Lingkungan (KL)',
    access_layer: 4,
    category: 'environment',
    description: 'Environment head. Manages specific lingkungan, member verification, local activities, SOS restoration.',
  },
  {
    value: 'sekretaris_lingkungan',
    label: 'Sekretaris Lingkungan',
    access_layer: 4,
    category: 'environment',
    description: 'Environment secretary. Local administrative tasks, record keeping.',
  },
  {
    value: 'bendahara_lingkungan',
    label: 'Bendahara Lingkungan',
    access_layer: 4,
    category: 'environment',
    description: 'Environment treasurer. Local financial management, iuran collection.',
  },

  // Layer 3: Wali Digital
  {
    value: 'wali_digital',
    label: 'Wali Digital Lingkungan (WDL)',
    access_layer: 3,
    category: 'general',
    description: 'Digital guardian. Assists others with limited proxy access (based on consent).',
  },

  // Layer 2: Umat Aktif
  {
    value: 'umat',
    label: 'Umat (Default)',
    access_layer: 2,
    category: 'general',
    description: 'Regular parishioner. Basic access to all portals, family data, profile, digital vault, companion.',
  },

  // Layer 0: External
  {
    value: 'mitra_eksternal',
    label: 'Mitra Eksternal',
    access_layer: 0,
    category: 'general',
    description: 'External partner. Limited access for economic app (App 2).',
  },

  // Marketplace specific
  {
    value: 'seller',
    label: 'Seller (Marketplace)',
    access_layer: 2,
    category: 'marketplace',
    description: 'Marketplace seller. Can list products, manage orders.',
  },
  {
    value: 'buyer',
    label: 'Buyer (Marketplace)',
    access_layer: 2,
    category: 'marketplace',
    description: 'Marketplace buyer. Can browse and purchase products.',
  },
  {
    value: 'ojek_solidaritas',
    label: 'Ojek Solidaritas',
    access_layer: 2,
    category: 'marketplace',
    description: 'Solidarity ride service provider. Handles deliveries for marketplace orders.',
  },
];

/**
 * Get role by value
 */
export function getRoleByValue(value: string): RoleDefinition | undefined {
  return ROLES.find((r) => r.value === value);
}

/**
 * Get roles by access layer
 */
export function getRolesByAccessLayer(layer: number): RoleDefinition[] {
  return ROLES.filter((r) => r.access_layer === layer);
}

/**
 * Get roles by category
 */
export function getRolesByCategory(category: RoleDefinition['category']): RoleDefinition[] {
  return ROLES.filter((r) => r.category === category);
}

/**
 * Validate if a role value is canonical
 */
export function isValidRole(value: string): boolean {
  return ROLES.some((r) => r.value === value);
}