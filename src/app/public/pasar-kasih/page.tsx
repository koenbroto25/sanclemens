'use client';

import { useState, useEffect } from 'react';
import { PasarKasihBotWidget } from '@/components/ai/PasarKasihBotWidget';
import SearchBar from '@/components/marketplace/SearchBar';
import CategoryGrid from '@/components/marketplace/CategoryGrid';
import BusinessDirectory from '@/components/marketplace/BusinessDirectory';

// Dummy data for categories, replace with API call or constant from DB
const DUMMY_CATEGORIES = ['Kuliner', 'Jasa', 'Teknologi', 'Otomotif', 'Pendidikan', 'Kesehatan', 'Fashion', 'Seni'];

interface BusinessItem {
  type: 'product' | 'job';
  id: string;
  nama: string;
  lokasi: string;
  is_active: boolean;
  kategori?: string;
  rating?: number;
  gambar?: string;
  deskripsi_singkat?: string;
  harga?: number;
  is_verified?: boolean;
  tipe_pekerjaan?: string;
  gaji_range?: string;
  deadline?: string;
}

export default function PasarKasihPage() {
  const [activeTab, setActiveTab] = useState<'usaha' | 'lowongan'>('usaha');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [jobs, setJobs] = useState<BusinessItem[]>([]);

  // Function to fetch businesses
  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('kategori', selectedCategory);
      
      const res = await fetch(`/api/public/business-listings?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch businesses');
      const data = await res.json();
      setBusinesses(data.businesses.map((b: any) => ({ ...b, type: 'product' })));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch job opportunities
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('tipe_pekerjaan', selectedCategory); // Assuming category can map to job_type
      
      const res = await fetch(`/api/public/job-opportunities?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch job opportunities');
      const data = await res.json();
      setJobs(data.jobOpportunities.map((j: any) => ({ ...j, type: 'job', nama: j.judul })));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'usaha') {
      fetchBusinesses();
    } else {
      fetchJobs();
    }
  }, [activeTab, searchQuery, selectedCategory]);

  return (
    <div className="pasar-kasih-page min-h-screen">
      {/* Import the custom CSS */}
      <style jsx global>{`
        @import '../../styles/pasar-kasih.css';
      `}</style>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-pk-text mb-3">Pasar Kasih</h1>
          <p className="text-lg text-pk-text-muted max-w-2xl mx-auto">
            Temukan dan terhubung dengan usaha umat, lowongan kerja, dan talenta 
            di lingkungan Paroki Santo Klemens. Ekonomi solidaritas untuk kita semua.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setActiveTab('usaha')}
            className={`px-6 py-3 text-lg font-semibold border-b-2 
              ${activeTab === 'usaha' ? 'border-pk-primary text-pk-primary' : 'border-transparent text-pk-text-muted hover:text-pk-primary-dark'}`}
          >
            Usaha Umat
          </button>
          <button 
            onClick={() => setActiveTab('lowongan')}
            className={`px-6 py-3 text-lg font-semibold border-b-2 
              ${activeTab === 'lowongan' ? 'border-pk-primary text-pk-primary' : 'border-transparent text-pk-text-muted hover:text-pk-primary-dark'}`}
          >
            Lowongan Kerja
          </button>
        </div>

        {/* Search and Filter */}
        <SearchBar
          onSearch={setSearchQuery}
          onFilter={setSelectedCategory}
          categories={DUMMY_CATEGORIES}
          selectedCategory={selectedCategory ?? undefined}
        />

        {/* Category Grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-pk-text mb-6 text-center">Jelajahi Kategori</h2>
          <CategoryGrid 
            categories={DUMMY_CATEGORIES} 
            onSelectCategory={setSelectedCategory}
            selectedCategory={selectedCategory ?? undefined}
          />
        </div>

        {/* Business/Job Listings */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-pk-text mb-6 text-center">
            {activeTab === 'usaha' ? 'Daftar Usaha Umat' : 'Daftar Lowongan Kerja'}
          </h2>
          {loading && <p className="text-center text-pk-text-muted">Memuat data...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && (
            <BusinessDirectory 
              items={activeTab === 'usaha' ? businesses : jobs} 
              layout="grid" 
              emptyMessage={activeTab === 'usaha' ? "Tidak ada usaha yang ditemukan." : "Tidak ada lowongan kerja yang ditemukan."}
            />
          )}
        </div>

        {/* Pasar Kasih Bot Widget */}
        <div className="mt-12 border-t border-pk-border pt-8">
          <h2 className="text-2xl font-bold text-pk-text mb-6 text-center">Punya Pertanyaan? Tanya Bot Bisnis!</h2>
          <PasarKasihBotWidget />
        </div>
      </div>
    </div>
  );
}