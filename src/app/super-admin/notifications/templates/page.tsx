'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase'; // Adjust path if necessary
import { useRouter } from 'next/navigation';

interface NotificationTemplate {
  id: string;
  template_key: string;
  judul_template: string;
  pesan_template: string;
  tipe: 'info' | 'warning' | 'critical' | 'pastoral_sos';
  target_layer?: number;
  created_at: string;
}

export default function NotificationTemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState({
    template_key: '',
    judul_template: '',
    pesan_template: '',
    tipe: 'info' as 'info' | 'warning' | 'critical' | 'pastoral_sos',
    target_layer: undefined as number | undefined,
  });
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login/admin'); // Redirect if not logged in
      return;
    }

    // Check if user is Super Admin (access_layer 9)
    const { data: profile } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.id)
      .single();

    if (!profile || profile.access_layer !== 9) {
      router.push('/auth/unauthorized'); // Redirect if not Super Admin
      return;
    }

    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      setError('Gagal memuat template notifikasi.');
      setTemplates([]);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'target_layer' && value !== '' ? parseInt(value, 10) : value,
    }));
  };

  const handleSaveTemplate = async () => {
    setError(null);
    setLoading(true);

    if (!form.template_key || !form.judul_template || !form.pesan_template || !form.tipe) {
      setError('Semua kolom wajib diisi (kecuali Target Layer).');
      setLoading(false);
      return;
    }

    const payload = {
      template_key: form.template_key,
      judul_template: form.judul_template,
      pesan_template: form.pesan_template,
      tipe: form.tipe,
      target_layer: form.target_layer || null,
    };

    let error;
    if (currentTemplate) {
      // Update existing template
      const { error: updateError } = await supabase
        .from('notification_templates')
        .update(payload)
        .eq('id', currentTemplate.id);
      error = updateError;
    } else {
      // Add new template
      const { error: insertError } = await supabase
        .from('notification_templates')
        .insert(payload);
      error = insertError;
    }

    if (error) {
      console.error('Save template error:', error);
      setError('Gagal menyimpan template: ' + error.message);
    } else {
      setShowModal(false);
      resetForm();
      fetchTemplates();
    }
    setLoading(false);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setCurrentTemplate(template);
    setForm({
      template_key: template.template_key,
      judul_template: template.judul_template,
      pesan_template: template.pesan_template,
      tipe: template.tipe,
      target_layer: template.target_layer || undefined,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Anda yakin ingin menghapus template ini?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete template error:', error);
      setError('Gagal menghapus template: ' + error.message);
    } else {
      fetchTemplates();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setCurrentTemplate(null);
    setForm({
      template_key: '',
      judul_template: '',
      pesan_template: '',
      tipe: 'info',
      target_layer: undefined,
    });
    setError(null);
  };

  if (loading && templates.length === 0) {
    return <div className="p-8 text-center">Memuat template notifikasi...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Kelola Template Notifikasi</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <button
        onClick={() => { resetForm(); setShowModal(true); }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        Tambah Template Baru
      </button>

      {templates.length === 0 ? (
        <p className="text-gray-600">Belum ada template notifikasi yang terdaftar.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunci Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Layer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.template_key}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.judul_template}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.tipe}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.target_layer ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{currentTemplate ? 'Edit Template Notifikasi' : 'Tambah Template Notifikasi Baru'}</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="template_key">
                Kunci Template (unik)
              </label>
              <input
                type="text"
                name="template_key"
                id="template_key"
                value={form.template_key}
                onChange={handleFormChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={!!currentTemplate} // Disable key editing for existing templates
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="judul_template">
                Judul Template
              </label>
              <input
                type="text"
                name="judul_template"
                id="judul_template"
                value={form.judul_template}
                onChange={handleFormChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pesan_template">
                Isi Pesan Template (gunakan {'{{placeholder}}'} untuk data dinamis)
              </label>
              <textarea
                name="pesan_template"
                id="pesan_template"
                value={form.pesan_template}
                onChange={handleFormChange}
                rows={6}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipe">
                Tipe Notifikasi
              </label>
              <select
                name="tipe"
                id="tipe"
                value={form.tipe}
                onChange={handleFormChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="pastoral_sos">Pastoral SOS</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="target_layer">
                Target Layer (opsional, misal: 4 untuk Ketua Lingkungan, 9 untuk Pastor)
              </label>
              <input
                type="number"
                name="target_layer"
                id="target_layer"
                value={form.target_layer ?? ''}
                onChange={handleFormChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min="0"
                max="9"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTemplate}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}