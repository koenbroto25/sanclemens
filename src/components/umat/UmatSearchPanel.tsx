'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableUI as Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table-ui'
import { Search, User, Home, Building2, Briefcase, ChevronDown } from 'lucide-react'

// Mock data for demonstration
const MOCK_UMAT_DATA = [
  { id: '1', name: 'Yohanes Bambang Susilo', whatsapp: '+6281234567890', address: 'Jl. Sepinggan Baru No. 10', lingkungan: 'St. Monica', role: 'Umat Aktif', status: 'Aktif' },
  { id: '2', name: 'Maria Susilowati', whatsapp: '+6281298765432', address: 'Jl. Sepinggan Baru No. 10', lingkungan: 'St. Monica', role: 'Umat Aktif', status: 'Aktif' },
  { id: '3', name: 'Petrus Canisius', whatsapp: '+6281311223344', address: 'Jl. Gereja Lama No. 5', lingkungan: 'St. Paulus', role: 'Ketua Lingkungan', status: 'Aktif' },
  { id: '4', name: 'Anna Santoso', whatsapp: '+6281155667788', address: 'Perumahan Indah No. 2', lingkungan: 'St. Theresia', role: 'Umat Aktif', status: 'Pending Verifikasi' },
  { id: '5', name: 'Paulus Wijaya', whatsapp: '+6281900001111', address: 'Jl. Baru No. 15', lingkungan: 'St. Monica', role: 'Umat Aktif', status: 'Aktif' },
  { id: '6', name: 'Theresia Immanuel', whatsapp: '+6281512345678', address: 'Jl. Kenangan No. 8', lingkungan: 'St. Theresia', role: 'Umat Aktif', status: 'Aktif' },
];

interface UmatSearchPanelProps {
  roleScope: 'paroki-admin' | 'lingkungan-admin' | 'marketplace-admin';
  environmentSlug?: string; // Only required for 'lingkungan-admin'
}

export function UmatSearchPanel({ roleScope, environmentSlug }: UmatSearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLingkungan, setFilterLingkungan] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [results, setResults] = useState<typeof MOCK_UMAT_DATA>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableLingkungan = Array.from(new Set(MOCK_UMAT_DATA.map(u => u.lingkungan)))
  const availableRoles = Array.from(new Set(MOCK_UMAT_DATA.map(u => u.role)))
  const availableStatus = Array.from(new Set(MOCK_UMAT_DATA.map(u => u.status)))

  const performSearch = async () => {
    setIsLoading(true)
    setError(null)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    let filtered = MOCK_UMAT_DATA.filter(umat => {
      const matchesSearchTerm = searchTerm.toLowerCase() === '' ||
        umat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        umat.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        umat.whatsapp.includes(searchTerm) ||
        umat.lingkungan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        umat.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLingkungan = filterLingkungan === 'all' || umat.lingkungan === filterLingkungan;
      const matchesRole = filterRole === 'all' || umat.role === filterRole;
      const matchesStatus = filterStatus === 'all' || umat.status === filterStatus;

      let matchesRoleScope = true;
      if (roleScope === 'lingkungan-admin' && environmentSlug) {
        matchesRoleScope = umat.lingkungan === environmentSlug;
      }
      // Add more specific RLS logic here based on roleScope

      return matchesSearchTerm && matchesLingkungan && matchesRole && matchesStatus && matchesRoleScope;
    });

    setResults(filtered)
    setIsLoading(false)
  }

  useEffect(() => {
    performSearch()
  }, [searchTerm, filterLingkungan, filterRole, filterStatus, roleScope, environmentSlug]) // Re-run search on filter/scope change

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search-term">Cari (Nama, Alamat, WA, dll.)</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-term"
                placeholder="Cari umat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-lingkungan">Lingkungan</Label>
            <Select value={filterLingkungan} onValueChange={setFilterLingkungan}>
              <SelectTrigger id="filter-lingkungan">
                <SelectValue placeholder="Semua Lingkungan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lingkungan</SelectItem>
                {availableLingkungan.map(lingkungan => (
                  <SelectItem key={lingkungan} value={lingkungan}>{lingkungan}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-role">Role</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger id="filter-role">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {availableStatus.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={performSearch} disabled={isLoading}>
          {isLoading ? 'Mencari...' : 'Refresh Pencarian'}
        </Button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Hasil Pencarian ({results.length} Umat)</h3>
          {results.length > 0 ? (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Lingkungan</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(umat => (
                    <TableRow key={umat.id}>
                      <TableCell className="font-medium">{umat.name}</TableCell>
                      <TableCell>{umat.lingkungan}</TableCell>
                      <TableCell>{umat.role}</TableCell>
                      <TableCell><Badge variant={umat.status === 'Aktif' ? 'default' : 'secondary'}>{umat.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Detail</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Tidak ada umat yang ditemukan.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Extend Input component to support a 'prefix' prop for icons
// This is a common pattern with shadcn/ui where you might need to manually extend components
// For simplicity, I'm just creating a basic wrapper. In a real project, you might use 'forwardRef' and merge props.
const InputWithPrefix = ({ prefix, ...props }: React.ComponentPropsWithoutRef<typeof Input> & { prefix?: React.ReactNode }) => {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{prefix}</span>}
      <Input className={prefix ? 'pl-10' : ''} {...props} />
    </div>
  );
};