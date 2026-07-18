'use client';
import { useEffect, useState, useCallback } from 'react';
import { AdBanner } from '@/components/AdBanner';
import { 
  Calendar, MapPin, Clock, ArrowRight, Loader2,
} from 'lucide-react';
import { getTodayLiturgicalInfo, type LiturgicalInfo } from '@/lib/liturgi/liturgicalCalendar';

/* ============================================================
   TYPES
   ============================================================ */

interface Warta {
  id: string;
  judul: string;
  excerpt: string;
  tanggal: string;
  kategori: string;
  gambar_url?: string;
  published_at?: string;
}

interface Kegiatan {
  id: string;
  nama: string;
  deskripsi: string;
  tanggal: string;
  jam_mulai?: string;
  jam_selesai?: string;
  lokasi?: string;
  kategori: string;
  gambar_url?: string;
  is_published: boolean;
}

interface JadwalMisa {
  id: string;
  hari: string;
  label?: string;
  jam: string;
  nama_misa: string;
  lokasi: string;
  tipe: string;
  tanggal_spesifik?: string;
  is_active: boolean;
}

interface JadwalMisaGrouped {
  harian: JadwalMisa[];
  hari_besar: JadwalMisa[];
  khusus: JadwalMisa[];
}

interface BacaanLiturgi {
  sumber: string;
  teks: string;
}

interface ReadingDetail {
  reference: string;
  teks: string;
}

interface DailyLiturgi {
  bacaan_1: BacaanLiturgi;
  bacaan_injil: BacaanLiturgi;
  santo_santa_hari_ini?: { nama: string; keterangan: string }[];
  pesan_personal?: string;
  readings_full?: ReadingDetail[];
}

type MisaTab = 'minggu-ini' | 'hari-besar' | 'khusus';

/* ============================================================
   STATIC LOOKUPS
   ============================================================ */

const HARI_MAP: Record<string, string> = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
};

const HARI_ORDER: string[] = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

const LITURGI_COLOR_MAP: Record<string, string> = {
  Hijau: '#4a8c5c',
  Putih: '#f0ebe0',
  Merah: '#8b2635',
  Ungu: '#6b4c8a',
  Rosa: '#e8a0b0',
  Emas: '#c8a96e',
};

