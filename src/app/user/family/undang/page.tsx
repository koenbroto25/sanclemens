"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@paroki/ui/base/button"
import { Card, CardContent } from "@paroki/ui/base/card"
import { Label } from "@paroki/ui/base/label"

export default function UndangKeluargaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nama_lengkap: "",
    nama_baptis: "",
    role: "anggota",
    phone: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      router.push("/keluarga")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6">Undang Anggota Keluarga</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
              <input
                id="nama_lengkap"
                value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <Label htmlFor="nama_baptis">Nama Baptis</Label>
              <input
                id="nama_baptis"
                value={form.nama_baptis}
                onChange={(e) => setForm({ ...form, nama_baptis: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="role">Role dalam Keluarga</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="kepala">Kepala Keluarga</option>
                <option value="istri">Istri</option>
                <option value="anak">Anak</option>
                <option value="anggota">Anggota</option>
              </select>
            </div>
            <div>
              <Label htmlFor="phone">No WhatsApp (opsional)</Label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Menyimpan..." : "Undang"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
