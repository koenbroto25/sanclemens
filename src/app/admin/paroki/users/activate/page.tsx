"use client"

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneCallIcon, LockIcon } from 'lucide-react'

export default function AdminActivatePage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
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
          <h1 className="font-heading text-3xl font-semibold text-primary">Password Berhasil Diubah!</h1>
          <p className="text-text-secondary">Silakan login dengan password baru Anda.</p>
          <button onClick={() => router.push('/admin/login')}
            className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-light transition-colors">
            Login Sekarang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-semibold text-primary">Aktivasi Akun Admin</h1>
          <p className="text-text-secondary mt-2">Masukkan password baru untuk mengaktifkan akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error-wash text-error text-sm border border-error/20">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">No WhatsApp</label>
            <div className="relative">
              <PhoneCallIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Password Baru</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Konfirmasi Password</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-light transition-colors shadow-sm disabled:opacity-50">
            {loading ? 'Memproses...' : 'Aktivasi'}
          </button>
        </form>
      </div>
    </div>
  )
}
