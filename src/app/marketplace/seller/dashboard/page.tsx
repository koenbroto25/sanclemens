import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RatingStars } from '@/components/marketplace/RatingStars';

export default async function SellerDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Use service client to bypass RLS
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('full_name, role, status, store_name, store_category, seller_rating, total_sales')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');
  if (profile.status !== 'active') redirect('/auth/waiting-room');
  
  // Check approval status
  if (profile.seller_status === 'pending_approval') {
    // User can view but show pending status
  } else if (profile.seller_status === 'rejected') {
    return (
      <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h1 className="text-2xl font-semibold mb-2 text-red-800">Pendaftaran Ditolak</h1>
            <p className="text-sm text-red-600 mb-4">
              Alasan: {profile.seller_rejection_reason || 'Tidak ada alasan diberikan'}
            </p>
            <p className="text-sm text-red-600">
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (profile.role !== 'seller' || profile.seller_status !== 'active') {
    redirect('/user/dashboard');
  }

  const displayName = profile.full_name || 'Seller';
  const storeName = profile.store_name || 'Toko Saya';
  const storeCategory = profile.store_category || '-';
  const sellerRating = profile.seller_rating || 0;
  const totalSales = profile.total_sales || 0;

  // Fetch recent orders
  const { data: recentOrders } = await serviceClient
    .from('marketplace_orders')
    .select('id, status, total_price, created_at, buyer_id')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
      <div className="max-w-5xl mx-auto">
        {/* Store Info Card */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold mb-1">{storeName}</h1>
              <p className="text-sm text-[var(--color-stone,#8b7355)]">
                Kategori: <span className="font-semibold">{storeCategory}</span>
              </p>
              <div className="mt-2">
                <RatingStars rating={sellerRating} size="sm" totalCount={totalSales} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/marketplace/seller/products" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg, #dfc493, #c8a96e)', color: '#1a0e05' }}>
                Kelola Produk
              </Link>
              <Link href="/marketplace/seller/orders" className="px-4 py-2 rounded-lg text-sm font-medium border border-[rgba(200,169,110,0.3)]">
                Lihat Pesanan
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">0</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Produk Aktif</div>
          </div>
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">{recentOrders?.length || 0}</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Total Pesanan</div>
          </div>
          <div className="rounded-xl border border-[rgba(200,169,110,0.15)] p-4 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <div className="text-3xl font-bold text-[var(--color-gold-deep,#c8a96e)]">0</div>
            <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">Pendapatan Bulan Ini</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 mb-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="font-semibold mb-4">Aksi Cepat</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/marketplace/seller/products/add" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">➕</div>
              <div className="text-xs font-medium">Tambah Produk</div>
            </Link>
            <Link href="/marketplace/seller/orders" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs font-medium">Lihat Pesanan</div>
            </Link>
            <Link href="/marketplace/seller/products" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xs font-medium">Daftar Produk</div>
            </Link>
            <Link href="/marketplace/seller/settings" className="rounded-lg border border-[rgba(200,169,110,0.2)] p-3 text-center hover:bg-white/60 transition-all">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-xs font-medium">Pengaturan Toko</div>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="font-semibold mb-4">Pesanan Terbaru</div>
          {(recentOrders?.length || 0) === 0 ? (
            <div className="text-sm text-[var(--color-stone,#8b7355)] text-center py-8">
              Belum ada pesanan. Bagikan toko Anda untuk mulai menjual!
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders?.map((order: any) => (
                <div key={order.id} className="rounded-lg border border-[rgba(200,169,110,0.1)] p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">Order #{order.id.slice(0, 8)}</div>
                    <div className="text-xs text-[var(--color-stone,#8b7355)] mt-1">
                      Rp {order.total_price?.toLocaleString('id-ID') || 0}
                    </div>
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <Link href={`/marketplace/seller/orders/${order.id}`} className="text-xs font-medium" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>
                    Detail
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}