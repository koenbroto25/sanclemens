'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Package, ShoppingCart, Users, DollarSign, Truck, Tag, Search, Mail, BarChart3, Home
} from 'lucide-react'
import { UmatSearchPanel } from '@/components/umat/UmatSearchPanel' // Assuming this component exists

// Mock data for Admin Marketplace Dashboard
const MOCK_STATS_MARKETPLACE = {
  totalSellers: 50,
  totalProducts: 200,
  pendingOrders: 10,
  totalRevenueMonth: 50000000, // IDR
}

const MOCK_RECENT_ORDERS = [
  { id: 'ORD001', customer: 'Yohanes Bambang Susilo', item: 'Paket Sembako', amount: 150000, status: 'Pending', date: '2026-06-18' },
  { id: 'ORD002', customer: 'Maria Susilowati', item: 'Kopi Khas Lingkungan', amount: 35000, status: 'Dikirim', date: '2026-06-17' },
  { id: 'ORD003', customer: 'Petrus Canisius', item: 'Pakaian Bekas Layak Pakai', amount: 0, status: 'Selesai (Amal)', date: '2026-06-16' },
]

export default function AdminMarketplaceDashboardPage() {
  const [showUmatSearch, setShowUmatSearch] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'orders', 'products', 'sellers', 'reports'

  useEffect(() => {
    // Fetch real data here in a production environment
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Admin Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              Manajemen operasional Pasar Kasih Paroki
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUmatSearch(!showUmatSearch)}>
              <Search className="h-4 w-4 mr-2" />
              Cari Umat Marketplace
            </Button>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Broadcast Seller
            </Button>
          </div>
        </div>

        {/* Umat Search Panel (Conditional) */}
        {showUmatSearch && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Cari Data Umat Marketplace</CardTitle>
              <CardDescription>Cari umat berdasarkan peran di marketplace (seller, buyer, ojek)</CardDescription>
            </CardHeader>
            <CardContent>
              <UmatSearchPanel roleScope="marketplace-admin" />
              <Button variant="outline" className="mt-4" onClick={() => setShowUmatSearch(false)}>Tutup Pencarian</Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="border-b">
          <nav className="flex space-x-4">
            <TabButton icon={Home} label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabButton icon={ShoppingCart} label="Pesanan" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
            <TabButton icon={Package} label="Produk" isActive={activeTab === 'products'} onClick={() => setActiveTab('products')} />
            <TabButton icon={Users} label="Seller" isActive={activeTab === 'sellers'} onClick={() => setActiveTab('sellers')} />
            <TabButton icon={BarChart3} label="Laporan" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} title="Total Seller" value={MOCK_STATS_MARKETPLACE.totalSellers.toLocaleString()} description="Penjual terdaftar" />
              <StatCard icon={Package} title="Total Produk" value={MOCK_STATS_MARKETPLACE.totalProducts.toLocaleString()} description="Produk aktif di marketplace" />
              <StatCard icon={ShoppingCart} title="Pesanan Pending" value={MOCK_STATS_MARKETPLACE.pendingOrders.toLocaleString()} description="Menunggu proses" color="text-yellow-600" />
              <StatCard icon={DollarSign} title="Pendapatan Bulan Ini" value={`Rp ${MOCK_STATS_MARKETPLACE.totalRevenueMonth.toLocaleString('id-ID')}`} description="Estimasi pendapatan marketplace" color="text-green-600" />
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pesanan Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_RECENT_ORDERS.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{order.item} ({order.customer})</p>
                          <p className="text-sm text-muted-foreground">Rp {order.amount.toLocaleString('id-ID')} &bull; {order.date}</p>
                        </div>
                      </div>
                      <Badge variant={order.status === 'Pending' ? 'secondary' : 'default'}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === 'orders' && <div className="p-4"><h2 className="text-xl font-semibold">Manajemen Pesanan</h2><p>Daftar lengkap semua pesanan.</p></div>}
        {activeTab === 'products' && <div className="p-4"><h2 className="text-xl font-semibold">Manajemen Produk</h2><p>Daftar dan moderasi produk.</p></div>}
        {activeTab === 'sellers' && <div className="p-4"><h2 className="text-xl font-semibold">Manajemen Seller</h2><p>Daftar dan pengelolaan penjual.</p></div>}
        {activeTab === 'reports' && <div className="p-4"><h2 className="text-xl font-semibold">Laporan Marketplace</h2><p>Generasi laporan penjualan dan keuangan.</p></div>}

      </div>
    </div>
  )
}

// Reusable StatCard Component (duplicated for self-containment, ideally imported)
function StatCard({ icon: Icon, title, value, description, color = 'text-primary' }: {
  icon: React.ElementType,
  title: string,
  value: string,
  description: string,
  color?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}/50`} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

// Reusable TabButton Component (duplicated for self-containment, ideally imported)
function TabButton({ icon: Icon, label, isActive, onClick }: {
  icon: React.ElementType,
  label: string,
  isActive: boolean,
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 -mb-px rounded-t-lg font-medium transition-colors
        ${isActive
          ? 'border-b-2 border-primary text-primary'
          : 'text-muted-foreground hover:text-primary-foreground hover:bg-muted'
        }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  )
}
