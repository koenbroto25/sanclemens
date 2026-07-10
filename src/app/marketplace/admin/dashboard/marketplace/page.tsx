"use client"

import { useState } from 'react'

export default function AdminMarketplaceDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-semibold text-primary">Dashboard Admin Marketplace</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-primary">0</div>
          <div className="text-sm text-text-secondary">Produk Aktif</div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-primary">0</div>
          <div className="text-sm text-text-secondary">Seller Terdaftar</div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-primary">0</div>
          <div className="text-sm text-text-secondary">Pesanan</div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
          <div className="text-2xl font-bold text-warning">0</div>
          <div className="text-sm text-text-secondary">Menunggu Moderasi</div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-lg font-medium text-text-primary mb-2">Coming Soon</h2>
        <p className="text-sm text-text-secondary">
          Dashboard Admin Marketplace akan aktif penuh pada Fase 4. Saat ini Pasar Kasih masih dalam tahap Coming Soon.
        </p>
      </div>
    </div>
  )
}
