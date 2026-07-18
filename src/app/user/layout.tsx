'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import '../../styles/public.css';
import '../../styles/user.css';
import '../../styles/layout-user.css';

type NavCluster = {
  label: string;
  icon: string;
  items: { href: string; label: string; badge?: string }[];
};

const navClusters: NavCluster[] = [
  {
    label: 'Rohani',
    icon: '🙏',
    items: [
      { href: '/user/pastoral-letters', label: 'Surat Pastoral' },
    ],
  },
  {
    label: 'Keluarga & Bantuan',
    icon: '🏠',
    items: [
      { href: '/user/family', label: 'Data Keluarga' },
      { href: '/user/data-gakin', label: 'Bantuan Sosial (GAKIN)' },
      { href: '/user/digital-vault', label: 'Digital Vault', badge: '!' },
    ],
  },
  {
    label: 'Komunitas',
    icon: '👥',
    items: [
      { href: '/user/klemen-kerja', label: 'Klemen Kerja' },
      { href: '/user/lingkungan', label: 'Lingkungan' },
      { href: '/user/whistleblower', label: 'Sampaikan Kepedulian' },
    ],
  },
  {
    label: 'Akun',
    icon: '⚙️',
    items: [
      { href: '/user/settings', label: 'Pengaturan' },
      { href: '/user/companion', label: 'Pendamping Rohani' },
    ],
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Navbar scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 60);
      setShowScrollTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      {/* Liturgical accent bar — same as public */}
      <div className="liturgi-accent-bar" suppressHydrationWarning></div>

      <svg className="svg-filters" aria-hidden="true">
        <defs>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </defs>
      </svg>

      {/* Navbar — follows public design */}
      <header className={`navbar ${isNavScrolled ? 'scrolled' : ''}`} id="navbar" role="banner">
        <div className="navbar-inner">
          <Link href="/user/dashboard" className="navbar-logo" aria-label="Paroki Santo Klemens Sepinggan">
            <span className="logo-icon">
              <img
                src="/images/saint-clemens.jpg"
                alt="Santo Klemens"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-gold)',
                  boxShadow: '0 0 12px rgba(200,169,110,0.3)',
                }}
              />
            </span>
            <span className="logo-text">
              <span className="logo-name">Santo Klemens</span>
              <span className="logo-sub">Sepinggan</span>
            </span>
          </Link>
          <nav className="navbar-nav" aria-label="Navigasi utama">
            <Link href="/user/dashboard">Dashboard</Link>
            {navClusters.map(cluster => (
              <span
                key={cluster.label}
                className={`nav-cluster-toggle ${activeCluster === cluster.label ? 'active' : ''}`}
                onClick={() => setActiveCluster(activeCluster === cluster.label ? null : cluster.label)}
                style={{ cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-light)', opacity: activeCluster === cluster.label ? 1 : 0.75, position: 'relative', padding: '0.25rem 0' }}
              >
                {cluster.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
            ))}
          </nav>
          <div className="navbar-right">
            <div className="user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="user-info">
                <span className="user-name">Umat</span>
                <span className="user-role">Dashboard</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
          <button 
            className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span></span><span></span><span></span>
          </button>
        </div>

        {/* Cluster dropdown menu */}
        {activeCluster && (
          <div className="nav-cluster-dropdown" onClick={() => setActiveCluster(null)}>
            <div className="nav-cluster-menu" onClick={e => e.stopPropagation()}>
              {navClusters.filter(c => c.label === activeCluster).map(cluster => (
                <div key={cluster.label}>
                  <div className="cluster-header">
                    <span className="cluster-icon">{cluster.icon}</span>
                    <span className="cluster-title">{cluster.label}</span>
                  </div>
                  {cluster.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="cluster-item"
                      onClick={() => setActiveCluster(null)}
                    >
                      <span>{item.label}</span>
                      {item.badge && <span className="cluster-badge">{item.badge}</span>}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} id="mobileMenu">
        <nav>
          <Link href="/user/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-gold)' }}>Dashboard</Link>
          {navClusters.map(cluster => (
            <div key={cluster.label}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-gold)', padding: '0.75rem 0' }}>
                {cluster.icon} {cluster.label}
              </div>
              {cluster.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-light)', padding: '0.6rem 0 0.6rem 1.5rem', borderBottom: '1px solid rgba(200, 169, 110, 0.1)', textDecoration: 'none' }}
                >
                  {item.label}
                  {item.badge && <span className="status-pill warning" style={{ marginLeft: 8 }}>{item.badge}</span>}
                </Link>
              ))}
            </div>
          ))}
          <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-gold)', padding: '0.75rem 0', marginTop: '1rem', borderTop: '1px solid rgba(200,169,110,0.15)' }}>
            🛒 Pasar Kasih
          </Link>
        </nav>
      </div>
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      <main>{children}</main>

      {/* Floating Companion Launcher — similar to public bot-fab */}
      <Link href="/user/companion" className="companion-fab" title="Pendamping Rohani">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </Link>

      {/* Scroll to top button */}
      <button
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ color: 'var(--color-primary)' }}>
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>

      {/* Footer — follows public design */}
      <footer className="footer" role="contentinfo">
        <div className="footer-top-grid">
          <div className="footer-col footer-col-paroki">
            <div className="footer-logo">
              <img
                src="/images/saint-clemens.jpg"
                alt="Santo Klemens"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-gold)',
                  boxShadow: '0 0 12px rgba(200,169,110,0.3)',
                }}
              />
              <span>Paroki Santo Klemens</span>
            </div>
            <p>Gereja Santo Martinus</p>
            <p>Jl. Lanud Sepinggan, Balikpapan</p>
            <p>Kalimantan Timur 76115</p>
            <p className="mt-3 text-[0.72rem] text-[rgba(200,169,110,0.5)]">
              Keuskupan Agung Samarinda<br/>Mgr. Yustinus Harjosusanto, MSF
            </p>
          </div>
          <div className="footer-col footer-col-nav">
            <div className="nav-group">
              <h4>Layanan Umat</h4>
              <ul>
                <li><Link href="/user/dashboard">Dashboard</Link></li>
                <li><Link href="/user/pastoral-letters">Surat Pastoral</Link></li>
                <li><Link href="/user/companion">Pendamping Rohani</Link></li>
                <li><Link href="/user/family">Data Keluarga</Link></li>
              </ul>
            </div>
            <div className="nav-group">
              <h4>Informasi</h4>
              <ul>
                <li><Link href="/user/klemen-kerja">Klemen Kerja</Link></li>
                <li><Link href="/user/lingkungan">Lingkungan</Link></li>
                <li><Link href="/user/digital-vault">Digital Vault</Link></li>
                <li><Link href="/marketplace">Pasar Kasih</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-col footer-col-contact">
            <h4>Kontak & Jam Pelayanan</h4>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span>(0542) 865-XXXX</span>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              <span>sekretariat@santoklemens-bpp.or.id</span>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>Sekretariat: Sen–Sab, 08:00–16:00<br/>Pendaftaran Sakramen: Sel & Kam</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <span className="copyright-version">
            &copy; {new Date().getFullYear()} Paroki Santo Klemens Sepinggan. v5.0.0-alpha
          </span>
          <div className="legal-links">
            <a href="#">Kebijakan Privasi</a><span>&bull;</span><a href="#">Dilindungi UU PDP No. 27/2022</a>
          </div>
        </div>
      </footer>
    </>
  );
}