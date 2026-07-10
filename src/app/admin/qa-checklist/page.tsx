'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ContentChecklist {
  table_name: string;
  total_uploaded: number;
  approved: number;
  has_embedding: number;
  last_uploaded: string;
  first_uploaded: string;
}

interface BotContentSummary {
  bot_name: string;
  domain: string;
  total_qa: number;
  approved_qa: number;
  embedded_qa: number;
  last_upload: string;
}

interface ChunksChecklist {
  content_type: string;
  chunk_source_domain: string;
  source_entity_table: string;
  total_chunks: number;
  has_embedding: number;
  last_created: string;
}

interface OrphanQa {
  qa_id: string;
  sample_question: string;
  domain: string;
  bot_name: string;
  created_at: string;
  status: string;
}

interface UploadProgress {
  total_prayers: number;
  total_qa: number;
  approved_qa: number;
  embedded_qa: number;
}

interface AdminData {
  contentChecklist: ContentChecklist[];
  botContentSummary: BotContentSummary[];
  chunksChecklist: ChunksChecklist[];
  orphanQa: OrphanQa[];
  uploadProgress: UploadProgress;
}

export default function QaChecklistPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch('/api/admin/qa-checklist');
        if (response.status === 401) {
          router.push('/login'); // Redirect to login if not authenticated
          return;
        }
        if (response.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini.');
          setLoading(false);
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const result: AdminData = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  if (loading) {
    return <div className="p-4 text-center">Loading admin data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-4 text-center">No data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">Admin QA & Content Checklist</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">📈 Upload Progress Summary</h2>
        {data.uploadProgress ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-green-400">{data.uploadProgress.total_prayers}</span>
              <span className="text-sm text-gray-400">Total Prayers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-green-400">{data.uploadProgress.total_qa}</span>
              <span className="text-sm text-gray-400">Total QA Pairs</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-yellow-400">{data.uploadProgress.approved_qa}</span>
              <span className="text-sm text-gray-400">Approved QA</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-purple-400">{data.uploadProgress.embedded_qa}</span>
              <span className="text-sm text-gray-400">Embedded QA</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No upload progress data available.</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">📊 Content Checklist</h2>
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Table Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Approved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Has Embedding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.contentChecklist.map((item) => (
                <tr key={item.table_name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.table_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.total_uploaded}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.approved}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.has_embedding}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(item.last_uploaded).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">🤖 Bot Content Summary</h2>
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Bot Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total QA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Approved QA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Embedded QA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Upload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.botContentSummary.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.bot_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.total_qa}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.approved_qa}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.embedded_qa}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(item.last_upload).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-white">🗃️ Chunks Checklist (AI Knowledge Base)</h2>
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Content Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source Table</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Chunks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Has Embedding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.chunksChecklist.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.content_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.chunk_source_domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.source_entity_table}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.total_chunks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.has_embedding}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(item.last_created).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-white">⚠️ Orphan QA (Missing AI Knowledge Base Entry)</h2>
        {data.orphanQa.length > 0 ? (
          <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">QA ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sample Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Bot Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.orphanQa.map((item) => (
                  <tr key={item.qa_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.qa_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.sample_question}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.domain}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.bot_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">✅ Tidak ada QA yang orphan.</p>
        )}
      </section>
    </div>
  );
}