"use client"

import { useState } from "react"
import { Button } from "@paroki/ui/base/button"
import { Card, CardContent } from "@paroki/ui/base/card"
import { Badge } from "@paroki/ui/base/badge"
import { SearchIcon, PhoneIcon } from "lucide-react"

export default function CariKeluargaPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query) return
    setLoading(true)

    try {
      const response = await fetch(`/api/family/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setResults(data.data || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6">Cari & Sambung Keluarga</h1>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau no WhatsApp..."
              className="flex-1 px-4 py-2 border rounded-lg"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <SearchIcon className="mr-2 h-4 w-4" />
              Cari
            </Button>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <SearchIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
              <p>Masukkan nama atau nomor WhatsApp untuk mencari anggota keluarga</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.nama_lengkap}</p>
                    {item.nama_baptis && <p className="text-sm text-gray-500">{item.nama_baptis}</p>}
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <PhoneIcon className="h-3 w-3" /> {item.phone || "-"}
                    </p>
                  </div>
                  <Badge variant={item.status === "online" ? "success" : "warning"}>
                    {item.status === "online" ? "Online" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
