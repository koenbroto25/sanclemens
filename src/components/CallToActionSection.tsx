import React from 'react';
import Link from 'next/link';
import useSectionReveal from '../hooks/useSectionReveal';

const CallToActionSection = () => {
  const addSectionRef = useSectionReveal();

  return (
    <section id="bergabung" className="relative bg-gradient-to-br from-primary-500 to-secondary-500 py-20 px-8 text-center text-cream-100 reveal" ref={addSectionRef}>
      <div className="max-w-4xl mx-auto">
        <p className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 mb-1.5">Bergabunglah dengan Kami</p>
        <h2 className="font-cormorant-garamond font-semibold text-[clamp(2rem,4vw,4rem)] leading-tight mb-4">
          Jadilah Bagian dari<br/>Keluarga Paroki Santo Klemens
        </h2>
        <p className="font-inter font-normal text-sm opacity-70 mb-8">
          Kami mengundang Anda untuk aktif dalam setiap kegiatan dan pelayanan gereja.
          Bersama, kita wujudkan kasih Kristus dalam kehidupan sehari-hari.
        </p>
        <Link href="#" className="inline-flex items-center gap-2 font-inter font-medium text-xs tracking-wide uppercase text-primary-500 bg-gold-500 px-8 py-3.5 rounded-sm transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:bg-gold-300 hover:shadow-md rounded-tl-sm rounded-br-2xl">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 10a4 4 0 01-4 4H3l-1 6h20l-1-6h-7a4 4 0 01-4-4z"></path></svg>
          Daftar Sekarang
        </Link>
      </div>
    </section>
  );
};

export default CallToActionSection;
