'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PengaturanPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSettings();
  }, [supabase]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('user_ai_settings')
      .select('*')
      .single();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async (updates: any) => {
    setSaving(true);
    await supabase
      .from('user_ai_settings')
      .upsert({ ...updates, updated_at: new Date().toISOString() });
    await fetchSettings();
    setSaving(false);
    alert('Pengaturan berhasil disimpan');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ã¢Å¡â„¢Ã¯Â¸Â Pengaturan</h1>

      {/* AI Engineering Settings */}
      <div className="card mb-6">
        <h3 className="card-title mb-4">Ã°Å¸Â¤â€“ AI Engineering Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-semibold">AI Companion</p>
              <p className="text-sm text-gray-400">Aktifkan Bot 3 untuk pendampingan rohani</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.ai_companion_enabled || false}
              onChange={(e) => handleSave({ ai_companion_enabled: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-semibold">AI Matching</p>
              <p className="text-sm text-gray-400">Izinkan AI mencocokan kebutuhan Anda dengan umat lain</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.ai_matching_enabled || false}
              onChange={(e) => handleSave({ ai_matching_enabled: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Level Personalisasi AI</label>
            <select
              value={settings?.ai_personalization_level || 'moderate'}
              onChange={(e) => handleSave({ ai_personalization_level: e.target.value })}
              className="form-select"
            >
              <option value="minimal">Minimal - Hanya rekomendasi dasar</option>
              <option value="moderate">Moderate - Including preferences</option>
              <option value="full">Full - Including emotional state</option>
            </select>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card mb-6">
        <h3 className="card-title mb-4">Ã°Å¸â€â€˜ API Keys (Optional)</h3>
        <p className="text-sm text-gray-400 mb-4">
          Gunakan API key Anda sendiri untuk unlimited requests. Default: System shared key (rate limited).
        </p>

        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">OpenRouter API Key</label>
            <input
              type="password"
              placeholder="sk-or-..."
              className="form-input"
              onChange={(e) => handleSave({ openrouter_api_key: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Untuk akses model OpenRouter (free & paid)
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Gemini API Key</label>
            <input
              type="password"
              placeholder="AIza..."
              className="form-input"
              onChange={(e) => handleSave({ gemini_api_key: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Untuk akses Google Gemini 2.5 Flash
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-semibold">Gunakan API Key Saya</p>
              <p className="text-sm text-gray-400">Aktifkan penggunaan API key Anda sendiri</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.is_using_own_api || false}
              onChange={(e) => handleSave({ is_using_own_api: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="card mb-6">
        <h3 className="card-title mb-4">Ã°Å¸â€â€™ Privacy & Matching</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-semibold">Tampilkan Usaha Saya</p>
              <p className="text-sm text-gray-400">Izinkan umat lain melihat profil usaha Anda</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.show_business_to_others ?? true}
              onChange={(e) => handleSave({ show_business_to_others: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-semibold">Tampilkan Lokasi Exact</p>
              <p className="text-sm text-gray-400">Jika disabled, hanya kota yang ditampilkan</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.show_location_for_matching || false}
              onChange={(e) => handleSave({ show_location_for_matching: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-semibold">Izinkan Charity Matching</p>
              <p className="text-sm text-gray-400">Bisa dicari volunteer untuk bantuan</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.allow_charity_matching ?? true}
              onChange={(e) => handleSave({ allow_charity_matching: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => window.location.reload()}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Menyimpan...' : 'Ã°Å¸â€™Â¾ Simpan Semua Pengaturan'}
        </button>
      </div>
    </div>
  );
}