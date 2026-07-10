import React from 'react';
import Link from 'next/link';
import useSectionReveal from '../hooks/useSectionReveal';

// Placeholder data for parish announcements
const announcements = [
  {
    date: "24 MEI 2026",
    title: "Pelantikan Pengurus Lingkungan & Kunjungan Pastoral",
    excerpt: "Sebanyak 17 lingkungan di Paroki Santo Klemens Sepinggan telah melaksanakan pelantikan pengurus baru untuk masa bakti 2026-2029...",
    category: "kegiatan",
    isMain: true,
  },
  {
    date: "22 MEI 2026",
    title: "Pendaftaran Baptis Bayi dan Anak",
    excerpt: "Persiapkan anak Anda untuk menerima Sakramen Baptis. Pendaftaran dibuka hingga 30 Juni 2026...",
    category: "liturgi",
    isMain: false,
  },
  {
    date: "19 MEI 2026",
    title: "Aksi Sosial: Donor Darah Rutin Paroki",
    excerpt: "Mari bersama berpartisipasi dalam aksi donor darah rutin. Setetes darah Anda sangat berarti...",
    category: "sosial",
    isMain: false,
  },
];

const ParishAnnouncementsSection = () => {
  const addSectionRef = useSectionReveal();

  return (
    <section id="warta-paroki" className="relative bg-primary-500 py-20 px-8 overflow-hidden reveal" ref={addSectionRef}>
      {/* Background Noise */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8a96e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <p className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 text-center mb-1.5">Warta Paroki</p>
        <h2 className="font-cormorant-garamond font-semibold text-[clamp(2rem,3.5vw,3rem)] text-center text-cream-100 mb-1.5">Pengumuman & Berita Terbaru</h2>
        <p className="font-inter font-normal text-sm text-stone-500 text-center mb-1.5">Ikuti perkembangan terkini paroki kami.</p>

        {/* Ornament Divider */}
        <div className="flex items-center justify-center gap-4 mx-auto my-8 max-w-sm">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 7H7M17 12H7M17 17H7"></path></svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold-500 to-transparent"></div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">
          <div className="flex flex-col">
            {announcements.filter(a => a.isMain).map((announcement, index) => (
              <Link href="#" key={index} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(200,169,110,0.1)] rounded-tl-sm rounded-br-2xl p-7 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(200,169,110,0.2)] hover:translate-y-[-2px]">
                <p className="font-inter font-medium text-[0.6rem] tracking-wider uppercase text-stone-500 mb-3">{announcement.date}</p>
                <h3 className="font-cormorant-garamond font-semibold text-xl text-cream-100 mb-3 leading-tight">{announcement.title}</h3>
                <p className="font-inter font-normal text-sm text-[rgba(240,235,224,0.6)] leading-relaxed mb-4 line-clamp-3">{announcement.excerpt}</p>
                <span className={`font-inter font-medium text-[0.6rem] tracking-wide uppercase px-3 py-1 rounded-full ${
                  announcement.category === 'liturgi' ? 'bg-[rgba(74,107,138,0.2)] text-glass-blue' :
                  announcement.category === 'kegiatan' ? 'bg-[rgba(139,38,53,0.2)] text-[#d4758a]' :
                  'bg-[rgba(200,169,110,0.15)] text-gold-500'
                }`}>{announcement.category}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-5">
            {announcements.filter(a => !a.isMain).map((announcement, index) => (
              <Link href="#" key={index} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(200,169,110,0.1)] rounded-tl-sm rounded-br-2xl p-7 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(200,169,110,0.2)] hover:translate-y-[-2px]">
                <p className="font-inter font-medium text-[0.6rem] tracking-wider uppercase text-stone-500 mb-3">{announcement.date}</p>
                <h3 className="font-cormorant-garamond font-semibold text-lg text-cream-100 mb-3 leading-tight">{announcement.title}</h3>
                <p className="font-inter font-normal text-sm text-[rgba(240,235,224,0.6)] leading-relaxed mb-4 line-clamp-2">{announcement.excerpt}</p>
                <span className={`font-inter font-medium text-[0.6rem] tracking-wide uppercase px-3 py-1 rounded-full ${
                  announcement.category === 'liturgi' ? 'bg-[rgba(74,107,138,0.2)] text-glass-blue' :
                  announcement.category === 'kegiatan' ? 'bg-[rgba(139,38,53,0.2)] text-[#d4758a]' :
                  'bg-[rgba(200,169,110,0.15)] text-gold-500'
                }`}>{announcement.category}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="#" className="inline-flex items-center gap-2 font-inter font-medium text-xs tracking-wide uppercase text-gold-500 mt-8 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:text-gold-300">
            Lihat Semua Warta
            <svg className="w-3.5 h-3.5 transition-transform duration-300 ease-linear" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ParishAnnouncementsSection;
