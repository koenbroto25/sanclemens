'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users, Home, Calendar, BookOpen, Bell, Briefcase, DollarSign,
  AlertTriangle, CheckCircle2, XCircle, Search, Mail, Layers, BarChart3, UserPlusIcon
} from 'lucide-react'
import { UmatSearchPanel } from '@/components/umat/UmatSearchPanel' // Assuming this component will be created

// Mock data for Admin Paroki Dashboard
const MOCK_STATS = {
  totalUsers: 2500,
  totalLingkungan: 30,
  pendingSacrament: 15,
  pendingAdminApproval: 5,
  totalDonationMonth: 12500000, // IDR
  totalExpenditureMonth: 8000000, // IDR
}

const MOCK_ACTIVITIES = [
  { id: '1', type: 'Sakramen', description: 'Pengajuan Baptis Yohanes B. Susilo (Lingk. St. Monica)', status: 'pending', date: '2026-06-18' },
  { id: '2', type: 'Pengumuman', description: 'Pengumuman Misa Peringatan HUT Paroki', status: 'published', date: '2026-06-17' },
  { id: '3', type: 'Keuangan', description: 'Penerimaan Donasi Dana Kasih dari Anonim', status: 'completed', date: '2026-06-17' },
  { id: '4', type: 'Admin', description: 'Pendaftaran Admin Lingkungan St. Petrus pending', status: 'pending', date: '2026-06-16' },
]

export default function AdminParokiDashboardPage() {
  const [showUmatSearch, setShowUmatSearch] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'users', 'finance', 'content', 'reports'

  useEffect(() => {
    // Fetch real data here in a production environment
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Admin Paroki</h1>
            <p className="text-muted-foreground mt-1">
              Manajemen ekosistem digital paroki secara menyeluruh
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUmatSearch(!showUmatSearch)}>
              <Search className="h-4 w-4 mr-2" />
              Cari Umat
            </Button>
            <Button variant="default" asChild>
              <a href="/admin/paroki/pendaftaran-umat">
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Pendaftaran Umat
              </a>
            </Button>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Kirim Broadcast
            </Button>
          </div>
        </div>

        {/* Umat Search Panel (Conditional) */}
        {showUmatSearch && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Cari Data Umat</CardTitle>
              <CardDescription>Cari umat berdasarkan nama, alamat, lingkungan, dll.</CardDescription>
            </CardHeader>
            <CardContent>
              <UmatSearchPanel roleScope="paroki-admin" /> {/* roleScope defines RLS for the search */}
              <Button variant="outline" className="mt-4" onClick={() => setShowUmatSearch(false)}>Tutup Pencarian</Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="border-b">
          <nav className="flex space-x-4">
            <TabButton icon={Home} label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabButton icon={Users} label="Manajemen Umat" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <TabButton icon={DollarSign} label="Keuangan Pastoral" isActive={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
            <TabButton icon={BookOpen} label="Konten & Pengumuman" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
            <TabButton icon={BarChart3} label="Laporan & Statistik" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} title="Total Umat" value={MOCK_STATS.totalUsers.toLocaleString()} description="Umat terdaftar di paroki" />
              <StatCard icon={Home} title="Total Lingkungan" value={MOCK_STATS.totalLingkungan.toLocaleString()} description="Lingkungan aktif" />
              <StatCard icon={BookOpen} title="Sakramen Pending" value={MOCK_STATS.pendingSacrament.toLocaleString()} description="Pengajuan menunggu verifikasi" color="text-yellow-600" />
              <StatCard icon={Briefcase} title="Admin Pending" value={MOCK_STATS.pendingAdminApproval.toLocaleString()} description="Pendaftaran admin baru" color="text-blue-600" />
            </div>

            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Rekap Keuangan Pastoral (Bulan Ini)</CardTitle>
                <CardDescription>Ringkasan pemasukan dan pengeluaran</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pemasukan</p>
                    <p className="text-2xl font-bold text-green-600">Rp {MOCK_STATS.totalDonationMonth.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                    <p className="text-2xl font-bold text-red-600">Rp {MOCK_STATS.totalExpenditureMonth.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_ACTIVITIES.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'Sakramen' && <BookOpen className="h-5 w-5 text-primary" />}
                        {activity.type === 'Pengumuman' && <Bell className="h-5 w-5 text-blue-500" />}
                        {activity.type === 'Keuangan' && <DollarSign className="h-5 w-5 text-green-500" />}
                        {activity.type === 'Admin' && <Briefcase className="h-5 w-5 text-purple-500" />}
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>
                      <Badge variant={activity.status === 'pending' ? 'secondary' : 'default'}>
                        {activity.status === 'pending' ? 'Pending' : 'Selesai'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === 'users' && <div className="p-4"><h2 className="text-xl font-semibold">Manajemen Umat</h2><p>Daftar dan pengelolaan data umat.</p></div>}
        {activeTab === 'finance' && <div className="p-4"><h2 className="text-xl font-semibold">Keuangan Pastoral</h2><p>Detail pemasukan dan pengeluaran dana paroki.</p></div>}
        {activeTab === 'content' && <div className="p-4"><h2 className="text-xl font-semibold">Konten & Pengumuman</h2><p>Manajemen berita, pengumuman, jadwal.</p></div>}
        {activeTab === 'reports' && <div className="p-4"><h2 className="text-xl font-semibold">Laporan & Statistik</h2><p>Generasi laporan demografi, keuangan, dll.</p></div>}

      </div>
    </div>
  )
}

// Reusable StatCard Component
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

// Reusable TabButton Component
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