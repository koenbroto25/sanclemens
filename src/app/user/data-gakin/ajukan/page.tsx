"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@paroki/ui/base/button"
import { Card, CardContent } from "@paroki/ui/base/card"
import { Label } from "@paroki/ui/base/label"

export default function AjukanGakinPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nama_kk: "",
    alamat: "",
    penghasilan: "",
    tanggungan: "",
    kondisi_rumah: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch("/api/gakin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          penghasilan: Number(form.penghasilan),
          tanggungan: Number(form.tanggungan),
        }),
      })
      router.push("/data-gakin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6">Ajukan KK GAKIN Baru</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nama_kk">Nama Kepala Keluarga</Label>
              <input
                id="nama_kk"
                value={form.nama_kk}
                onChange={(e) => setForm({ ...form, nama_kk: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <Label htmlFor="alamat">Alamat</Label>
              <input
                id="alamat"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <Label htmlFor="penghasilan">Penghasilan per Bulan (Rp)</Label>
              <input
                id="penghasilan"
                type="number"
                value={form.penghasilan}
                onChange={(e) => setForm({ ...form, penghasilan: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <Label htmlFor="tanggungan">Jumlah Tanggungan</Label>
              <input
                id="tanggungan"
                type="number"
                value={form.tanggungan}
                onChange={(e) => setForm({ ...form, tanggungan: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <Label htmlFor="kondisi_rumah">Kondisi Rumah</Label>
              <textarea
                id="kondisi_rumah"
                value={form.kondisi_rumah}
                onChange={(e) => setForm({ ...form, kondisi_rumah: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={4}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Menyimpan..." : "Ajukan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
