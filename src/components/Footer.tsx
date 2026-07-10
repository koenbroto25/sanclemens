import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-primary-500 text-cream-100 py-16 px-8 text-sm reveal">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-[rgba(200,169,110,0.1)] pb-12 mb-12">
        {/* Column 1: Logo & Address */}
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="font-cormorant-garamond font-medium text-lg text-gold-500 tracking-wide">Paroki St. Klemens</span>
              <span className="font-inter font-normal text-xs text-stone-500 tracking-wider uppercase mt-px">Sepinggan</span>
            </div>
          </Link>
          <p className="font-inter text-stone-300 leading-relaxed max-w-xs">
            Gereja Santo Martinus Lanud Balikpapan<br/>
            Jl. Marsma R. Iswahyudi No.57<br/>
            Sepinggan, Balikpapan Selatan<br/>
            Kota Balikpapan, Kalimantan Timur 76115
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 mb-6">Tautan Cepat</h3>
          <ul className="space-y-3 font-inter text-stone-300">
            <li><Link href="#jadwal-misa" className="hover:text-cream-100 transition-colors duration-200">Jadwal Misa</Link></li>
            <li><Link href="#warta-paroki" className="hover:text-cream-100 transition-colors duration-200">Warta Paroki</Link></li>
            <li><Link href="#bacaan-liturgi" className="hover:text-cream-100 transition-colors duration-200">Bacaan Liturgi</Link></li>
            <li><Link href="#kegiatan" className="hover:text-cream-100 transition-colors duration-200">Kegiatan</Link></li>
            <li><Link href="#bergabung" className="hover:text-cream-100 transition-colors duration-200">Daftar Umat</Link></li>
          </ul>
        </div>

        {/* Column 3: Contact & Social */}
        <div>
          <h3 className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 mb-6">Hubungi Kami</h3>
          <ul className="space-y-3 font-inter text-stone-300 mb-8">
            <li><a href="tel:+62542761234" className="hover:text-cream-100 transition-colors duration-200">+62 542 761234</a></li>
            <li><a href="mailto:sekretariat@parokiklemens.org" className="hover:text-cream-100 transition-colors duration-200">sekretariat@parokiklemens.org</a></li>
          </ul>
          <h3 className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 mb-6">Ikuti Kami</h3>
          <div className="flex space-x-4">
            <a href="#" aria-label="Facebook" className="text-stone-300 hover:text-cream-100 transition-colors duration-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885V2H9v6z"/></svg>
            </a>
            <a href="#" aria-label="Instagram" className="text-stone-300 hover:text-cream-100 transition-colors duration-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2.7h.4c-.1 0-.2.1-.2.2V16.2c0 .1.1.2.2.2h8.4c.1 0 .2-.1.2-.2V7.8c0-.1-.1-.2-.2-.2H7.6c-.1 0-.2.1-.2.2v8.4c0 .1.1.2.2.2zM12 9c-1.6 0-3 1.4-3 3s1.4 3 3 3 3-1.4 3-3-1.4-3-3-3zm0 4.8c-.9 0-1.8-.9-1.8-1.8s.9-1.8 1.8-1.8 1.8.9 1.8 1.8-.9 1.8-1.8 1.8zM17.2 6.5h.01c.2 0 .3-.1.3-.3V6.2c0-.2-.1-.3-.3-.3h-.01c-.2 0-.3.1-.3.3v.01c0 .2.1.3.3.3z"/></svg>
            </a>
            <a href="#" aria-label="YouTube" className="text-stone-300 hover:text-cream-100 transition-colors duration-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.618 5.257c.395-.14 2.126-.523 2.924-.764.798-.242 1.348-.68 1.458-.813.11-.133.195-.333.195-.546s-.085-.413-.195-.546c-.11-.133-.66-.571-1.458-.813-.798-.242-2.529-.624-2.924-.764C18.257 2 17.067 2 12 2S5.743 2 4.382 2.257c-.395.14-2.126.523-2.924.764-.798.242-1.348.68-1.458.813-.11.133-.195.333-.195.546s.085.413.195.546c.11.133.66.571 1.458.813.798.242 2.529.624 2.924.764C5.743 7 7.067 7 12 7s6.257-.001 7.618-1.743zM2 12c0 1.25.1 2.25.3 3.01.2 1.01.7 1.7 1.5 2.25.8.55 1.8.74 3.4.74h1.8c.25 0 .5-.02.75-.04l.25-.01c.25 0 .5.01.75.01h1.5c.25 0 .5-.01.75-.01l.25.01c.25.02.5.04.75.04h1.8c1.6 0 2.6-.19 3.4-.74.8-.55 1.3-1.24 1.5-2.25.2-.76.3-1.76.3-3.01s-.1-2.25-.3-3.01c-.2-1.01-.7-1.7-1.5-2.25-.8-.55-1.8-.74-3.4-.74h-1.8c-.25 0-.5.02-.75.04l-.25.01c-.25 0-.5-.01-.75-.01h-1.5c-.25 0-.5.01-.75.01l-.25-.01c-.25-.02-.5-.04-.75-.04H7.8c-1.6 0-2.6.19-3.4.74-.8.55-1.3 1.24-1.5 2.25-.2.76-.3 1.76-.3 3.01z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="text-center text-stone-500 font-inter text-xs">
        <p>&copy; {new Date().getFullYear()} Paroki Santo Klemens Sepinggan. Hak Cipta Dilindungi.</p>
        <p className="mt-1">Melindungi Data Pribadi Anda Sesuai Undang-Undang PDP No. 27 Tahun 2022.</p>
        <p className="mt-1">Powered by <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-300">Vercel</a>.</p>
        <Link href="https://keuskupanagungsamarinda.org" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-300 mt-2 block">
          Keuskupan Agung Samarinda
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
