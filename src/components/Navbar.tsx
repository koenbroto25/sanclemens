'use client';

import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = mobileMenuOpen ? '' : 'hidden';
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <a href="/" className="navbar-logo">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zM3 7l9 5 9-5M3 17l9 5 9-5M12 22V7"/>
            </svg>
            <div className="logo-text">
              <span className="logo-name">Paroki Santo Klemens</span>
              <span className="logo-sub">Sepinggan</span>
            </div>
          </a>
          <div className="navbar-nav">
            <a href="#jadwal-misa">Jadwal Misa</a>
            <a href="#warta-paroki">Warta Paroki</a>
            <a href="#bacaan-liturgi">Bacaan Liturgi</a>
            <a href="#kegiatan">Kegiatan</a>
            <a href="#bergabung">Bergabung</a>
          </div>
          <div className="navbar-right">
            {/* Homepage Switcher placeholder */}
            <div className="switcher">
              <div className="switcher-item active" title="Paroki Santo Klemens Sepinggan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zM3 7l9 5 9-5M3 17l9 5 9-5M12 22V7"/>
                </svg>
                <span className="tooltip">Paroki Santo Klemens Sepinggan</span>
              </div>
              <div className="switcher-divider"></div>
              <div className="switcher-item disabled" title="Portal Umat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  <path d="M16 9l-4 4-4-4"/>
                  <path d="M12 17h.01"/>
                </svg>
                <span className="tooltip">Portal Umat</span>
              </div>
            </div>
            <a href="/login" className="btn-login">Masuk</a>
            <a href="/register" className="btn-register">Daftar</a>
          </div>
          <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} id="mobileMenu">
        <nav>
          <a href="#jadwal-misa" onClick={toggleMobileMenu}>Jadwal Misa</a>
          <a href="#warta-paroki" onClick={toggleMobileMenu}>Warta Paroki</a>
          <a href="#bacaan-liturgi" onClick={toggleMobileMenu}>Bacaan Liturgi</a>
          <a href="#kegiatan" onClick={toggleMobileMenu}>Kegiatan</a>
          <a href="#bergabung" onClick={toggleMobileMenu}>Bergabung</a>
        </nav>
        <div className="mobile-switcher mobile-homepage-switcher">
          <div className="mobile-switcher-label">Pilih Halaman</div>
          <div className="mobile-switcher-items">
            <a href="#" className="mobile-switcher-item active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zM3 7l9 5 9-5M3 17l9 5 9-5M12 22V7"/>
              </svg>
              <span>Paroki Santo Klemens Sepinggan</span>
            </a>
            <a href="#" className="mobile-switcher-item disabled">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                <path d="M16 9l-4 4-4-4"/>
                <path d="M12 17h.01"/>
              </svg>
              <span>Portal Umat</span>
            </a>
          </div>
        </div>
        <div className="mobile-auth">
          <a href="/login" className="btn-login" onClick={toggleMobileMenu}>Masuk</a>
          <a href="/register" className="btn-register" onClick={toggleMobileMenu}>Daftar</a>
        </div>
      </div>
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu}></div>
    </>
  );
};

export default Navbar;
