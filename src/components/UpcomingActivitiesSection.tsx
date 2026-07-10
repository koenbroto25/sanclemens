import React from 'react';
import Link from 'next/link';
import useSectionReveal from '../hooks/useSectionReveal';

// Placeholder data for upcoming activities
const upcomingActivities = [
  {
    date: "10 Juni",
    title: "Retret Pemuda Katolik",
    time: "19.00 WITA",
    location: "Aula Paroki",
    icon: "church",
  },
  {
    date: "15 Juni",
    title: "Kunjungan Kasih Lansia",
    time: "09.00 WITA",
    location: "Lingkungan St. Monica",
    icon: "heart",
  },
  {
    date: "20 Juni",
    title: "Katekese Calon Krisma",
    time: "17.00 WITA",
    location: "Gedung Pastoral",
    icon: "book",
  },
  {
    date: "25 Juni",
    title: "Latihan Koor Mingguan",
    time: "19.30 WITA",
    location: "Gereja Santo Martinus",
    icon: "music",
  },
  {
    date: "30 Juni",
    title: "Pesta Nama Santo Petrus & Paulus",
    time: "18.00 WITA",
    location: "Gereja Santo Martinus",
    icon: "cross",
  },
];

const UpcomingActivitiesSection = () => {
  const addSectionRef = useSectionReveal();

  return (
    <section id="kegiatan" className="relative bg-cream-100 py-20 px-8 reveal" ref={addSectionRef}>
      <div className="max-w-6xl mx-auto">
        <p className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 text-center mb-1.5">Aktivitas Kami</p>
        <h2 className="font-cormorant-garamond font-semibold text-[clamp(2rem,3.5vw,3rem)] text-center text-text-dark-100 mb-1.5">Kegiatan Mendatang</h2>
        <p className="font-inter font-normal text-sm text-stone-500 text-center mb-1.5">Jangan lewatkan kegiatan rohani dan sosial di paroki.</p>

        {/* Ornament Divider */}
        <div className="flex items-center justify-center gap-4 mx-auto my-8 max-w-sm">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 7H7M17 12H7M17 17H7"></path></svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold-500 to-transparent"></div>
        </div>

        {/* Activities Timeline */}
        <div className="flex overflow-x-auto snap-x snap-mandatory py-4 gap-6 scrollbar-hide">
          {upcomingActivities.map((activity, index) => (
            <div key={index} className="flex-none w-72 snap-center bg-white border border-[rgba(200,169,110,0.1)] rounded-tl-sm rounded-br-2xl p-6 shadow-sm transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:translate-y-[-3px] hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-gold-500 rounded-full text-primary-500">
                  {activity.icon === "church" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20M17 7H7M17 12H7M17 17H7"></path></svg>
                  )}
                  {activity.icon === "heart" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  )}
                  {activity.icon === "book" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"></path></svg>
                  )}
                  {activity.icon === "music" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v14m-6 0v-4"></path></svg>
                  )}
                  {activity.icon === "cross" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  )}
                </div>
                <p className="font-inter font-medium text-xs tracking-wider uppercase text-stone-500">{activity.date}</p>
              </div>
              <h3 className="font-cormorant-garamond font-semibold text-lg text-text-dark-100 mb-2">{activity.title}</h3>
              <p className="font-inter font-normal text-sm text-stone-500 mb-1">{activity.time}</p>
              <p className="font-inter font-normal text-xs text-stone-500 opacity-80">{activity.location}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="#" className="inline-flex items-center gap-2 font-inter font-medium text-xs tracking-wide uppercase text-gold-500 mt-8 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:text-gold-300">
            Lihat Semua Kegiatan
            <svg className="w-3.5 h-3.5 transition-transform duration-300 ease-linear" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UpcomingActivitiesSection;