function sortByJam<T extends { jam: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const [ha, ma] = a.jam.split(':').map(Number);
    const [hb, mb] = b.jam.split(':').map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function HomePage() {
  const BOT_ID = 'bot_1';

  // Bot chat widget state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [botInput, setBotInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [botMessages, setBotMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);

  // Content state
  const [publicWarta, setPublicWarta] = useState<Warta[]>([]);
  const [publicKegiatan, setPublicKegiatan] = useState<Kegiatan[]>([]);
  const [publicJadwalMisa, setPublicJadwalMisa] = useState<JadwalMisaGrouped | null>(null);
  const [activeMisaTab, setActiveMisaTab] = useState<MisaTab>('minggu-ini');
  const [loadingContent, setLoadingContent] = useState(true);
  const [errorContent, setErrorContent] = useState('');
  const [dailyLiturgi, setDailyLiturgi] = useState<DailyLiturgi | null>(null);
  const [liturgicalInfo, setLiturgicalInfo] = useState<LiturgicalInfo | null>(null);
  const [statistikData, setStatistikData] = useState<Array<{ value: string; label: string }> | null>(null);
  const [saintsToday, setSaintsToday] = useState<Array<{ nama: string; tipe: string; riwayat: string }> | null>(null);

  const toggleChat = () => setIsChatOpen((open) => !open);
  const closeChat = () => setIsChatOpen(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const sendBotMessage = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();

    const message = botInput.trim();
    if (!message) return;

    setBotInput('');
    setBotMessages((current) => [...current, { sender: 'user', text: message }]);
    setIsBotLoading(true);

    try {
      const response = await fetch(`/api/bot/${BOT_ID}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: message }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      setBotMessages((current) => [
        ...current,
        { sender: 'bot', text: data?.bot_response || 'Maaf, bot belum bisa menjawab.' },
      ]);
    } catch (error) {
      console.error('Bot error:', error);
      setBotMessages((current) => [
        ...current,
        { sender: 'bot', text: 'Maaf, terjadi kesalahan saat menghubungi bot. Silakan coba lagi.' },
      ]);
    } finally {
      setIsBotLoading(false);
    }
  };

  const fetchDailyLiturgi = useCallback(async () => {
    try {
      const res = await fetch('/api/liturgi/calendar');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch daily liturgy');
      
      // Fetch full readings text if readings exist
      if (data.readings && data.readings.length > 0) {
        const referencesParam = data.readings.join(';');
        const detailRes = await fetch(`/api/liturgi/reading-detail?references=${encodeURIComponent(referencesParam)}`);
        const detailData = await detailRes.json();
        if (detailRes.ok && detailData.readings) {
          data.readings_full = detailData.readings;
        }
      }
      
      setDailyLiturgi(data);
    } catch (err) {
      console.error('Error fetching daily liturgy:', err);
    }
  }, []);

  const fetchLiturgicalTheme = useCallback(async () => {
    try {
      const info = await getTodayLiturgicalInfo();
      setLiturgicalInfo(info);
    } catch (err) {
      console.error('Error fetching liturgical theme:', err);
    }
  }, []);

  const fetchStatistik = useCallback(async () => {
    try {
      const res = await fetch('/api/public/statistik');
      const data = await res.json();
      if (res.ok && data.data && Array.isArray(data.data)) {
        setStatistikData(data.data);
      } else {
        setStatistikData(null);
      }
    } catch (err) {
      console.error('Error fetching statistik:', err);
      setStatistikData(null);
    }
  }, []);

  const fetchSaintsToday = useCallback(async () => {
    try {
      const res = await fetch('/api/liturgi/saints');
      const data = await res.json();
      if (res.ok && data.saints) {
        setSaintsToday(data.saints);
      } else {
        setSaintsToday(null);
      }
    } catch (err) {
      console.error('Error fetching saints:', err);
      setSaintsToday(null);
    }
  }, []);

  const fetchPublicContent = useCallback(async () => {
    setLoadingContent(true);
    setErrorContent('');
    try {
      const wartaRes = await fetch('/api/public/warta-paroki');
      const wartaData = await wartaRes.json();
      if (!wartaRes.ok) throw new Error(wartaData.error || 'Failed to fetch warta');
      setPublicWarta(wartaData.data || []);

      const kegiatanRes = await fetch('/api/public/kegiatan');
      const kegiatanData = await kegiatanRes.json();
      if (!kegiatanRes.ok) throw new Error(kegiatanData.error || 'Failed to fetch kegiatan');
      setPublicKegiatan(kegiatanData.data || []);

      const jadwalMisaRes = await fetch('/api/public/jadwal-misa');
      const jadwalMisaData = await jadwalMisaRes.json();
      if (!jadwalMisaRes.ok) throw new Error(jadwalMisaData.error || 'Failed to fetch jadwal misa');
      setPublicJadwalMisa(jadwalMisaData.grouped);
    } catch (err) {
      console.error('Error fetching public content:', err);
      setErrorContent(err instanceof Error ? err.message : 'Gagal memuat konten publik');
    } finally {
      setLoadingContent(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPublicContent();
    fetchDailyLiturgi();
    fetchLiturgicalTheme();
    fetchStatistik();
    fetchSaintsToday();
  }, [fetchPublicContent, fetchDailyLiturgi, fetchLiturgicalTheme, fetchStatistik, fetchSaintsToday]);

  /** Misa Berikutnya — derived purely from data, no DOM writes. */
  const nextMass = (() => {
    if (!publicJadwalMisa) return null;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayKeyMap: Record<string, string> = {
      sunday: 'minggu', monday: 'senin', tuesday: 'selasa', wednesday: 'rabu',
      thursday: 'kamis', friday: 'jumat', saturday: 'sabtu',
    };
    const todayKey = dayKeyMap[currentDay] || 'senin';
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todayMasses = sortByJam(publicJadwalMisa.harian.filter((m) => m.hari === todayKey));
    for (const misa of todayMasses) {
      const [h, m] = misa.jam.split(':').map(Number);
      if (h * 60 + m > currentMinutes) return misa;
    }

    const todayIndex = HARI_ORDER.indexOf(todayKey);
    for (let i = 1; i <= 7; i++) {
      const nextDay = HARI_ORDER[(todayIndex + i) % 7];
      const masses = sortByJam(publicJadwalMisa.harian.filter((m) => m.hari === nextDay));
      if (masses.length > 0) return masses[0];
    }
    return null;
  })();

  /** Jadwal Misa — Minggu Ini, grouped by day, today first highlighted. */
  const mingguIniCards = (() => {
    if (!publicJadwalMisa) return [];
    const todayIndex = new Date().getDay(); // 0 = Sunday
    const grouped: Record<string, JadwalMisa[]> = {};
    HARI_ORDER.forEach((d) => (grouped[d] = []));
    publicJadwalMisa.harian.forEach((m) => {
      if (grouped[m.hari]) grouped[m.hari].push(m);
    });

    return HARI_ORDER.map((dayKey, index) => ({
      dayKey,
      isToday: index === todayIndex,
      misaForDay: sortByJam(grouped[dayKey]),
    })).filter((d) => d.misaForDay.length > 0);
  })();

  return (
    <>
      {/* Note: Header/footer/navbar/bot-fab/scroll-top/accent-bar/modals are handled by layout.tsx */}

      {/* ============ HERO (§8.1) ============ */}
      <section className="hero" id="beranda">
        <div className="hero-bg">
          <img src="/gereja-santo-clemens.jpg" alt="Gereja Santo Klemens Sepinggan" />
          <div className="overlay"></div>
          <div className="vignette"></div>
          <div className="grain"></div>
        </div>
        <div className="light-particles" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="hero-content">
          <p className="hero-eyebrow">Paroki Santo Klemens Sepinggan</p>
          <h1><span className="drop-cap-hero">S</span>elamat Datang di<br />Rumah Kita Bersama</h1>
          <p className="hero-sub">Gereja Santo Martinus &middot; Lanud Balikpapan<br />Keuskupan Agung Samarinda</p>
          <div className="hero-actions">
            <a href="/auth/register" className="btn-hero-primary">
              Daftar sebagai Umat
            </a>
            <a href="/auth/login" className="btn-hero-secondary">Sudah Punya Akun? Masuk</a>
          </div>
        </div>

        <div className="hero-next-mass">
          {nextMass ? (
            <>
              <div className="label">Misa Berikutnya</div>
              <div className="time">{nextMass.jam.substring(0, 5)}</div>
              <div className="name">{nextMass.nama_misa}</div>
            </>
          ) : (
            <>
              <div className="label">Misa Berikutnya</div>
              <div className="time">N/A</div>
              <div className="name">Tidak ada jadwal misa</div>
            </>
          )}
          <div className="liturgi-today-tag" data-liturgi-label>
            <span className="dot"></span>
            <span>{liturgicalInfo?.color || 'Hijau'} &mdash; {liturgicalInfo?.celebration || 'Masa Biasa'}</span>
          </div>
        </div>

        <div className="scroll-indicator">
          <span className="text">Gulir untuk mengenal kami</span>
          <span className="chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </div>
      </section>

      {/* ============ JADWAL MISA (§8.2) ============ */}
      {loadingContent ? (
        <section className="section-misa reveal" id="jadwal-misa">
          <div className="section-inner text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
            <p className="text-stone-500 mt-2">Memuat jadwal misa...</p>
          </div>
        </section>
      ) : errorContent ? (
        <section className="section-misa reveal" id="jadwal-misa">
          <div className="section-inner text-center py-12">
            <p style={{ color: 'var(--color-glass-red)' }}>Terjadi kesalahan: {errorContent}</p>
            <button onClick={fetchPublicContent} className="btn-lihat-semua" style={{ margin: '1rem auto 0' }}>
              Coba Lagi <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="section-misa reveal" id="jadwal-misa">
            <div className="section-inner">
              <p className="section-eyebrow">Ibadat & Sakramen</p>
              <h2 className="section-title">Jadwal Misa</h2>
              <p className="section-subtitle">Paroki Santo Klemens Sepinggan</p>
              <div className="ornament-divider">
                <span className="line"></span>
                <span className="cross"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="1" width="2" height="12" rx="0.5" fill="#c8a96e" /><rect x="3" y="4" width="8" height="2" rx="0.5" fill="#c8a96e" /></svg></span>
                <span className="line"></span>
              </div>

              <div className="misa-tabs" role="tablist" aria-label="Pilih kategori jadwal misa">
                {(['minggu-ini', 'hari-besar', 'khusus'] as MisaTab[]).map((tab) => (
                  <button
                    key={tab}
                    className={`misa-tab ${activeMisaTab === tab ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeMisaTab === tab}
                    onClick={() => setActiveMisaTab(tab)}
                  >
                    {tab === 'minggu-ini' ? 'Minggu Ini' : tab === 'hari-besar' ? 'Hari Besar' : 'Misa Khusus'}
                  </button>
                ))}
              </div>

              <div className="misa-grid">
                {activeMisaTab === 'minggu-ini' && mingguIniCards.map(({ dayKey, isToday, misaForDay }) => (
                  <div key={dayKey} className={`misa-card${isToday ? ' today' : ''}`}>
                    {isToday && <div className="today-badge"></div>}
                    <div className="day-label">{isToday ? 'Hari Ini' : '\u00A0'}</div>
                    <div className="day-name">{HARI_MAP[dayKey]}</div>
                    {misaForDay.map((m) => (
                      <div key={m.id} className="mass-item">
                        <div className="mass-time">{m.jam.substring(0, 5)}</div>
                        <div className="mass-name">{m.nama_misa}</div>
                        <div className="mass-location">{m.lokasi}</div>
                      </div>
                    ))}
                  </div>
                ))}

                {activeMisaTab === 'hari-besar' && publicJadwalMisa && publicJadwalMisa.hari_besar.length > 0 &&
                  publicJadwalMisa.hari_besar.map((item) => (
                    <div key={item.id} className="misa-card">
                      <div className="day-label">{item.label || '\u00A0'}</div>
                      <div className="day-name">
                        {item.tanggal_spesifik
                          ? new Date(item.tanggal_spesifik).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                          : HARI_MAP[item.hari]}
                      </div>
                      <div className="mass-item">
                        <div className="mass-time">{item.jam.substring(0, 5)}</div>
                        <div className="mass-name">{item.nama_misa}</div>
                        <div className="mass-location">{item.lokasi}</div>
                      </div>
                    </div>
                  ))}

                {activeMisaTab === 'khusus' && publicJadwalMisa && publicJadwalMisa.khusus.length > 0 &&
                  publicJadwalMisa.khusus.map((item) => (
                    <div key={item.id} className="misa-card">
                      <div className="day-label">{item.label || '\u00A0'}</div>
                      <div className="day-name">
                        {item.tanggal_spesifik
                          ? new Date(item.tanggal_spesifik).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                          : HARI_MAP[item.hari]}
                      </div>
                      <div className="mass-item">
                        <div className="mass-time">{item.jam.substring(0, 5)}</div>
                        <div className="mass-name">{item.nama_misa}</div>
                        <div className="mass-location">{item.lokasi}</div>
                      </div>
                    </div>
                  ))}

                {((activeMisaTab === 'minggu-ini' && mingguIniCards.length === 0) ||
                  (activeMisaTab === 'hari-besar' && (!publicJadwalMisa || publicJadwalMisa.hari_besar.length === 0)) ||
                  (activeMisaTab === 'khusus' && (!publicJadwalMisa || publicJadwalMisa.khusus.length === 0))) && (
                  <p className="text-center text-stone-500" style={{ gridColumn: '1 / -1' }}>
                    Tidak ada jadwal misa untuk kategori ini.
                  </p>
                )}
              </div>

              <a href="/jadwal-misa" className="btn-lihat-semua">
                Lihat Jadwal Lengkap <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </section>

          {/* ============ WARTA PAROKI (§8.3) ============ */}
          <section className="section-pengumuman reveal" id="pengumuman">
            <div className="stained-glass-mesh" aria-hidden="true"></div>
            <div className="section-inner">
              <p className="section-eyebrow">Kabar & Warta</p>
              <h2 className="section-title">Warta Paroki</h2>
              <p className="section-subtitle">Informasi terbaru dari Paroki Santo Klemens</p>
              <div className="ornament-divider">
                <span className="line"></span>
                <span className="cross"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="1" width="2" height="12" rx="0.5" fill="#c8a96e" /><rect x="3" y="4" width="8" height="2" rx="0.5" fill="#c8a96e" /></svg></span>
                <span className="line"></span>
              </div>

              {publicWarta.length > 0 ? (
                <div className="pengumuman-grid">
                  <div className="pengumuman-main">
                    <div className="pengumuman-card">
                      <div className="card-date">{new Date(publicWarta[0].tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <div className="card-title">{publicWarta[0].judul}</div>
                      <div className="card-excerpt">{publicWarta[0].excerpt}</div>
                      <span className={`card-category ${publicWarta[0].kategori}`}>{publicWarta[0].kategori}</span>
                    </div>
                  </div>
                  <div className="pengumuman-side">
                    {publicWarta.slice(1, 3).map((warta) => (
                      <div key={warta.id} className="pengumuman-card">
                        <div className="card-date">{new Date(warta.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div className="card-title">{warta.judul}</div>
                        <div className="card-excerpt">{warta.excerpt}</div>
                        <span className={`card-category ${warta.kategori}`}>{warta.kategori}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center" style={{ color: 'var(--color-stone)' }}>Tidak ada warta terbaru.</p>
              )}

              <a href="/warta-paroki" className="btn-lihat-semua">
                Lihat Semua Pengumuman <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </section>
        </>
      )}

      {/* ============ BACAAN/LITURGI HARI INI (§8.5) ============ */}
      <section className="section-liturgi reveal" id="liturgi">
        <div className="liturgi-container">
          <div className="liturgi-header">
            <p className="section-eyebrow">Sabda Allah</p>
            <h2 className="section-title">Bacaan & Liturgi Hari Ini</h2>
            <div className="liturgi-meta">
              <span className="liturgi-meta-item">
                <span className="dot" style={{ background: liturgicalInfo?.color ? LITURGI_COLOR_MAP[liturgicalInfo.color] : 'var(--liturgi-hijau)' }}></span>
                <span>{liturgicalInfo?.celebration || 'Memuat informasi liturgi...'}</span>
              </span>
              <span className="liturgi-meta-item">
                <span className="dot" style={{ background: liturgicalInfo?.color ? LITURGI_COLOR_MAP[liturgicalInfo.color] : 'var(--liturgi-hijau)' }}></span>
                <span>Warna Liturgi: {liturgicalInfo?.color || 'Hijau'}</span>
              </span>
            </div>
          </div>
          <div className="ornament-divider rosette">
            <span className="line"></span>
            <span className="rosette-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />
                <circle cx="24" cy="24" r="4.5" stroke="currentColor" strokeWidth="1" />
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * Math.PI) / 4;
                  const x1 = 24 + Math.cos(angle) * 7;
                  const y1 = 24 + Math.sin(angle) * 7;
                  const x2 = 24 + Math.cos(angle) * 19;
                  const y2 = 24 + Math.sin(angle) * 19;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.75" opacity="0.7" />;
                })}
                <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </span>
            <span className="line"></span>
          </div>
          <div className="liturgi-manuscript">
            {dailyLiturgi && dailyLiturgi.readings_full && dailyLiturgi.readings_full.length > 0 ? (
              dailyLiturgi.readings_full.map((reading, index) => {
                const isInjil = reading.reference.toLowerCase().includes('injil') || 
                                 reading.reference.toLowerCase().includes('mat') ||
                                 reading.reference.toLowerCase().includes('mrk') ||
                                 reading.reference.toLowerCase().includes('luk') ||
                                 reading.reference.toLowerCase().includes('yoh');
                
                return (
                  <div key={index} className={`liturgi-reading ${isInjil ? 'injil' : ''}`}>
                    <div className="reading-label">
                      {index === 0 ? 'Bacaan Pertama' : isInjil ? 'Bacaan Injil' : `Bacaan ${index}`}
                    </div>
                    <div className="reading-source">{reading.reference}</div>
                    <div className="reading-text">
                      {isInjil && index > 0 ? (
                        <>
                          <span className="drop-cap">{reading.teks.charAt(0)}</span>
                          {reading.teks.substring(1)}
                        </>
                      ) : (
                        reading.teks
                      )}
                    </div>
                    {isInjil && (
                      <div className="respons-umat">Demikianlah Injil Tuhan. U: Terpujilah Kristus.</div>
                    )}
                  </div>
                );
              })
            ) : dailyLiturgi && dailyLiturgi.bacaan_1 && dailyLiturgi.bacaan_injil ? (
              <>
                <div className="liturgi-reading">
                  <div className="reading-label">Bacaan Pertama</div>
                  <div className="reading-source">{dailyLiturgi.bacaan_1.sumber}</div>
                  <div className="reading-text">{dailyLiturgi.bacaan_1.teks}</div>
                </div>
                <div className="liturgi-reading injil">
                  <div className="reading-label">Bacaan Injil</div>
                  <div className="reading-source">{dailyLiturgi.bacaan_injil.sumber}</div>
                  <div className="reading-text">
                    <span className="drop-cap">{dailyLiturgi.bacaan_injil.teks.charAt(0)}</span>
                    {dailyLiturgi.bacaan_injil.teks.substring(1)}
                  </div>
                  <div className="respons-umat">Demikianlah Injil Tuhan. U: Terpujilah Kristus.</div>
                </div>
              </>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--color-stone)' }}>Tidak dapat memuat bacaan liturgi hari ini.</div>
            )}
          </div>
        </div>
      </section>

      {/* ============ SANTO/SANTA HARI INI (§8.6) ============ */}
      <section className="section-saints reveal" id="santo-hari-ini">
        <div className="section-inner">
          <p className="section-eyebrow">Orang Kudus</p>
          <h2 className="section-title">Santo/Santa Hari Ini</h2>
          <p className="section-subtitle">Mengenal orang kudus yang diperingati hari ini</p>
          <div className="ornament-divider">
            <span className="line"></span>
            <span className="cross"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="1" width="2" height="12" rx="0.5" fill="#c8a96e" /><rect x="3" y="4" width="8" height="2" rx="0.5" fill="#c8a96e" /></svg></span>
            <span className="line"></span>
          </div>

          {saintsToday && saintsToday.length > 0 ? (
            <div className="saints-grid">
              {saintsToday.map((saint, idx) => (
                <div key={idx} className="saint-card">
                  <div className="saint-header">
                    <span className={`saint-type ${saint.tipe.toLowerCase()}`}>{saint.tipe}</span>
                  </div>
                  <div className="saint-name">{saint.nama}</div>
                  <div className="saint-content">
                    <p>{saint.riwayat}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--color-stone)' }}>
              <p>Tidak ada santo/santa yang diperingati hari ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* ============ KEGIATAN PAROKI (§8.4) ============ */}
      <section className="section-kegiatan reveal" id="kegiatan">
        <div className="kegiatan-container">
          <p className="section-eyebrow">Agenda Paroki</p>
          <h2 className="section-title">Kegiatan Paroki</h2>
          <p className="section-subtitle">Kegiatan dan acara mendatang</p>
          <div className="ornament-divider">
            <span className="line"></span>
            <span className="cross"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="1" width="2" height="12" rx="0.5" fill="#c8a96e" /><rect x="3" y="4" width="8" height="2" rx="0.5" fill="#c8a96e" /></svg></span>
            <span className="line"></span>
          </div>

          <div className="kegiatan-timeline">
            {publicKegiatan.length > 0 ? (
              publicKegiatan.map((k) => (
                <div key={k.id} className="kegiatan-card">
                  <div className="event-date">{new Date(k.tanggal).getDate()}</div>
                  <div className="event-month">{new Date(k.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
                  <div className="event-name">{k.nama}</div>
                  {k.jam_mulai && (
                    <div className="event-detail">
                      <Clock className="w-3 h-3" />
                      {k.jam_mulai}{k.jam_selesai ? ` - ${k.jam_selesai}` : ''}
                    </div>
                  )}
                  {k.lokasi && (
                    <div className="event-detail">
                      <MapPin className="w-3 h-3" />
                      {k.lokasi}
                    </div>
                  )}
                  <span className={`event-badge ${k.kategori}`}>{k.kategori}</span>
                </div>
              ))
            ) : (
              <p className="text-center" style={{ color: 'var(--color-stone)', width: '100%' }}>Tidak ada kegiatan mendatang.</p>
            )}
          </div>

          <a href="/kegiatan" className="btn-kalender">
            Lihat Kalender Lengkap <Calendar className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ============ IKLAN UMUM / DYNAMIC AD SYSTEM (§8.6) ============ */}
      <section className="section-ads reveal" id="iklan">
        <div className="ads-eyebrow-row">
          <span className="label">Dipersembahkan oleh</span>
        </div>
        <div className="ads-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '700px' }}>
          <AdBanner location="homepage" />
        </div>
      </section>

      {/* ============ SEKILAS PROFIL PAROKI (§8.10 teaser) ============ */}
      <section className="section-misa reveal" id="profil-paroki">
        <div className="section-inner">
          <p className="section-eyebrow">Tentang Kami</p>
          <h2 className="section-title">Sekilas Profil Paroki</h2>
          <p className="section-subtitle">Mengenal Paroki Santo Klemens Sepinggan</p>
          <div className="ornament-divider">
            <span className="line"></span>
            <span className="cross"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="1" width="2" height="12" rx="0.5" fill="var(--color-gold)" /><rect x="3" y="4" width="8" height="2" rx="0.5" fill="var(--color-gold)" /></svg></span>
            <span className="line"></span>
          </div>
          <div className="misa-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="misa-card">
              <div className="day-name">Visi</div>
              <div className="mass-item">
                <div className="mass-name">Menjadi Komunitas Umat Allah yang beriman, berpengharapan, dan berbelas kasih.</div>
              </div>
            </div>
            <div className="misa-card">
              <div className="day-name">Misi</div>
              <div className="mass-item">
                <div className="mass-name">Mengembangkan semangat persaudaraan sejati, pelayanan kasih, dan pewartaan Injil melalui teladan hidup.</div>
              </div>
            </div>
          </div>
          <p className="lingkungan-teaser-note">17 Lingkungan & Stasi siap menyambut Anda &mdash; lihat daftar lengkap di Profil Paroki.</p>
          <a href="/profil-paroki" className="btn-lihat-semua" style={{ margin: '0 auto', display: 'flex' }}>
            Lihat Profil Lengkap <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ============ DATA UMAT DALAM ANGKA (§8.8) ============ */}
      <section className="section-statistik reveal" id="statistik">
        <p className="section-eyebrow">Statistik Anonim</p>
        <h2 className="section-title">Paroki Santo Klemens dalam Angka</h2>
        <div className="statistik-grid">
          {statistikData && statistikData.length > 0 ? (
            statistikData.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-number">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))
          ) : (
            <p className="text-center" style={{ color: 'var(--color-stone)', width: '100%', padding: '2rem' }}>Belum ada data</p>
          )}
        </div>
        <p className="statistik-note">Data bersifat agregat dan anonim &mdash; tidak menampilkan identitas umat individual.</p>
      </section>

      {/* ============ BOT 1 FAB & CHAT WIDGET (§9.1) ============ */}
      <div
        className="bot-fab"
        aria-label="Tanya Bot Paroki"
        role="button"
        tabIndex={0}
        onClick={toggleChat}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleChat(); }}
      >
        <span className="pulse"></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="14" y="4" width="3" height="16" rx="1" /><rect x="7" y="8" width="10" height="3" rx="1" /><path d="M3 20l3-3h2" strokeWidth="1.5" /></svg>
      </div>
      <div className={`bot-tooltip ${isChatOpen ? 'show' : ''}`}>Tanya Bot Paroki</div>
      <div className={`chat-widget ${isChatOpen ? 'open' : ''}`} role="dialog" aria-label="Chat dengan Bot Paroki" aria-hidden={!isChatOpen}>
        <div className="chat-widget-header">
          <div className="chat-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="14" y="4" width="3" height="16" rx="1" /><rect x="7" y="8" width="10" height="3" rx="1" /></svg>
          </div>
          <div className="chat-info">
            <div className="chat-name">Bot Paroki</div>
            <div className="chat-status">Online</div>
          </div>
          <button className="chat-widget-close" aria-label="Tutup chat" onClick={closeChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="chat-widget-body">
          {botMessages.length === 0 ? (
            <p className="chat-greeting">
              Halo! Ada yang bisa saya bantu?<br /><br />
              Saya bisa membantu Anda mencari informasi tentang jadwal misa, sakramen, kegiatan paroki, dan lainnya.
            </p>
          ) : (
            botMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[70%] p-2 rounded-lg"
                  style={{
                    background: msg.sender === 'user' ? 'var(--color-gold-light)' : 'rgba(26,14,5,0.06)',
                    color: 'var(--color-text-dark)',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          {isBotLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] p-2 rounded-lg animate-pulse" style={{ background: 'rgba(26,14,5,0.06)', color: 'var(--color-text-dark)' }}>
                <span>Mengetik...</span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={sendBotMessage} className="chat-widget-input">
          <input
            type="text"
            placeholder="Ketik pertanyaan Anda..."
            aria-label="Pesan chat"
            value={botInput}
            onChange={(e) => setBotInput(e.target.value)}
            disabled={isBotLoading}
          />
          <button type="submit" aria-label="Kirim pesan" disabled={isBotLoading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </button>
        </form>
      </div>
    </>
  );
}
