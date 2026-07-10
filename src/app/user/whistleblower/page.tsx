'use client'
// Halaman Whistle-Blower ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Laporan Pelanggaran Anonim
// Desain: Portal 1 palette (--primary: #1e3a5f, --accent: #c9a227)
import { useState } from "react"
import { createClient } from '@/lib/supabase/client';
import { Shield, Lock, FileText, Send } from "lucide-react"

const KATEGORI_OPTIONS = [
    { value: "keuangan", label: "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â° Keuangan (penyimpangan dana)" },
    { value: "penyalahgunaan", label: "ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Penyalahgunaan wewenang" },
    { value: "pelanggaran_kode_etik", label: "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ Pelanggaran kode etik" },
    { value: "lainnya", label: "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â Lainnya" },
]

export default function WhistleblowerPage() {
    const [kategori, setKategori] = useState("")
    const [content, setContent] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!kategori || !content || content.length < 20) {
            setError("Kategori harus dipilih dan isi minimal 20 karakter.")
            return
        }

        setSubmitting(true)
        setError("")

        const res = await fetch("/api/whistleblower/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                kategori: kategori,
                content: content
            })
        })

        const result = await res.json()
        if (result.success) {
            setSubmitted(true)
        } else {
            setError(result.error || "Gagal mengirim laporan.")
        }
        setSubmitting(false)
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#f8f5f0]">
                <header className="bg-[#1e3a5f] text-white px-6 py-4 shadow-md">
                    <div className="max-w-2xl mx-auto">
                        <p className="text-sm text-[#c9a227] font-medium mb-1">Portal 1 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Paroki</p>
                        <h1 className="text-2xl font-bold" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                            ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Whistle-Blower
                        </h1>
                    </div>
                </header>
                <main className="max-w-2xl mx-auto px-6 py-12 text-center">
                    <div className="bg-white rounded-xl border border-[#e8e0d5] p-8 shadow-sm">
                        <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-[#2a1a0e] mb-3" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                            Laporan Berhasil Dikirim
                        </h2>
                        <p className="text-[#6b5e50] mb-6">
                            Laporan Anda telah diterima secara anonim dan akan dikirim langsung ke Pastor Paroki.
                            Terima kasih atas kepedulian Anda.
                        </p>
                        <p className="text-sm text-[#6b5e50]">
                            Tuhan memberkati keberanian Anda.
                        </p>
                        <button
                            onClick={() => { setSubmitted(false); setKategori(""); setContent(""); }}
                            className="mt-6 px-6 py-2 bg-[#c9a227] text-white rounded-lg hover:bg-[#b8921f] transition-colors"
                        >
                            Kirim Laporan Lain
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8f5f0]">
            {/* Header Portal 1 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Sakral */}
            <header className="bg-[#1e3a5f] text-white px-6 py-4 shadow-md">
                <div className="max-w-2xl mx-auto">
                    <p className="text-sm text-[#c9a227] font-medium mb-1">Portal 1 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Paroki</p>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                        ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Whistle-Blower
                    </h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Anonim Badge */}
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-700 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                        <p className="font-medium">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂºÃƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â LAPORAN INI DIJAMIN ANONIM</p>
                        <p>Identitas Anda TIDAK akan dicatat. IP, device info, dan user agent tidak disimpan.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#e8e0d5] shadow-sm overflow-hidden">
                    {/* Kategori */}
                    <div className="px-6 py-4 border-b border-[#e8e0d5]">
                        <label className="block text-sm font-medium text-[#2a1a0e] mb-3">Kategori Laporan</label>
                        <div className="space-y-2">
                            {KATEGORI_OPTIONS.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[#fdf6e3]">
                                    <input
                                        type="radio"
                                        name="kategori"
                                        value={opt.value}
                                        checked={kategori === opt.value}
                                        onChange={(e) => setKategori(e.target.value)}
                                        className="w-4 h-4 text-[#c9a227]"
                                    />
                                    <span className="text-sm text-[#2a1a0e]">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Isi Laporan */}
                    <div className="px-6 py-4">
                        <label className="block text-sm font-medium text-[#2a1a0e] mb-2">Isi Laporan</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full border border-[#e8e0d5] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227] min-h-[150px]"
                            placeholder="Jelaskan secara rinci laporan Anda..."
                            required
                        />
                        <p className="text-xs text-[#6b5e50] mt-1">{content.length} karakter (minimal 20)</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-6 py-2">
                            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â {error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="px-6 py-4 border-t border-[#e8e0d5] bg-[#fdf6e3]">
                        <label className="flex items-start gap-3 mb-4 cursor-pointer">
                            <input type="checkbox" className="mt-1" required />
                            <span className="text-sm text-[#6b5e50]">
                                Saya mengerti: Laporan ini bersifat anonim dan tidak bisa ditarik kembali setelah dikirim
                            </span>
                        </label>
                        <button
                            type="submit"
                            disabled={submitting || !kategori || content.length < 20}
                            className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Lock className="w-4 h-4" />
                            {submitting ? "Mengirim..." : "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Kirim Laporan Anonim"}
                        </button>
                    </div>
                </form>

                {/* Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-blue-800">
                        ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¡ Laporan akan dikirim langsung ke Pastor Paroki tanpa melewati pengurus lain.
                        Anda bisa melacak status laporan menggunakan kode anonim yang akan diberikan.
                    </p>
                </div>
            </main>
        </div>
    )
}