'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants/roles';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  access_layer: number;
  status: string;
  lingkungan_id: string | null;
}

interface UmatStaging {
  id: string;
  nama: string;
  no_kk: string;
  hubungan_keluarga: string;
  assigned_role: string | null;
  assigned_access_layer: number | null;
}

interface PreRegisteredRole {
  id: string;
  phone_number: string;
  full_name: string;
  role: string;
  access_layer: number;
  is_active: boolean;
  used_by: string | null;
  assigned_by: string;
}

type Tab = 'staging' | 'pre-registered';

export default function RoleManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('staging');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Staging users
  const [stagingUsers, setStagingUsers] = useState<UmatStaging[]>([]);
  const [stagingSearch, setStagingSearch] = useState('');

  // Pre-registered roles
  const [preRegistered, setPreRegistered] = useState<PreRegisteredRole[]>([]);
  const [showPreRegForm, setShowPreRegForm] = useState(false);
  const [preRegForm, setPreRegForm] = useState({
    phone_number: '',
    full_name: '',
    role: 'umat',
    access_layer: 1,
  });

  // Form for assigning role
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('umat');
  const [selectedAccessLayer, setSelectedAccessLayer] = useState(1);

  // Use canonical roles from constants
  const roleOptions = ROLES.map(role => ({
    value: role.value,
    label: role.label,
    layer: role.access_layer,
  }));

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login/admin');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.id)
      .single();

    if (!profile || profile.access_layer < 9) {
      router.push('/auth/unauthorized');
      return;
    }

    loadData();
  }

  async function loadData() {
    setLoading(true);

    // Load umat_staging with assigned roles
    const { data: stagingData } = await supabase
      .from('umat_staging')
      .select('*')
      .order('nama', { ascending: true });

    // Load pre_registered_roles
    const { data: preRegData } = await supabase
      .from('pre_registered_roles')
      .select('*')
      .order('created_at', { ascending: false });

    setStagingUsers(stagingData || []);
    setPreRegistered(preRegData || []);
    setLoading(false);
  }

  async function assignRoleToStaging(stagingId: string, role: string, accessLayer: number) {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('umat_staging')
        .update({
          assigned_role: role,
          assigned_access_layer: accessLayer,
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', stagingId);

      if (error) throw error;
      await loadData();
      alert('Role berhasil ditetapkan');
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Gagal menetapkan role');
    } finally {
      setSubmitting(false);
    }
  }

  async function createPreRegisteredRole(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const roleOption = roleOptions.find(r => r.value === preRegForm.role);

      const { error } = await supabase
        .from('pre_registered_roles')
        .insert({
          phone_number: preRegForm.phone_number,
          full_name: preRegForm.full_name,
          role: preRegForm.role,
          access_layer: roleOption?.layer || 1,
          assigned_by: user.id,
          is_active: true,
        });

      if (error) throw error;
      setShowPreRegForm(false);
      setPreRegForm({ phone_number: '', full_name: '', role: 'umat', access_layer: 1 });
      await loadData();
      alert('Pre-registered role berhasil dibuat');
    } catch (error) {
      console.error('Error creating pre-registered role:', error);
      alert('Gagal membuat pre-registered role');
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePreRegisteredRole(id: string) {
    if (!confirm('Hapus pre-registered role ini?')) return;

    try {
      const { error } = await supabase
        .from('pre_registered_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting pre-registered role:', error);
      alert('Gagal menghapus');
    }
  }

  const filteredStagingUsers = stagingUsers.filter(user =>
    user.nama.toLowerCase().includes(stagingSearch.toLowerCase()) ||
    user.no_kk.toLowerCase().includes(stagingSearch.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center">Memuat data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manajemen Role User</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('staging')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'staging' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
        >
          Umat Staging ({stagingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('pre-registered')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'pre-registered' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
        >
          Pre-Registered Roles ({preRegistered.filter(p => p.is_active).length})
        </button>
      </div>

      {/* Staging Users Tab */}
      {activeTab === 'staging' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Cari nama atau no KK..."
              value={stagingSearch}
              onChange={(e) => setStagingSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No KK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hubungan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStagingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.nama}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.no_kk}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.hubungan_keluarga}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.assigned_role ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {user.assigned_role || 'Belum ditetapkan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={selectedUserId === user.id ? selectedRole : user.assigned_role || 'umat'}
                        onChange={(e) => {
                          setSelectedUserId(user.id);
                          setSelectedRole(e.target.value);
                          const roleOpt = roleOptions.find(r => r.value === e.target.value);
                          if (roleOpt) setSelectedAccessLayer(roleOpt.layer);
                        }}
                        className="mr-2 px-2 py-1 border rounded"
                      >
                        {roleOptions.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => assignRoleToStaging(user.id, selectedRole, selectedAccessLayer)}
                        disabled={submitting}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        Simpan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pre-Registered Roles Tab */}
      {activeTab === 'pre-registered' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pre-Registered Roles</h2>
            <button
              onClick={() => setShowPreRegForm(!showPreRegForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Tambah Pre-Registered Role
            </button>
          </div>

          {showPreRegForm && (
            <form onSubmit={createPreRegisteredRole} className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nomor WhatsApp"
                  value={preRegForm.phone_number}
                  onChange={(e) => setPreRegForm({ ...preRegForm, phone_number: e.target.value })}
                  className="px-4 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={preRegForm.full_name}
                  onChange={(e) => setPreRegForm({ ...preRegForm, full_name: e.target.value })}
                  className="px-4 py-2 border rounded"
                  required
                />
                <select
                  value={preRegForm.role}
                  onChange={(e) => setPreRegForm({ ...preRegForm, role: e.target.value })}
                  className="px-4 py-2 border rounded"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button type="button" onClick={() => setShowPreRegForm(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                    Batal
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor WA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preRegistered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.phone_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.full_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {roleOptions.find(r => r.value === item.role)?.label || item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? (item.used_by ? 'Digunakan' : 'Aktif') : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.is_active && !item.used_by && (
                        <button
                          onClick={() => deletePreRegisteredRole(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}