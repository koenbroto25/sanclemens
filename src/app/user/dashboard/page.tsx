'use client';
import Link from 'next/link';

export default function UserDashboardPage() {
  return (
    <div className="dashboard-container">
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="hero-card">
          <h1>Selamat Datang, Budi Santoso</h1>
          <p>Dashboard Umat Aktif (Layer 2) — Paroki Santo Klemens Sepinggan. Kelola data keluarga, akses surat pastoral, dan pantau kegiatan lingkungan Anda.</p>
          <div className="hero-actions">
            <Link href="/pastoral-letters" className="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              Surat Pastoral
            </Link>
            <Link href="/klemen-kerja" className="btn-secondary">Klemen Kerja</Link>
          </div>
        </div>
        <div className="stats-card">
          <h2>Ringkasan Akun</h2>
          <div className="stat-grid">
            <div className="stat-item"><div className="stat-value">2</div><div className="stat-label">Anggota Keluarga</div></div>
            <div className="stat-item"><div className="stat-value">1</div><div className="stat-label">Lingkungan Aktif</div></div>
            <div className="stat-item"><div className="stat-value">3</div><div className="stat-label">Surat Pastoral</div></div>
            <div className="stat-item"><div className="stat-value">Layer 2</div><div className="stat-label">Level Akses</div></div>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="quick-access-grid">
        <Link href="/pastoral-letters" className="quick-access-card">
          <div className="quick-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg></div>
          <div className="quick-card-title">Surat Pastoral</div>
          <div className="quick-card-desc">Baca surat pastoral dari Pastor Paroki</div>
          <span className="role-badge">Layer 2+</span>
        </Link>
        <Link href="/whistleblower" className="quick-access-card">
          <div className="quick-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
          <div className="quick-card-title">Whistleblower</div>
          <div className="quick-card-desc">Laporkan pelanggaran dengan aman dan rahasia</div>
          <span className="role-badge">Layer 2+</span>
        </Link>
        <Link href="/klemen-kerja" className="quick-access-card">
          <div className="quick-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7v15h20V7L12 2z"/><path d="M2 7l10 5 10-5M2 12l10 5 10-5M2 17l10 5 10-5"/></svg></div>
          <div className="quick-card-title">Klemen Kerja</div>
          <div className="quick-card-desc">Temukan pekerjaan dan peluang bisnis umat</div>
          <span className="role-badge marketplace">Layer 2+</span>
        </Link>
        <Link href="/data-gakin" className="quick-access-card">
          <div className="quick-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h18v18H3V3z"/><path d="M3 9h18M3 15h18"/></svg></div>
          <div className="quick-card-title">GAKIN</div>
          <div className="quick-card-desc">Cek status bantuan dan ajukan permohonan</div>
          <span className="role-badge">Layer 2+</span>
        </Link>
      </div>

      {/* Sections */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Kegiatan Terkini</h2>
          <Link href="/kegiatan">Lihat Semua</Link>
        </div>
        <div className="cards-grid">
          <div className="dashboard-card">
            <h3>Penerimaan Sakramen Krisma</h3>
            <p>Minggu, 8 Juni 2026 · 09:00 WIB · Gereja Utama</p>
            <div className="card-footer"><span>Ibadah</span><span className="status-pill active">Terdaftar</span></div>
          </div>
          <div className="dashboard-card">
            <h3>Rapat Dewan Paroki</h3>
            <p>Minggu, 14 Juni 2026 · 10:00 WIB · Aula Paroki</p>
            <div className="card-footer"><span>Sosial</span><span className="status-pill pending">Open</span></div>
          </div>
          <div className="dashboard-card">
            <h3>Retret Anak Komuni Pertama</h3>
            <p>Minggu, 21 Juni 2026 · 08:00 WIB · Gua Maria</p>
            <div className="card-footer"><span>Pendidikan</span><span className="status-pill pending">Open</span></div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Status Lingkungan</h2>
          <Link href="/lingkungan">Kelola</Link>
        </div>
        <div className="cards-grid">
          <div className="dashboard-card">
            <h3>Lingkungan St. Andreas</h3>
            <p>Ketua Lingkungan: Bpk. Andreas S.</p>
            <div className="card-footer"><span>Wilayah I</span><span className="status-pill active">Aktif</span></div>
          </div>
          <div className="dashboard-card">
            <h3>Data Keluarga</h3>
            <p>2 anggota keluarga terdaftar</p>
            <div className="card-footer"><span>Family</span><span className="status-pill active">Lengkap</span></div>
          </div>
          <div className="dashboard-card">
            <h3>Verifikasi Akun</h3>
            <p>Status: Verified (Layer 2)</p>
            <div className="card-footer"><span>Account</span><span className="status-pill active">Verified</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}