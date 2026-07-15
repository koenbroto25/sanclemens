import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function WaliDigitalDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Use service client to bypass RLS
  const serviceClient = createServiceClient();
  
  // Get current user's profile
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('full_name, role, status, lingkungan_slug, is_wali_digital')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');
  if (profile.status !== 'active') redirect('/auth/waiting-room');
  if (profile.role !== 'umat' || !profile.is_wali_digital) redirect('/user/dashboard');

  const displayName = profile.full_name || 'Wali Digital';
  const lingkunganSlug = profile.lingkungan_slug || '-';

  // Fetch lingkungan members count
  const { count: totalMembers } = await serviceClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('lingkungan_slug', lingkunganSlug)
    .eq('status', 'active');

  // Fetch pending approvals (users with status !== 'active')
  const { count: pendingApprovals } = await serviceClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('lingkungan_slug', lingkunganSlug)
    .neq('status', 'active');

  // Fetch upcoming events (placeholder)
  // TODO: Fetch actual events from API
  const upcomingEvents: any[] = [];

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Wali Digital — {displayName}</h1>
              <p className="text-sm text-[var(--color-stone,#8b7355)]">
                Lingkungan: <span className="font-semibold uppercase">{lingkunganSlug}</span>
              </p>
              <p className="text-sm text-[var(--color-stone,#8b7355)]">
                Status: <span className="font-semibold text-green-600">✓ Aktif</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/wali-digital/approvals" className="px-4 py-2 rounded-lg text-sm font-medium border border-[rgba(200,169,110,0.3)]">
                Approvals
              </Link>
              <Link href="/dashboard/wali-digital/settings" className="px-4 py-2 rounded-lg text-sm font-medium border border-[rgba(200,169,110,0.3)]">
                Pengaturan
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{totalMembers || 0}</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Total Anggota</div>
          </div>
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{pendingApprovals || 0}</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Menunggu Approval</div>
          </div>
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{upcomingEvents.length}</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Kegiatan Bulan Ini</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="font-semibold mb-4">Aksi Cepat</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/wali-digital/approvals" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-xs font-medium">Approve Anggota</div>
            </Link>
            <Link href="/dashboard/wali-digital/announcement" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">📢</div>
              <div className="text-xs font-medium">Kirim Pengumuman</div>
            </Link>
            <Link href="/dashboard/wali-digital/members" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xs font-medium">Daftar Anggota</div>
            </Link>
            <Link href="/dashboard/wali-digital/reports" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs font-medium">Download Laporan</div>
            </Link>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="font-semibold mb-4">Menunggu Approval</div>
          {pendingApprovals === 0 ? (
            <div className="text-sm text-[var(--color-stone,#8b7355)] text-center py-8">
              ✅ Semua anggota sudah aktif. Tidak ada yang menunggu approval.
            </div>
          ) : (
            <div className="space-y-3">
              {/* TODO: Fetch actual pending users from API */}
              <div className="rounded-lg border border-[rgba(200,169,110,0.1)] p-4">
                <div className="text-sm text-[var(--color-stone,#8b7355)]">
                  {pendingApprovals} anggota menunggu persetujuan
                </div>
                <Link href="/dashboard/wali-digital/approvals" className="text-xs font-medium mt-2 inline-block" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>
                  Lihat dan Approve →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="font-semibold mb-4">Kegiatan Mendatang</div>
          {upcomingEvents.length === 0 ? (
            <div className="text-sm text-[var(--color-stone,#8b7355)] text-center py-8">
              Belum ada kegiatan yang dijadwalkan.
            </div>
          ) : (
            <div className="space-y-3">
              {/* TODO: Fetch actual events from API */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}