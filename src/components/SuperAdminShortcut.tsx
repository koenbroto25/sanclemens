"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const BYPASS_COOKIE_NAME = 'super_admin_bypass_mode'

export default function SuperAdminShortcut() {
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [typedPassword, setTypedPassword] = useState('')
  const [bypassMode, setBypassMode] = useState(false) // New state for bypass mode
  const router = useRouter()

  // Initialize bypassMode from cookie on mount
  useEffect(() => {
    setBypassMode(document.cookie.includes(`${BYPASS_COOKIE_NAME}=true`))
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Jangan capture saat user mengetik di input field
      const target = e.target as HTMLElement
      const isTypingInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (isTypingInInput) return

      // Shortcut Ctrl+Alt+S untuk membuka modal
      if (e.ctrlKey && e.altKey && e.key === 's') {
        e.preventDefault()
        setShowModal(true)
        setError('')
        setPassword('')
        return
      }

      // Direct typing: capture karakter yang diketik langsung
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const newTypedPassword = (typedPassword + e.key).slice(-5) // Max length for "god25"
        setTypedPassword(newTypedPassword)

        // Check if typed password ends with "god25"
        if (newTypedPassword === 'god25') {
          e.preventDefault()
          setTypedPassword('')
          loginWithPassword('god25')
        }
      }

      // Reset jika user tekan Escape
      if (e.key === 'Escape') {
        setTypedPassword('')
        setShowModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [typedPassword, bypassMode]) // Add bypassMode to dependencies

  // Update bypass mode cookie whenever bypassMode state changes
  useEffect(() => {
    // Set cookie that is accessible by client-side JS (httpOnly: false)
    document.cookie = `${BYPASS_COOKIE_NAME}=${bypassMode}; path=/; max-age=${bypassMode ? 15 * 60 : 0}; SameSite=Lax`;
  }, [bypassMode])

  async function loginWithPassword(pwd: string) {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Password salah')

      // Set bypass mode cookie on successful login
      setBypassMode(true) // Activate bypass mode after login
      
      setShowModal(false)
      setTypedPassword('')
      router.push('/super-admin/dashboard')
    } catch (err: any) {
      setError(err.message)
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Perform login with password from form
    await loginWithPassword(password)
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-xl shadow-xl border border-border p-6 w-full max-w-md mx-4">
        <div className="text-center mb-4">
          <h2 className="font-heading text-xl font-semibold text-primary">🔑 Super Admin</h2>
          <p className="text-text-secondary text-sm mt-1">Masukkan password super admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error-wash text-error text-sm border border-error/20">
              {error}
            </div>
          )}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password Super Admin"
            autoFocus
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />

          <div className="flex items-center space-x-2 mt-4">
            <input
              id="bypass-toggle"
              type="checkbox"
              checked={bypassMode}
              onChange={(e) => setBypassMode(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="bypass-toggle" className="text-sm text-text-secondary">
              Aktifkan Bypass Mode (Lewati Auth/RLS)
            </label>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary font-medium hover:bg-bg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-text-tertiary mt-3">
          Ketik password langsung di halaman manapun, atau Ctrl+Alt+S untuk modal ini.
        </p>
      </div>
    </div>
  )
}