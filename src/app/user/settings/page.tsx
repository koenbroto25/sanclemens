'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  lingkungan_id: string | null;
  notification_preferences: Record<string, boolean> | null;
  preferred_language: string | null;
  timezone: string | null;
  openrouter_api_key: string | null;
  gemini_api_key: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationWhatsApp, setNotificationWhatsApp] = useState(true);
  const [language, setLanguage] = useState('id');

  // API Keys
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, address, notification_preferences, preferred_language, timezone, openrouter_api_key, gemini_api_key')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setProfile(profile);
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setAddress(profile.address || '');
        setOpenrouterKey(profile.openrouter_api_key || '');
        setGeminiKey(profile.gemini_api_key || '');
        setLanguage(profile.preferred_language || 'id');
        if (profile.notification_preferences) {
          setNotificationEmail(profile.notification_preferences.email ?? true);
          setNotificationWhatsApp(profile.notification_preferences.whatsapp ?? true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving('profile');
    setMessage(null);

    try {
      const res = await fetch('/api/user/settings/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, address }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memperbarui profil' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }

    setSaving('password');
    setMessage(null);

    try {
      const res = await fetch('/api/user/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Password berhasil diubah' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal mengubah password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setSaving(null);
    }
  };

  const updatePreferences = async () => {
    setSaving('preferences');
    setMessage(null);

    try {
      const res = await fetch('/api/user/settings/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_preferences: { email: notificationEmail, whatsapp: notificationWhatsApp },
          language,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Preferensi berhasil diperbarui' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memperbarui preferensi' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setSaving(null);
    }
  };

  const updateApiKeys = async () => {
    setSaving('api-keys');
    setMessage(null);

    try {
      const res = await fetch('/api/user/settings/update-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouter_key: openrouterKey || null,
          gemini_key: geminiKey || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'API Keys berhasil diperbarui' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memperbarui API Keys' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <p>Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Pengaturan Akun</h2>
          <a href="/user/dashboard">Kembali ke Dashboard</a>
        </div>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            background: message.type === 'success' ? 'rgba(74, 107, 138, 0.1)' : 'rgba(139, 38, 53, 0.1)',
            color: message.type === 'success' ? 'var(--color-glass-blue)' : '#d4758a',
            fontWeight: 500,
            fontSize: '0.85rem',
          }}>
            {message.text}
          </div>
        )}

        <div className="settings-grid" style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Profile Section */}
          <div className="dashboard-card">
            <h3>Profil</h3>
            <p>Perbarui informasi profil Anda</p>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>No. WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                  disabled
                />
                <small style={{ color: 'var(--color-stone)', fontSize: '0.7rem' }}>No. WhatsApp tidak dapat diubah melalui pengaturan. Hubungi admin untuk perubahan.</small>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>Alamat</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>
              <button
                onClick={updateProfile}
                disabled={saving === 'profile'}
                className="btn-primary"
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.75rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--color-primary)', background: 'var(--color-gold)',
                  padding: '0.75rem 2rem', border: 'none', borderRadius: '2px 28px 2px 28px',
                  cursor: 'pointer', width: 'fit-content',
                }}
              >
                {saving === 'profile' ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div className="dashboard-card">
            <h3>Ubah Password</h3>
            <p>Perbarui password akun Anda secara berkala</p>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>Password Saat Ini</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                />
              </div>
              <button
                onClick={changePassword}
                disabled={saving === 'password'}
                className="btn-primary"
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.75rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--color-primary)', background: 'var(--color-gold)',
                  padding: '0.75rem 2rem', border: 'none', borderRadius: '2px 28px 2px 28px',
                  cursor: 'pointer', width: 'fit-content',
                }}
              >
                {saving === 'password' ? 'Menyimpan...' : 'Ubah Password'}
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="dashboard-card">
            <h3>Preferensi Notifikasi</h3>
            <p>Atur bagaimana Anda ingin menerima notifikasi</p>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.9rem' }}>Notifikasi Email</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationWhatsApp}
                  onChange={(e) => setNotificationWhatsApp(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.9rem' }}>Notifikasi WhatsApp</span>
              </label>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>Bahasa</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              <button
                onClick={updatePreferences}
                disabled={saving === 'preferences'}
                className="btn-primary"
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.75rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--color-primary)', background: 'var(--color-gold)',
                  padding: '0.75rem 2rem', border: 'none', borderRadius: '2px 28px 2px 28px',
                  cursor: 'pointer', width: 'fit-content',
                }}
              >
                {saving === 'preferences' ? 'Menyimpan...' : 'Simpan Preferensi'}
              </button>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="dashboard-card">
            <h3>API Keys (AI & Integrasi)</h3>
            <p>Konfigurasi API key untuk layanan AI dan integrasi eksternal. Data ini disimpan dengan aman.</p>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>OpenRouter API Key</label>
                <input
                  type="password"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
                <small style={{ color: 'var(--color-stone)', fontSize: '0.7rem' }}>Digunakan untuk akses model AI melalui OpenRouter.</small>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
                <small style={{ color: 'var(--color-stone)', fontSize: '0.7rem' }}>Digunakan untuk layanan AI Google Gemini.</small>
              </div>
              <button
                onClick={updateApiKeys}
                disabled={saving === 'api-keys'}
                className="btn-primary"
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.75rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--color-primary)', background: 'var(--color-gold)',
                  padding: '0.75rem 2rem', border: 'none', borderRadius: '2px 28px 2px 28px',
                  cursor: 'pointer', width: 'fit-content',
                }}
              >
                {saving === 'api-keys' ? 'Menyimpan...' : 'Simpan API Keys'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}