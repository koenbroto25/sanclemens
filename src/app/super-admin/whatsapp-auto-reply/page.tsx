'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Use client-side Supabase
import { PlusIcon, EditIcon, TrashIcon, CheckCircle2Icon, AlertCircleIcon, Loader2Icon } from 'lucide-react';

interface AutoReplyRule {
  id?: string;
  keyword: string;
  response_message: string;
  response_type: string;
  file_url?: string;
  file_filename?: string;
  button_options?: any;
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export default function WhatsappAutoReplyPage() {
  const supabase = createClient();
  const router = useRouter();
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<AutoReplyRule | null>(null);
  const [formState, setFormState] = useState<AutoReplyRule>({
    keyword: '',
    response_message: '',
    response_type: 'text',
    priority: 0,
    is_active: true,
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const res = await fetch('/api/admin/whatsapp/auto-reply', {
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat aturan auto-reply');
      }
      setRules(json.autoReplies);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setCurrentRule(null);
    setFormState({
      keyword: '',
      response_message: '',
      response_type: 'text',
      priority: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setCurrentRule(rule);
    setFormState({ ...rule });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalLoading(false);
    setError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    setError(null);

    const method = currentRule?.id ? 'PUT' : 'POST';
    const payload = currentRule?.id ? { ...formState, id: currentRule.id } : formState;

    try {
      const res = await fetch('/api/admin/whatsapp/auto-reply', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Gagal ${currentRule?.id ? 'memperbarui' : 'membuat'} aturan.`);
      }
      fetchRules();
      closeModal();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus aturan ini?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/auto-reply', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus aturan.');
      }
      fetchRules();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-600" />
        <p className="mt-4 text-gray-500">Memuat aturan auto-reply...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Manajemen Auto-Reply WhatsApp</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <button
        onClick={openCreateModal}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center mb-6"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Tambah Aturan Baru
      </button>

      {rules.length === 0 ? (
        <p className="text-gray-600">Belum ada aturan auto-reply. Silakan tambahkan satu.</p>
      ) : (
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keyword
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Message
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.keyword}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" style={{ maxWidth: '200px' }}>{rule.response_message}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.response_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.priority}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.is_active ? <CheckCircle2Icon className="h-5 w-5 text-green-500" /> : <AlertCircleIcon className="h-5 w-5 text-red-500" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(rule)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(rule.id!)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{currentRule?.id ? 'Edit Aturan' : 'Tambah Aturan Baru'}</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">Keyword</label>
                <input type="text" name="keyword" id="keyword" value={formState.keyword} onChange={handleFormChange} required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="response_message" className="block text-sm font-medium text-gray-700">Response Message</label>
                <textarea name="response_message" id="response_message" value={formState.response_message} onChange={handleFormChange} required rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
              </div>
              <div>
                <label htmlFor="response_type" className="block text-sm font-medium text-gray-700">Response Type</label>
                <select name="response_type" id="response_type" value={formState.response_type} onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="file">File</option>
                </select>
              </div>
              {formState.response_type !== 'text' && (
                <div>
                  <label htmlFor="file_url" className="block text-sm font-medium text-gray-700">File URL</label>
                  <input type="url" name="file_url" id="file_url" value={formState.file_url || ''} onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              )}
              {formState.response_type === 'file' && (
                <div>
                  <label htmlFor="file_filename" className="block text-sm font-medium text-gray-700">File Name (for download)</label>
                  <input type="text" name="file_filename" id="file_filename" value={formState.file_filename || ''} onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              )}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <input type="number" name="priority" id="priority" value={formState.priority} onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="is_active" id="is_active" checked={formState.is_active} onChange={handleFormChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Is Active</label>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                  {modalLoading ? <Loader2Icon className="h-5 w-5 animate-spin mr-2" /> : null}
                  {currentRule?.id ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}