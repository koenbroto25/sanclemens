import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RatingStars } from '@/components/marketplace/RatingStars';

export default async function OjekDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Use service client to bypass RLS
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('full_name, role, status, ojek_vehicle_type, ojek_vehicle_plate, ojek_max_capacity, ojek_status, ojek_rating, total_deliveries')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');
  if (profile.status !== 'active') redirect('/auth/waiting-room');
  
  // Check approval status
  if (profile.ojek_status === 'pending_approval') {
    // User can view but show pending status
  } else if (profile.ojek_status === 'rejected') {
    // Show rejection message
    return (
      <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h1 className="text-2xl font-semibold mb-2 text-red-800">Pendaftaran Ditolak</h1>
            <p className="text-sm text-red-600 mb-4">
              Alasan: {profile.ojek_rejection_reason || 'Tidak ada alasan diberikan'}
            </p>
            <p className="text-sm text-red-600">
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (profile.role !== 'ojek_solidaritas' || profile.ojek_status !== 'active') {
    redirect('/user/dashboard');
  }

  const displayName = profile.full_name || 'Ojek';
  const vehicleType = profile.ojek_vehicle_type || '-';
  const vehiclePlate = profile.ojek_vehicle_plate || '-';
  const maxCapacity = profile.ojek_max_capacity || 0;
  const ojekStatus = profile.ojek_status || 'available';
  const ojekRating = profile.ojek_rating || 0;
  const totalDeliveries = profile.total_deliveries || 0;

  // Fetch available orders (placeholder)
  // TODO: Fetch actual orders from API
  const availableOrders: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'busy':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'offline':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return '🟢 Tersedia';
      case 'busy':
        return '🟡 Sibuk';
      case 'offline':
        return '🔴 Offline';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
      <div className="max-w-5xl mx-auto">
        {/* Status Card */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Ojek Solidaritas — {displayName}</h1>
              <p className="text-sm text-[var(--color-stone,#8b7355)]">
                Kendaraan: <span className="font-semibold uppercase">{vehicleType}</span> — {vehiclePlate}
              </p>
              <p className="text-sm text-[var(--color-stone,#8b7355)]">
                Kapasitas: <span className="font-semibold">{maxCapacity} kg</span>
              </p>
              <div className="mt-2">
                <RatingStars rating={ojekRating} size="sm" totalCount={totalDeliveries} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(ojekStatus)}`}>
                {getStatusLabel(ojekStatus)}
              </span>
              <Link href="/marketplace/ojek-solidaritas/settings" className="px-4 py-2 rounded-lg text-sm font-medium border border-[rgba(200,169,110,0.3)] text-center">
                Ubah Status
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{availableOrders.length}</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Pesanan Tersedia</div>
          </div>
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{totalDeliveries}</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Total Pengantaran</div>
          </div>
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{ojekRating.toFixed(1)}</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Rating</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="font-semibold mb-4">Aksi Cepat</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/marketplace/ojek-solidaritas/orders" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs font-medium">Lihat Pesanan</div>
            </Link>
            <Link href="/marketplace/ojek-solidaritas/history" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs font-medium">Riwayat</div>
            </Link>
            <Link href="/marketplace/ojek-solidaritas/earnings" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xs font-medium">Pendapatan</div>
            </Link>
            <Link href="/marketplace/ojek-solidaritas/settings" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-xs font-medium">Pengaturan</div>
            </Link>
          </div>
        </div>

        {/* Available Orders */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="font-semibold mb-4">Pesanan Tersedia</div>
          {availableOrders.length === 0 ? (
            <div className="text-sm text-[var(--color-stone,#8b7355)] text-center py-8">
              Belum ada pesanan tersedia saat ini. Tetap standby untuk menerima pesanan!
            </div>
          ) : (
            <div className="space-y-3">
              {availableOrders.map((order: any) => (
                <div key={order.id} className="rounded-lg border border-[rgba(200,169,110,0.1)] p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Order #{order.id.slice(0, 8)}</div>
                    <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">
                      Dari: {order.seller_name || 'Toko'} → Ke: {order.delivery_address || 'Alamat tujuan'}
                    </div>
                    <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">
                      Jarak: {order.distance || '~'} km | Reward: Rp {order.delivery_fee?.toLocaleString('id-ID') || 0}
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: 'linear-gradient(135deg, #dfc493, #c8a96e)', color: '#1a0e05' }}>
                    Terima
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}