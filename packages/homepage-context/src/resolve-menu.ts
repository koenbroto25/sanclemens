type MenuItem = string;

type HomepageContext = 'paroki' | 'lingkungan' | 'marketplace';

export function resolveMenuByContext(
    ctx: HomepageContext,
    layer: number,
    mpRole: string
): MenuItem[] {

    if (ctx === 'paroki') {
        return PINTU1_MENUS[layer] ?? PINTU1_MENUS[2];
    }

    if (ctx === 'lingkungan') {
        const base = layer >= 4 ? PINTU2_KL_MENUS : PINTU2_UMAT_MENUS;
        return base;
    }

    if (ctx === 'marketplace') {
        return PINTU3_MENUS[mpRole] ?? PINTU3_MENUS['buyer'];
    }

    return [];
}

const PINTU1_MENUS: Record<number, MenuItem[]> = {
    2: ['beranda', 'profil', 'vault', 'sakramen', 'companion', 'kasih', 'kartu-anggota'],
    3: ['beranda', 'profil', 'vault', 'sakramen', 'companion', 'kasih', 'wali-digital'],
    4: ['beranda', 'profil', 'vault', 'sakramen', 'companion', 'kasih', 'lingkungan-kl', 'morning-check'],
    5: ['beranda', 'administrasi', 'data-umat', 'vault-verify', 'jadwal-petugas'],
    6: ['beranda', 'keuangan', 'kolekte', 'dana-duka', 'laporan-keuangan'],
    7: ['beranda', 'kegiatan', 'laporan', 'governance'],
    8: ['beranda', 'governance', 'audit', 'approval', 'rekonsiliasi'],
    9: ['beranda', 'pastoral-sos', 'surat', 'homily', 'laporan-bulanan'],
    10: ['semua-menu', 'admin-teknis'],
};

const PINTU2_UMAT_MENUS: MenuItem[] = [
    'beranda-lingkungan', 'kegiatan', 'anggota', 'kasih-wilayah'
];

const PINTU2_KL_MENUS: MenuItem[] = [
    'beranda-lingkungan', 'kegiatan', 'anggota', 'kasih-wilayah',
    'verifikasi-umat', 'morning-check', 'keuangan-lingkungan', 'matching', 'broadcast'
];

const PINTU3_MENUS: Record<string, MenuItem[]> = {
    buyer:    ['katalog', 'keranjang', 'pesanan', 'request-ojek'],
    seller:   ['katalog', 'keranjang', 'pesanan', 'dashboard-seller', 'kelola-produk', 'pendapatan'],
    driver:   ['katalog', 'request-ojek-masuk', 'histori-perjalanan'],
    mp_admin: ['moderasi', 'seller-approval', 'fee-tracking', 'kelola-iklan', 'laporan-transaksi'],
};