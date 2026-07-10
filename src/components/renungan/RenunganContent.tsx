interface MetadataLiturgi {
  tanggal: string;
  perayaan: string;
  tingkat_perayaan: string;
  warna_liturgi: string;
  is_minggu: boolean;
  musim_liturgi: string;
}

interface RenunganData {
  id: string;
  tanggal: string;
  mode_persona: string;
  perayaan: string;
  tingkat_perayaan: string;
  warna_liturgi: string;
  musim_liturgi: string;
  tema_renungan: string;
  bacaan_utama: string;
  pengantar: string | null;
  pintu_sabda: string | null;
  suara_tradisi: string | null;
  cermin_kehidupan: string | null;
  doa_penutup: string | null;
  cerita_pendek: string | null;
  ayat_sabda: string | null;
  pertanyaan_refleksi: string | null;
  undangan_hening: string | null;
  resonansi_minggu: string | null;
  teks_lengkap: string;
  ringkasan_150_kata: string;
  kutipan_unggulan: string;
  resonansi_untuk_notifikasi: string | null;
  skor_total: number;
  lulus_validasi: boolean;
}

export default function RenunganContent({ renungan, liturgi }: { renungan: RenunganData; liturgi: MetadataLiturgi }) {
  const colorMap: Record<string, string> = {
    Hijau: '#4a8c5c',
    Putih: '#f0ebe0',
    Merah: '#8b2635',
    Ungu: '#6b4c8a',
    Rosa: '#e8a0b0',
    Emas: '#c8a96e',
  };

  const liturgicalColor = colorMap[liturgi.warna_liturgi] || colorMap['Hijau'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-4 h-4 rounded-full" style={{ background: liturgicalColor }}></span>
        <span className="text-sm text-gray-500">
          {liturgi.musim_liturgi || 'Masa Biasa'} · Warna {liturgi.warna_liturgi || 'Hijau'}
        </span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{renungan.perayaan}</h2>
      <p className="text-sm text-gray-500 mb-4">{renungan.tingkat_perayaan}</p>

      <div className="prose prose-stone max-w-none mb-6">
        <p className="whitespace-pre-line text-gray-800 leading-relaxed">{renungan.teks_lengkap}</p>
      </div>

      {renungan.kutipan_unggulan && (
        <div className="border-l-4 border-gold pl-4 italic text-gray-700 mb-6">
          {renungan.kutipan_unggulan}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renungan.pengantar && (
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-2">Pengantar</h3>
            <p className="text-gray-800 whitespace-pre-line">{renungan.pengantar}</p>
          </div>
        )}
        {renungan.pintu_sabda && (
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-2">Pintu Sabda</h3>
            <p className="text-gray-800 whitespace-pre-line">{renungan.pintu_sabda}</p>
          </div>
        )}
        {renungan.suara_tradisi && (
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-2">Suara Tradisi</h3>
            <p className="text-gray-800 whitespace-pre-line">{renungan.suara_tradisi}</p>
          </div>
        )}
        {renungan.cermin_kehidupan && (
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-2">Cermin Kehidupan</h3>
            <p className="text-gray-800 whitespace-pre-line">{renungan.cermin_kehidupan}</p>
          </div>
        )}
        {renungan.doa_penutup && (
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-2">Doa Penutup</h3>
            <p className="text-gray-800 whitespace-pre-line">{renungan.doa_penutup}</p>
          </div>
        )}
      </div>

      {renungan.lulus_validasi && (
        <p className="text-xs text-green-700 mt-4">Skor teologis valid: {renungan.skor_total}</p>
      )}
    </div>
  );
}