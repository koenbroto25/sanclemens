"use client"

import { useEffect, useState } from "react"
import { Button } from "@paroki/ui/base/button"
import { Card, CardContent } from "@paroki/ui/base/card"
import { Badge } from "@paroki/ui/base/badge"
import { UsersIcon, UserPlusIcon, SearchIcon, PhoneIcon, PrinterIcon } from "lucide-react"
import Link from "next/link"

interface FamilyMember {
  id: string
  nama_lengkap: string
  nama_baptis: string
  role: string
  phone: string
  status: "online" | "offline" | "pending"
  created_at: string
}

export default function KeluargaPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/family")
      .then(res => res.json())
      .then(result => {
        setMembers(result.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kartu Keluarga Digital</h1>
          <p className="text-gray-600">Kelola koneksi keluarga dalam satu paroki</p>
        </div>
        <div className="flex gap-2">
          <Link href="/keluarga/undang">
            <Button>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Undang Keluarga
            </Button>
          </Link>
          <Button variant="outline">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Cetak Kartu
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-6">Memuat data keluarga...</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <CardContent>
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Anggota</p>
                    <p className="text-2xl font-bold">{members.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Terhubung</p>
                    <p className="text-2xl font-bold">{members.filter(m => m.status === "online").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Daftar Anggota Keluarga</h2>
                <Link href="/keluarga/cari">
                  <Button variant="outline">
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Cari & Sambung
                  </Button>
                </Link>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada anggota keluarga yang terhubung</p>
                  <Link href="/keluarga/undang">
                    <Button className="mt-4">Undang Anggota Pertama</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nama</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">No WhatsApp</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium">{member.nama_lengkap}</p>
                            {member.nama_baptis && <p className="text-xs text-gray-500">{member.nama_baptis}</p>}
                          </td>
                          <td className="py-3 px-4">{member.role}</td>
                          <td className="py-3 px-4">{member.phone || "-"}</td>
                          <td className="py-3 px-4">
                            <Badge variant={member.status === "online" ? "success" : member.status === "offline" ? "warning" : "info"}>
                              {member.status === "online" ? "Online" : member.status === "offline" ? "Offline" : "Pending"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
