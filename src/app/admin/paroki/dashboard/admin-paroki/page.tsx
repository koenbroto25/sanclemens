"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminParokiDashboard() {
  const [stats, setStats] = useState({
    totalUmat: 0,
    totalKeluarga: 0,
    totalLingkungan: 0,
    umatPending: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const { count: totalUmat } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: totalKeluarga } = await supabase
        .from('families')
        .select('*', { count: 'exact', head: true })

      const { count: totalLingkungan } = await supabase
        .from('lingkungan')
        .select('*', { count: 'exact', head: true })

      const { count: umatPending } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      setStats({
        totalUmat: totalUmat || 0,
        totalKeluarga: totalKeluarga || 0,
        totalLingkungan: totalLingkungan || 0,
        umatPending: umatPending || 0,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-semibold text-primary">Dashboard Admin Paroki</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-primary">{stats.totalUmat}</div>
          <div className="text-sm text-text-secondary">Total Umat Aktif</div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-primary">{stats.totalKeluarga}</div>
          <div className="text-sm text-text-secondary">Total Keluarga</div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-primary">{stats.totalLingkungan}</div>
          <div className="text-sm text-text-secondary">Lingkungan</div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-warning">{stats.umatPending}</div>
          <div className="text-sm text-text-secondary">Umat Pending</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-medium text-text-primary mb-4">Akses Cepat</h2>
          <div className="space-y-2">
            <a href="/data-gakin" className="block p-3 rounded-lg bg-bg hover:bg-primary/5 transition-colors text-sm text-text-primary">
              Ã°Å¸â€œÅ  Data GAKIN
            </a>
            <a href="/dashboard/admin" className="block p-3 rounded-lg bg-bg hover:bg-primary/5 transition-colors text-sm text-text-primary">
              Ã°Å¸â€Â§ Pengaturan Admin
            </a>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-medium text-text-primary mb-4">Ringkasan</h2>
          <p className="text-sm text-text-secondary">
            Dashboard Admin Paroki memberikan akses penuh ke seluruh data paroki, termasuk demografi, 
            data keluarga, data GAKIN, manajemen vault, dan laporan pastoral. 
            Gunakan menu di sidebar untuk mengelola setiap bagian.
          </p>
        </div>
      </div>
    </div>
  )
}
