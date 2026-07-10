'use client';
import { useState, useEffect } from 'react';

interface DocumentType {
  document_type_code: string;
  document_name: string;
  default_prefix: string;
  numbering_pattern: any;
  required_roles_to_generate: string[];
  is_user_claimable: boolean;
  is_pidu_linked: boolean;
  visibility_roles: string[];
  is_active: boolean;
}

export default function SuperAdminSettingsPage() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    document_type_code: '',
    document_name: '',
    default_prefix: '',
    numbering_pattern: '{"include_pidu":true,"year":true,"counter":true,"env_code":false,"separator":"-"}',
    required_roles_to_generate: 'super_admin',
    is_user_claimable: false,
    is_pidu_linked: true,
    visibility_roles: 'umat',
    is_active: true,
  });

  async function loadDocTypes() {
    setLoading(true);
    try {
      const res = await fetch('/api/documents/types');
      const data = await res.json();
      if (data.success) setDocTypes(data.data || []);
    } catch (e) {
      console.error('Failed to load document types', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDocTypes(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const method = editingCode ? 'PUT' : 'POST';
    const url = editingCode ? `/api/documents/types/${editingCode}` : '/api/documents/types';
    const body = editingCode
      ? { ...form, document_type_code: editingCode }
      : form;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        alert(editingCode ? 'Document type updated' : 'Document type created');
        setShowForm(false);
        setEditingCode(null);
        setForm({
          document_type_code: '',
          document_name: '',
          default_prefix: '',
          numbering_pattern: '{"include_pidu":true,"year":true,"counter":true,"env_code":false,"separator":"-"}',
          required_roles_to_generate: 'super_admin',
          is_user_claimable: false,
          is_pidu_linked: true,
          visibility_roles: 'umat',
          is_active: true,
        });
        loadDocTypes();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (e) {
      alert('Error saving document type');
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`Hapus document type ${code}?`)) return;
    try {
      const res = await fetch(`/api/documents/types/${code}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadDocTypes();
      else alert(data.error || 'Failed to delete');
    } catch (e) {
      alert('Error deleting document type');
    }
  }

  function startEdit(row: DocumentType) {
    setEditingCode(row.document_type_code);
    setForm({
      document_type_code: row.document_type_code,
      document_name: row.document_name,
      default_prefix: row.default_prefix,
      numbering_pattern: JSON.stringify(row.numbering_pattern || {}),
      required_roles_to_generate: Array.isArray(row.required_roles_to_generate) ? row.required_roles_to_generate.join(',') : String(row.required_roles_to_generate || 'super_admin'),
      is_user_claimable: row.is_user_claimable,
      is_pidu_linked: row.is_pidu_linked,
      visibility_roles: Array.isArray(row.visibility_roles) ? row.visibility_roles.join(',') : String(row.visibility_roles || 'umat'),
      is_active: row.is_active,
    });
    setShowForm(true);
  }

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h2>Pengaturan Sistem Umum</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-admin-primary" onClick={() => { setShowForm(true); setEditingCode(null); }}>
              + Tambah Jenis Dokumen
            </button>
            <a href="/super-admin/dashboard" className="btn-admin-secondary">Kembali</a>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-card">
            <h3>Manajemen API Keys</h3>
            <p>Kelola API keys untuk integrasi dengan layanan eksternal dan bot.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Kelola Keys
            </button>
          </div>
          <div className="admin-card">
            <h3>Konfigurasi AI & Bot</h3>
            <p>Atur prompt global, perbarui "Bot Law", dan kelola kerangka kerja sumber teologis.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Konfigurasi
            </button>
          </div>
        </div>

        <div className="admin-section" style={{ marginTop: 32 }}>
          <div className="section-header"><h3>Debug Tools</h3></div>
          <div className="admin-grid">
            <div className="admin-card">
              <h3>Super Admin Bypass</h3>
              <p>Aktifkan mode bypass untuk debugging (hanya untuk development).</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                <span id="bypass-status" className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">Inactive</span>
                <button
                  id="btn-enable-bypass"
                  className="btn-admin-primary"
                  style={{ background: '#dc2626' }}
                >
                  Enable Bypass
                </button>
                <button
                  id="btn-disable-bypass"
                  className="btn-admin-secondary"
                  style={{ display: 'none' }}
                >
                  Disable Bypass
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-stone)', marginTop: 8 }}>
                ⚠️ Bypass hanya aktif di development mode. Semua aksi akan dicatat.
              </p>
            </div>
            <div className="admin-card">
              <h3>Impersonate User</h3>
              <p>Login sebagai user lain untuk testing (dengan logging).</p>
              <input
                type="text"
                id="impersonate-user-id"
                placeholder="Masukkan User ID"
                className="px-4 py-2 border rounded"
                style={{ width: '100%', marginTop: 8, marginBottom: 8 }}
              />
              <button
                id="btn-impersonate"
                className="btn-admin-primary"
                style={{ background: '#7c3aed' }}
              >
                Impersonate
              </button>
            </div>
          </div>
        </div>

        <div className="admin-section" style={{ marginTop: 32 }}>
          <div className="section-header"><h3>Registry Jenis Dokumen Digital</h3></div>
          {loading ? (
            <p>Memuat data...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Kode</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Nama</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Prefix</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Roles</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Aktif</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {docTypes.map((row) => (
                  <tr key={row.document_type_code}>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{row.document_type_code}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{row.document_name}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{row.default_prefix}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{Array.isArray(row.required_roles_to_generate) ? row.required_roles_to_generate.join(', ') : String(row.required_roles_to_generate)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{row.is_active ? 'Ya' : 'Tidak'}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      <button className="btn-admin-secondary" onClick={() => startEdit(row)}>Edit</button>
                      <button className="btn-admin-danger" onClick={() => handleDelete(row.document_type_code)}>Hapus</button>
                    </td>
                  </tr>
                ))}
                {docTypes.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 12 }}>Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Debug Tools JavaScript */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const btnEnable = document.getElementById('btn-enable-bypass');
            const btnDisable = document.getElementById('btn-disable-bypass');
            const bypassStatus = document.getElementById('bypass-status');
            const btnImpersonate = document.getElementById('btn-impersonate');
            const impersonateUserId = document.getElementById('impersonate-user-id');

            async function checkBypassStatus() {
              try {
                const res = await fetch('/api/super-admin/bypass');
                const data = await res.json();
                if (data.bypassEnabled) {
                  updateBypassUI(true);
                }
              } catch (error) {
                console.error('Error checking bypass status:', error);
              }
            }

            function updateBypassUI(enabled) {
              if (enabled) {
                bypassStatus.textContent = 'Active';
                bypassStatus.className = 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800';
                btnEnable.style.display = 'none';
                btnDisable.style.display = 'inline-block';
              } else {
                bypassStatus.textContent = 'Inactive';
                bypassStatus.className = 'px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600';
                btnEnable.style.display = 'inline-block';
                btnDisable.style.display = 'none';
              }
            }

            if (btnEnable) {
              btnEnable.addEventListener('click', async () => {
                try {
                  const res = await fetch('/api/super-admin/bypass', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'enable_bypass' })
                  });
                  const data = await res.json();
                  if (data.success) {
                    updateBypassUI(true);
                    alert('Bypass mode enabled');
                  }
                } catch (error) {
                  alert('Failed to enable bypass');
                }
              });
            }

            if (btnDisable) {
              btnDisable.addEventListener('click', async () => {
                try {
                  const res = await fetch('/api/super-admin/bypass', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'disable_bypass' })
                  });
                  const data = await res.json();
                  if (data.success) {
                    updateBypassUI(false);
                    alert('Bypass mode disabled');
                  }
                } catch (error) {
                  alert('Failed to disable bypass');
                }
              });
            }

            if (btnImpersonate && impersonateUserId) {
              btnImpersonate.addEventListener('click', async () => {
                const userId = impersonateUserId.value.trim();
                if (!userId) {
                  alert('Please enter a User ID');
                  return;
                }
                try {
                  const res = await fetch('/api/super-admin/bypass', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'impersonate', target_user_id: userId })
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert('Impersonation mode enabled. Redirecting...');
                    window.location.href = '/';
                  }
                } catch (error) {
                  alert('Failed to impersonate user');
                }
              });
            }

            // Check bypass status on page load
            checkBypassStatus();
          })();
        `}} />

        {showForm && (
          <div className="admin-section" style={{ marginTop: 24 }}>
            <div className="section-header"><h3>{editingCode ? 'Edit' : 'Tambah'} Jenis Dokumen</h3></div>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
              <input required placeholder="Kode (misal BAPTIS)" value={form.document_type_code} onChange={(e) => setForm({ ...form, document_type_code: e.target.value })} disabled={!!editingCode} />
              <input required placeholder="Nama Dokumen" value={form.document_name} onChange={(e) => setForm({ ...form, document_name: e.target.value })} />
              <input required placeholder="Prefix (misal BAPTIS-)" value={form.default_prefix} onChange={(e) => setForm({ ...form, default_prefix: e.target.value })} />
              <textarea placeholder="Numbering pattern JSON" value={form.numbering_pattern} onChange={(e) => setForm({ ...form, numbering_pattern: e.target.value })} rows={3} />
              <input placeholder="Required roles (comma separated)" value={form.required_roles_to_generate} onChange={(e) => setForm({ ...form, required_roles_to_generate: e.target.value })} />
              <input placeholder="Visibility roles (comma separated)" value={form.visibility_roles} onChange={(e) => setForm({ ...form, visibility_roles: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.is_user_claimable} onChange={(e) => setForm({ ...form, is_user_claimable: e.target.checked })} />
                User Claimable
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.is_pidu_linked} onChange={(e) => setForm({ ...form, is_pidu_linked: e.target.checked })} />
                PIDU Linked
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn-admin-primary">Simpan</button>
                <button type="button" className="btn-admin-secondary" onClick={() => { setShowForm(false); setEditingCode(null); }}>Batal</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
