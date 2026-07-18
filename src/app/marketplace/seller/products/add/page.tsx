'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Category {
  value: string;
  label: string;
}

const CATEGORIES: Category[] = [
  { value: 'makanan', label: 'Makanan & Minuman' },
  { value: 'kerajinan', label: 'Kerajinan' },
  { value: 'jasa', label: 'Jasa' },
  { value: 'pakaian', label: 'Pakaian & Aksesori' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '0',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate max 2 images
    if (fileArray.length > 2) {
      setError('Maksimal 2 foto per produk');
      return;
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Format tidak didukung: ${file.name}. Hanya JPG, PNG, WebP yang diperbolehkan.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File terlalu besar: ${file.name}. Maksimal 5MB per foto.`);
        return;
      }
    }

    setError(null);
    
    // Create preview URLs
    const previewUrls = fileArray.map(file => URL.createObjectURL(file));
    setPreviewImages(previewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', formData.stock);

      // Append images
      const fileInput = document.getElementById('product-images') as HTMLInputElement;
      if (fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formDataToSend.append('images', fileInput.files[i]);
        }
      }

      const response = await fetch('/api/marketplace/products', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menambah produk');
      }

      setSuccess('Produk berhasil diajukan! Menunggu moderasi admin.');
      setTimeout(() => {
        router.push('/marketplace/seller/products');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketplace-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="marketplace-section">
        <div className="section-header">
          <h2>Tambah Produk Baru</h2>
          <Link href="/marketplace/seller/products">Kembali</Link>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Product Name */}
          <div>
            <label htmlFor="name" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Nama Produk <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
              placeholder="Contoh: Kerajinan Tangan Salib Kayu"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Deskripsi <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem',
                resize: 'vertical'
              }}
              placeholder="Jelaskan produk Anda..."
            />
          </div>

          {/* Price and Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="price" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Harga <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                placeholder="Contoh: Rp 75.000"
              />
            </div>

            <div>
              <label htmlFor="stock" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Stok <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Kategori <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Pilih Kategori</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Foto Produk <span style={{ color: 'red' }}>*</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280' }}>
                {' '}(Maksimal 2 foto, JPG/PNG/WebP, maks 5MB per foto)
              </span>
            </label>
            
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              background: '#f9fafb'
            }}>
              <input
                type="file"
                id="product-images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="product-images" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>
                  Klik untuk mengunggah foto
                </p>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                  Format: JPG, PNG, WebP (Maks 5MB per foto)
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {previewImages.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                {previewImages.map((url, idx) => (
                  <div key={idx} style={{
                    position: 'relative',
                    paddingBottom: '75%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f3f4f6'
                  }}>
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: '#d1fae5',
              color: '#065f46',
              fontSize: '0.9rem'
            }}>
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Mengunggah...' : 'Ajukan Produk'}
          </button>
        </form>
      </div>
    </div>
  );
}