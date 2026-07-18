import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import '../../../styles/user.css';
import '../../../styles/layout-user.css';

export default async function UserDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('full_name, access_layer, lingkungan_slug, status, role, phone, seller_status, ojek_status')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');
  if (profile.status !== 'active') redirect('/auth/waiting-room');

  const displayName = profile.full_name || 'Umat';
  const accessLayer = profile.access_layer || 2;

  // Check pending approval status
  const hasPendingSeller = profile.role === 'seller' && profile.seller_status === 'pending_approval';
  const hasPendingOjek = profile.role === 'ojek_solidaritas' && profile.ojek_status === 'pending_approval';

  // Check if user has unverified data in umat_staging
  const { data: unverifiedStaging } = await serviceClient
    .from('umat_staging')
    .select('id')
    .eq('phone', profile.phone)
    .is('verified_at', null)
    .limit(1);

  const hasUnverifiedData = unverifiedStaging && unverifiedStaging.length > 0;

  // Fetch upcoming events from API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let upcomingEvents = [];
  try {
    const eventsRes = await fetch(`${baseUrl}/api/events/upcoming`, { next: { revalidate: 300 } });
    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      upcomingEvents = eventsData.data || [];
    }
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
  }

  return (
    <div className="user-dashboard-container">
      <div className="user-dashboard-wrapper">
        
        {/* Contextual Banner for Data Verification */}
        {hasUnverifiedData && (
          <div className="verification-banner">
            <div className="verification-banner-content">
              <span className="verification-banner-icon">📋</span>
              <div className="verification-banner-text">
                <div className="verification-banner-title">Data Anda Perlu Dikonfirmasi</div>
                <div className="verification-banner-desc">
                  Kami memiliki data sensus yang perlu diverifikasi. Silakan konfirmasi data Anda.
                </div>
              </div>
            </div>
            <Link href="/user/data-completion" className="verification-banner-cta">
              Verifikasi Sekarang
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        )}

        {/* Welcome Card */}
        <div className="user-welcome-card">
          <h1 className="user-welcome-title">Selamat Datang, {displayName}</h1>
          <p className="user-welcome-subtitle">
            Dashboard Umat Aktif (Layer {accessLayer}) — Paroki Santo Klemens Sepinggan
          </p>
          {profile.lingkungan_slug && (
            <p className="user-lingkungan-badge">Lingkungan: <span>{profile.lingkungan_slug}</span></p>
          )}
          <div className="user-actions">
            <Link href="/user/pastoral-letters" className="user-action-primary">
              Surat Pastoral
            </Link>
            <Link href="/user/companion" className="user-action-primary">
              Pendamping Rohani
            </Link>
            <Link href="/user/klemen-kerja" className="user-action-secondary">
              Klemen Kerja
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="user-stats-grid">
          {[
            { value: `Layer ${accessLayer}`, label: 'Level Akses' },
            { value: profile.status === 'active' ? 'Aktif' : 'Pending', label: 'Status Akun' },
            { value: profile.lingkungan_slug?.toUpperCase() || '-', label: 'Lingkungan' },
          ].map((stat, i) => (
            <div key={i} className="user-stat-card">
              <div className="user-stat-value">{stat.value}</div>
              <div className="user-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Pending approval banners */}
        {hasPendingSeller && (
          <div className="user-section-card" style={{ borderLeft: '4px solid var(--color-gold)' }}>
            <div className="user-section-title">⏳ Menunggu Approval Seller</div>
            <div className="user-section-content">
              Pendaftaran Anda sedang dalam proses verifikasi oleh admin. Estimasi: 1-2 hari kerja.
            </div>
          </div>
        )}

        {hasPendingOjek && (
          <div className="user-section-card" style={{ borderLeft: '4px solid var(--color-gold)' }}>
            <div className="user-section-title">⏳ Menunggu Approval Ojek</div>
            <div className="user-section-content">
              Pendaftaran Anda sedang dalam proses verifikasi oleh admin. Estimasi: 1-2 hari kerja.
            </div>
          </div>
        )}

        {/* Marketplace & Events Section */}
        <div className="user-quick-links-grid">
          <div className="user-quick-link">
            <div className="user-quick-link-title">🛒 Pasar Kasih</div>
            <div className="user-quick-link-desc" style={{ marginBottom: '0.75rem' }}>
              Jelajahi produk dan jasa dari umat
            </div>
            <div className="user-actions">
              <Link href="/marketplace" className="user-action-primary" style={{ fontSize: '0.75rem' }}>
                Browse Marketplace
              </Link>
              {profile.role !== 'seller' && !hasPendingSeller && (
                <Link href="/marketplace/seller/register" className="user-action-secondary" style={{ fontSize: '0.75rem' }}>
                  Jadi Seller
                </Link>
              )}
            </div>
          </div>

          <div className="user-quick-link">
            <div className="user-quick-link-title">📅 Kegiatan Mendatang</div>
            <div className="user-quick-link-desc">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: any) => (
                  <div key={event.id} style={{ marginBottom: '0.35rem', lineHeight: '1.5' }}>
                    <strong>• {event.title}</strong>
                    <br />
                    <span>{new Date(event.datetime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {event.location && event.location !== '-' && <span> — {event.location}</span>}
                  </div>
                ))
              ) : (
                <p>Belum ada kegiatan mendatang.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="user-quick-links-grid" style={{ marginTop: '1rem' }}>
          {[
            { href: '/user/pastoral-letters', title: 'Surat Pastoral', desc: 'Baca surat pastoral dari Pastor Paroki' },
            { href: '/user/family', title: 'Data Keluarga', desc: 'Kelola data anggota keluarga' },
            { href: '/user/digital-vault', title: 'Digital Vault', desc: 'Simpan dan akses dokumen digital' },
            { href: '/user/bantuan-sosial', title: 'Bantuan Sosial (GAKIN)', desc: 'Cek status bantuan dan ajukan permohonan' },
            { href: '/user/klemen-kerja', title: 'Klemen Kerja', desc: 'Temukan pekerjaan dan peluang bisnis' },
            { href: '/user/settings', title: 'Pengaturan', desc: 'Kelola akun dan preferensi' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="user-quick-link">
              <div className="user-quick-link-title">{item.title}</div>
              <div className="user-quick-link-desc">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}