import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function UserDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Use service client to bypass RLS for profile lookup
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('full_name, access_layer, lingkungan_slug, status, role, phone')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');
  if (profile.status !== 'active') redirect('/auth/waiting-room');

  const displayName = profile.full_name || 'Umat';
  const accessLayer = profile.access_layer || 2;

  // Check pending approval status
  const hasPendingSeller = profile.role === 'seller' && profile.seller_status === 'pending_approval';
  const hasPendingOjek = profile.role === 'ojek_solidaritas' && profile.ojek_status === 'pending_approval';

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <h1 className="text-2xl font-semibold mb-1">Selamat Datang, {displayName}</h1>
          <p className="text-sm text-[var(--color-stone,#8b7355)]">
            Dashboard Umat Aktif (Layer {accessLayer}) — Paroki Santo Klemens Sepinggan
          </p>
          {profile.lingkungan_slug && (
            <p className="text-sm mt-1">Lingkungan: <span className="font-semibold uppercase">{profile.lingkungan_slug}</span></p>
          )}
          <div className="flex gap-3 mt-4">
            <Link href="/user/pastoral-letters" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg, #dfc493, #c8a96e)', color: '#1a0e05' }}>
              Surat Pastoral
            </Link>
            <Link href="/user/klemen-kerja" className="px-4 py-2 rounded-lg text-sm font-medium border border-[rgba(200,169,110,0.3)]">
              Klemen Kerja
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { value: `Layer ${accessLayer}`, label: 'Level Akses' },
            { value: profile.status === 'active' ? 'Aktif ✓' : 'Pending', label: 'Status Akun' },
            { value: profile.lingkungan_slug?.toUpperCase() || '-', label: 'Lingkungan' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
              <div className="text-xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{stat.value}</div>
              <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {hasPendingSeller && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 mb-4">
            <div className="font-semibold text-yellow-800">⏳ Menunggu Approval Seller</div>
            <div className="text-sm text-yellow-600 mt-1">
              Pendaftaran Anda sedang dalam proses verifikasi oleh admin. Estimasi: 1-2 hari kerja.
            </div>
          </div>
        )}

        {hasPendingOjek && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 mb-4">
            <div className="font-semibold text-yellow-800">⏳ Menunggu Approval Ojek</div>
            <div className="text-sm text-yellow-600 mt-1">
              Pendaftaran Anda sedang dalam proses verifikasi oleh admin. Estimasi: 1-2 hari kerja.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Marketplace Section */}
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-5" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <div className="font-semibold mb-2">🛒 Pasar Kasih</div>
            <div className="text-sm text-[var(--color-stone,#8b7355)] mb-3">
              Jelajahi produk dan jasa dari umat
            </div>
            <div className="flex gap-2">
              <Link href="/marketplace" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'linear-gradient(135deg, #dfc493, #c8a96e)', color: '#1a0e05' }}>
                Browse Marketplace
              </Link>
              {profile.role !== 'seller' && !hasPendingSeller && (
                <Link href="/marketplace/seller/register" className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(200,169,110,0.3)]">
                  Jadi Seller
                </Link>
              )}
            </div>
          </div>

          {/* Upcoming Events Section */}
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-5" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <div className="font-semibold mb-2">📅 Kegiatan Mendatang</div>
            <div className="text-sm text-[var(--color-stone,#8b7355)]">
              <p className="mb-1">• Misa Sabtu, 19 Juli 2026, 07:00</p>
              <p className="mb-1">• Rapat Lingkungan, 22 Juli 2026</p>
              <p>• Senam Ibu Minggu, 20 Juli 2026</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { href: '/user/pastoral-letters', title: 'Surat Pastoral', desc: 'Baca surat pastoral dari Pastor Paroki' },
            { href: '/user/family', title: 'Data Keluarga', desc: 'Kelola data anggota keluarga' },
            { href: '/user/digital-vault', title: 'Digital Vault', desc: 'Simpan dan akses dokumen digital' },
            { href: '/user/data-gakin', title: 'GAKIN', desc: 'Cek status bantuan dan ajukan permohonan' },
            { href: '/user/klemen-kerja', title: 'Klemen Kerja', desc: 'Temukan pekerjaan dan peluang bisnis' },
            { href: '/user/settings', title: 'Pengaturan', desc: 'Kelola akun dan preferensi' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="rounded-xl border border-[rgba(200,169,110,0.15)] p-5 hover:bg-white/60 transition-all" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="font-semibold mb-1">{item.title}</div>
              <div className="text-sm text-[var(--color-stone,#8b7355)]">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}