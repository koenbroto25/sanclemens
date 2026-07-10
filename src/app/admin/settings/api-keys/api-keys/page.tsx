'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Key, Plus, Trash2, RefreshCw, Activity, CheckCircle2, XCircle,
  Globe, Lock, AlertTriangle, BarChart3
} from 'lucide-react'

// Mock data for admin pool
const MOCK_KEYS = [
  { id: '1', provider: 'openrouter', key_name: 'Pool Key 1', assigned_to_bot: 'bot_public', usage_count: 1450, is_active: true, is_exhausted: false, last_used_at: '2026-06-18 10:30' },
  { id: '2', provider: 'openrouter', key_name: 'Pool Key 2', assigned_to_bot: 'bot_companion', usage_count: 890, is_active: true, is_exhausted: false, last_used_at: '2026-06-18 09:15' },
  { id: '3', provider: 'gemini', key_name: 'Gemini Key 1', assigned_to_bot: 'bot_companion', usage_count: 1230, is_active: true, is_exhausted: false, last_used_at: '2026-06-17 23:45' },
  { id: '4', provider: 'openrouter', key_name: 'Pool Key 3', assigned_to_bot: 'bot_public', usage_count: 3200, is_active: false, is_exhausted: true, last_used_at: '2026-06-16 14:20' },
]

const PROVIDER_CONFIGS = {
  openrouter: { label: 'OpenRouter (`openrouter/free`)', color: 'bg-blue-100 text-blue-800', badge: 'Unlimited Free' },
  gemini: { label: 'Google Gemini Flash 2.5', color: 'bg-purple-100 text-purple-800', badge: '1.500/day Free' },
  openai: { label: 'OpenAI', color: 'bg-green-100 text-green-800', badge: 'Paid' },
}

type KeyForm = {
  provider: string
  api_key: string
  key_name: string
  assigned_to_bot: string
  rotation_strategy: string
  priority_order: number
}

export default function AdminAPIKeysPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [keys, setKeys] = useState(MOCK_KEYS)
  const [form, setForm] = useState<KeyForm>({
    provider: 'openrouter',
    api_key: '',
    key_name: '',
    assigned_to_bot: 'bot_public',
    rotation_strategy: 'round_robin',
    priority_order: 0
  })
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredKeys = keys.filter(k => {
    if (filterProvider !== 'all' && k.provider !== filterProvider) return false
    if (filterStatus === 'active') return k.is_active && !k.is_exhausted
    if (filterStatus === 'exhausted') return k.is_exhausted
    if (filterStatus === 'inactive') return !k.is_active
    return true
  })

  const stats = {
    total: keys.length,
    active: keys.filter(k => k.is_active && !k.is_exhausted).length,
    exhausted: keys.filter(k => k.is_exhausted).length,
    totalUsage: keys.reduce((sum, k) => sum + k.usage_count, 0)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Key Pool</h1>
            <p className="text-muted-foreground mt-1">
              Kelola API key untuk OpenRouter & Gemini — gratis dan tanpa biaya
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Key
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Key</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Key className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktif</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Habis Kuota</p>
                  <p className="text-2xl font-bold text-red-600">{stats.exhausted}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Request</p>
                  <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats by Provider */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistik Per Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['openrouter', 'gemini'].map(provider => {
                  const providerKeys = keys.filter(k => k.provider === provider)
                  const config = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS]
                  return (
                    <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className={`h-5 w-5 ${provider === 'openrouter' ? 'text-blue-600' : 'text-purple-600'}`} />
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {providerKeys.filter(k => k.is_active && !k.is_exhausted).length} aktif &bull; 
                            {providerKeys.filter(k => k.is_exhausted).length} habis &bull;
                            {providerKeys.reduce((s, k) => s + k.usage_count, 0).toLocaleString()} total req
                          </p>
                        </div>
                      </div>
                      <Badge className={config.color}>{config.badge}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Rotation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Strategi Rotasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label>Strategi Pemilihan Key</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'round_robin', label: 'Round Robin', desc: 'Giliran rata' },
                    { value: 'least_used', label: 'Least Used', desc: 'Prioritas jarang dipakai' },
                    { value: 'random', label: 'Random', desc: 'Acak' },
                    { value: 'priority', label: 'Priority', desc: 'Prioritas tertinggi' },
                  ].map(strategy => (
                    <Button key={strategy.value} variant="outline" size="sm">
                      {strategy.label}
                      <span className="text-xs text-muted-foreground ml-1">{strategy.desc}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Saat ini: <strong>Round Robin</strong> — key dipilih secara bergiliran
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Key Form */}
        {showAddForm && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Tambah API Key Baru</CardTitle>
              <CardDescription>Masukkan API key dari OpenRouter atau Gemini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={form.provider}
                    onChange={e => setForm({...form, provider: e.target.value})}
                  >
                    <option value="openrouter">OpenRouter (`openrouter/free`)</option>
                    <option value="gemini">Google Gemini Flash 2.5</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input 
                    type="password" 
                    placeholder={form.provider === 'openrouter' ? 'sk-or-...' : 'AIzaSy...'}
                    value={form.api_key}
                    onChange={e => setForm({...form, api_key: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Key (opsional)</Label>
                  <Input 
                    placeholder="Pool Key 5"
                    value={form.key_name}
                    onChange={e => setForm({...form, key_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assign ke Bot</Label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={form.assigned_to_bot}
                    onChange={e => setForm({...form, assigned_to_bot: e.target.value})}
                  >
                    <option value="bot_public">Bot 1 — Info Publik</option>
                    <option value="bot_companion">Bot 3 — Companion Rohani</option>
                    <option value="">Semua Bot</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Prioritas</Label>
                  <Input 
                    type="number" 
                    min={0}
                    value={form.priority_order}
                    onChange={e => setForm({...form, priority_order: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button>Simpan Key</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar API Key</CardTitle>
              <div className="flex gap-2">
                <select 
                  className="px-3 py-1.5 border rounded-lg text-sm"
                  value={filterProvider}
                  onChange={e => setFilterProvider(e.target.value)}
                >
                  <option value="all">Semua Provider</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Gemini</option>
                </select>
                <select 
                  className="px-3 py-1.5 border rounded-lg text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="exhausted">Habis</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                      ${key.provider === 'openrouter' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <Key className={`h-5 w-5 ${key.provider === 'openrouter' ? 'text-blue-600' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{key.key_name}</p>
                        <Badge variant="secondary" className="text-xs">{key.provider}</Badge>
                        {key.is_exhausted && (
                          <Badge variant="destructive" className="text-xs">Habis</Badge>
                        )}
                        {!key.is_active && !key.is_exhausted && (
                          <Badge variant="outline" className="text-xs">Nonaktif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {key.assigned_to_bot ? `Bot: ${key.assigned_to_bot}` : 'Semua Bot'} 
                        &bull; {key.usage_count.toLocaleString()} request
                        &bull; Terakhir: {key.last_used_at}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Activity className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredKeys.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Tidak ada API key yang sesuai dengan filter
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Grafik Penggunaan (7 hari terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  Grafik penggunaan akan tersedia setelah sistem berjalan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Semua API key gratis — tidak ada biaya</p>
              <p className="text-sm text-blue-700 mt-1">
                OpenRouter (`openrouter/free`) otomatis memilih model gratis terbaik yang tersedia, memberikan unlimited requests (tergantung batasan rate model yang dipilih otomatis). 
                Google Gemini Flash 2.5 memiliki kuota 1.500 requests/hari. 
                Kombinasi keduanya cukup untuk paroki dengan 200+ pengguna aktif.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}