'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface QAPair {
  id: string;
  question_variations: string[];
  answer_text: string;
  domain: string;
  bot_access: string[];
  source_reference?: string;
  status: string;
  created_at: string;
}

export default function QAApprovalPage() {
  const [qaPairs, setQAPairs] = useState<QAPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQA, setSelectedQA] = useState<QAPair | null>(null);
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState('');

  useEffect(() => {
    loadUnapprovedQAs();
  }, []);

  const loadUnapprovedQAs = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('qa_pairs')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setQAPairs(data || []);
    } catch (error) {
      console.error('Error loading QAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveQA = async (qaId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('qa_pairs')
        .update({ status: 'approved' })
        .eq('id', qaId);

      if (error) throw error;

      setQAPairs(prev => prev.filter(qa => qa.id !== qaId));
      setSelectedQA(null);
    } catch (error) {
      console.error('Error approving QA:', error);
      alert('Gagal menyetujui Q&A');
    }
  };

  const rejectQA = async (qaId: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak Q&A ini?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('qa_pairs')
        .delete()
        .eq('id', qaId);

      if (error) throw error;

      setQAPairs(prev => prev.filter(qa => qa.id !== qaId));
      setSelectedQA(null);
    } catch (error) {
      console.error('Error rejecting QA:', error);
      alert('Gagal menolak Q&A');
    }
  };

  const updateAnswer = async () => {
    if (!selectedQA) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('qa_pairs')
        .update({ answer_text: editedAnswer })
        .eq('id', selectedQA.id);

      if (error) throw error;

      setQAPairs(prev => prev.map(qa => 
        qa.id === selectedQA.id ? { ...qa, answer_text: editedAnswer } : qa
      ));
      
      setSelectedQA({ ...selectedQA, answer_text: editedAnswer });
      setEditingAnswer(false);
    } catch (error) {
      console.error('Error updating answer:', error);
      alert('Gagal memperbarui jawaban');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat data Q&A...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QA Approval Dashboard</h1>
          <p className="text-gray-600 mt-2">Review dan setujui Q&A pairs yang menunggu persetujuan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List View */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Menunggu Persetujuan ({qaPairs.length})</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {qaPairs.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">
                    Tidak ada Q&A yang menunggu persetujuan
                  </div>
                ) : (
                  qaPairs.map(qa => (
                    <div
                      key={qa.id}
                      onClick={() => {
                        setSelectedQA(qa);
                        setEditedAnswer(qa.answer_text);
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedQA?.id === qa.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">
                        {qa.question_variations[0]}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {qa.domain} Ã¢â‚¬Â¢ {new Date(qa.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {selectedQA ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Pertanyaan:</h3>
                  <div className="space-y-2">
                    {selectedQA.question_variations.map((q, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Jawaban:</h3>
                  {editingAnswer ? (
                    <div>
                      <textarea
                        value={editedAnswer}
                        onChange={(e) => setEditedAnswer(e.target.value)}
                        className="w-full p-3 border rounded-lg h-32"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={updateAnswer}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingAnswer(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
                        {selectedQA.answer_text}
                      </div>
                      <button
                        onClick={() => setEditingAnswer(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit Jawaban
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Domain:</h3>
                    <p className="text-sm text-gray-900">{selectedQA.domain}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Bot Access:</h3>
                    <p className="text-sm text-gray-900">{selectedQA.bot_access.join(', ')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Sumber:</h3>
                    <p className="text-sm text-gray-900">{selectedQA.source_reference || '-'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Status:</h3>
                    <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      {selectedQA.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => approveQA(selectedQA.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => rejectQA(selectedQA.id)}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <div className="text-6xl mb-4">Ã°Å¸â€œâ€¹</div>
                <p>Pilih Q&A dari daftar untuk review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}