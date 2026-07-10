"use client"

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminRegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [lingkunganSlug, setLingkunganSlug] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const roles = [
    { value: 'admin_paroki', label: 'Admin Paroki' },
    { value: 'admin_lingkungan', label: 'Admin Lingkungan' },
    { value: 'admin_marketplace', label: 'Admin Marketplace' },
  ]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          role_requested: role,
          lingkungan_slug: role === 'admin_lingkungan' ? lingkunganSlug : undefined,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center space-y-4 p-6 max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-heading text-3xl font-semibold text-primary">Pendaftaran Terkirim!</h1>
          <p className="text-text-secondary">
            Pendaftaran Anda sebagai admin sedang menunggu persetujuan Super Admin. Anda akan menerima notifikasi WhatsApp setelah disetujui.
          </p>
          <Link href="/" className="inline-block px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-light transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg py-12">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-semibold text-primary">Daftar Admin</h1>
          <p className="text-text-secondary mt-2">Isi data untuk mendaftar sebagai admin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error-wash text-error text-sm border border-error/20">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Nama Lengkap *</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">No WhatsApp *</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Role *</label>
            <select required value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Pilih role</option>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {role === 'admin_lingkungan' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Lingkungan *</label>
              <input type="text" required value={lingkunganSlug} onChange={(e) => setLingkunganSlug(e.target.value)} placeholder="contoh: santo-yusuf"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-light transition-colors shadow-sm disabled:opacity-50">
            {loading ? 'Mengirim...' : 'Daftar'}
          </button>
        </form>
      </div>
    </div>
  )
}
