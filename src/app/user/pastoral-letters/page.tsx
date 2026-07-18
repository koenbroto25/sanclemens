'use client'
// Halaman Surat Pastoral - Inbox Umat (Portal 1)
// Desain: Portal 1 palette (--primary: #1e3a5f, --accent: #c9a227)
// Typography: Cormorant Garamond (heading), Inter (body)
import { useState, useEffect, useCallback } from "react"
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ChevronRight, Eye, AlertTriangle } from "lucide-react"
import { decryptData, base64ToBuffer } from '@/lib/crypto-e2e';

interface Letter {
    id: string
    subject: string
    status: string
    sent_at: string
    read_at: string | null
    sender_id: string
    encrypted_content?: string
    content_iv?: string
}

export default function SuratPastoralPage() {
    const [letters, setLetters] = useState<Letter[]>([])
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [decrypting, setDecrypting] = useState(false)
    const [decryptError, setDecryptError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchLetters()
    }, [])

    async function fetchLetters() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from("surat_pastoral")
            .select("id, subject, status, sent_at, read_at, sender_id")
            .eq("recipient_id", user.id)
            .order("sent_at", { ascending: false })

        setLetters(data || [])
        setLoading(false)
    }

    const openLetter = useCallback(async (letter: Letter) => {
        setSelectedLetter(letter)
        setDecryptedContent(null)
        setDecryptError(null)
        setDecrypting(true)

        try {
            const { data: fullLetter } = await supabase
                .from("surat_pastoral")
                .select("encrypted_content, content_iv")
                .eq("id", letter.id)
                .single()

            if (fullLetter?.encrypted_content && fullLetter?.content_iv) {
                const ciphertext = base64ToBuffer(fullLetter.encrypted_content)
                const iv = base64ToBuffer(fullLetter.content_iv)
                const decrypted = await decryptData(ciphertext, iv)
                setDecryptedContent(decrypted)

                // Mark as read if not already
                if (!letter.read_at) {
                    await supabase
                        .from("surat_pastoral")
                        .update({ read_at: new Date().toISOString() })
                        .eq("id", letter.id)

                    setLetters(prev => prev.map(l =>
                        l.id === letter.id ? { ...l, read_at: new Date().toISOString() } : l
                    ))
                }
            } else {
                setDecryptedContent("[Isi surat belum dienkripsi - hubungi admin]")
            }
        } catch (error) {
            console.error('Error decrypting letter:', error)
            setDecryptError('Gagal mendekripsi surat.')
        } finally {
            setDecrypting(false)
        }
    }, [supabase])

    return (
        <div className="min-h-screen bg-[#f8f5f0]">
            {/* Header Portal 1 - Sakral */}
            <header className="bg-[#1e3a5f] text-white px-6 py-4 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <p className="text-sm text-[#c9a227] font-medium mb-1">
                        Portal 1 - Paroki
                    </p>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                        Surat Pastoral
                    </h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* E2E Encryption Badge */}
                <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <Lock className="w-5 h-5 text-green-700" />
                    <span className="text-sm text-green-800 font-medium">
                        Enkripsi E2E Aktif - Isi surat hanya bisa dibaca oleh Anda & Pastor
                    </span>
                </div>

                {/* Letter List */}
                <div className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#e8e0d5] bg-[#fdf6e3]">
                        <h2 className="text-lg font-semibold text-[#2a1a0e]" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                            Surat Masuk
                        </h2>
                    </div>

                    {loading ? (
                        <div className="px-6 py-12 text-center text-[#6b5e50]">Memuat surat...</div>
                    ) : letters.length === 0 ? (
                        <div className="px-6 py-12 text-center text-[#6b5e50]">
                            <Mail className="w-12 h-12 mx-auto mb-3 text-[#c9a227]" />
                            <p className="font-medium">Belum ada surat pastoral</p>
                            <p className="text-sm mt-1">Pastor akan mengirimkan surat penting melalui sistem ini.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#e8e0d5]">
                            {letters.map((letter) => (
                                <div
                                    key={letter.id}
                                    className="px-6 py-4 hover:bg-[#fdf6e3] cursor-pointer transition-colors flex items-center gap-4"
                                    onClick={() => openLetter(letter)}
                                >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${letter.read_at ? "bg-gray-300" : "bg-[#c9a227]"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[#2a1a0e] truncate">{letter.subject}</p>
                                        <p className="text-sm text-[#6b5e50]">
                                            Dari: Pastor Paroki &middot; {new Date(letter.sent_at).toLocaleDateString("id-ID")}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${letter.read_at ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                                        {letter.read_at ? "Dibaca" : "Baru"}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-[#6b5e50]" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Letter Detail Modal */}
                {selectedLetter && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
                            <div className="px-6 py-4 border-b border-[#e8e0d5] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-green-600" />
                                    <h3 className="font-semibold text-[#2a1a0e]">{selectedLetter.subject}</h3>
                                </div>
                                <button onClick={() => setSelectedLetter(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                            </div>
                            <div className="px-6 py-4">
                                <p className="text-sm text-[#6b5e50] mb-4">
                                    Dari: Pastor Paroki &middot; {new Date(selectedLetter.sent_at).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </p>

                                {/* Decrypted Content or Loading/Error */}
                                {decrypting ? (
                                    <div className="bg-[#fdf6e3] rounded-lg p-6 text-center text-[#6b5e50]">
                                        <p>Mendekripsi surat...</p>
                                    </div>
                                ) : decryptError ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                            <p className="font-medium text-red-700">Gagal Mendekripsi</p>
                                        </div>
                                        <p className="text-sm text-red-600">{decryptError}</p>
                                    </div>
                                ) : decryptedContent ? (
                                    <div className="bg-[#fdf6e3] rounded-lg p-6 text-[#2a1a0e] leading-relaxed whitespace-pre-wrap">
                                        {decryptedContent}
                                    </div>
                                ) : (
                                    <div className="bg-[#fdf6e3] rounded-lg p-6 text-center text-[#6b5e50] italic">
                                        [Isi surat akan ditampilkan di sini - dienkripsi dengan AES-256-GCM]
                                    </div>
                                )}

                                <div className="mt-4 flex items-center gap-2 text-xs text-green-700">
                                    <Eye className="w-4 h-4" />
                                    <span>Konten ini dienkripsi end-to-end. Hanya Anda yang bisa membacanya.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}