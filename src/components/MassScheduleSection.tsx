import React from 'react';
import Link from 'next/link';
import useSectionReveal from '../hooks/useSectionReveal';

// Placeholder data for mass schedule
const massSchedules = [
  {
    dayLabel: "HARI INI",
    dayName: "Kamis, 6 Juni",
    isToday: true,
    masses: [
      { time: "06.00 WITA", name: "Misa Harian", location: "Gereja Santo Martinus" },
      { time: "18.00 WITA", name: "Misa Jumat Pertama", location: "Gereja Santo Martinus" },
    ],
  },
  {
    dayLabel: "BESOK",
    dayName: "Jumat, 7 Juni",
    isToday: false,
    masses: [
      { time: "06.00 WITA", name: "Misa Harian", location: "Gereja Santo Martinus" },
    ],
  },
  {
    dayLabel: "SABTU",
    dayName: "Sabtu, 8 Juni",
    isToday: false,
    masses: [
      { time: "18.00 WITA", name: "Misa Vigili Minggu", location: "Gereja Santo Martinus" },
    ],
  },
  {
    dayLabel: "MINGGU",
    dayName: "Minggu, 9 Juni",
    isToday: false,
    masses: [
      { time: "08.00 WITA", name: "Misa Raya", location: "Gereja Santo Martinus" },
      { time: "10.00 WITA", name: "Misa Anak-anak", location: "Gereja Santo Martinus" },
    ],
  },
];

const MassScheduleSection = () => {
  const addSectionRef = useSectionReveal();

  return (
    <section id="jadwal-misa" className="relative bg-cream-100 py-20 px-8 reveal" ref={addSectionRef}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,169,110,0.3)] to-transparent"></div>
      <div className="max-w-6xl mx-auto">
        <p className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 text-center mb-1.5">Jadwal Kami</p>
        <h2 className="font-cormorant-garamond font-semibold text-[clamp(2rem,3.5vw,3rem)] text-center text-text-dark-100 mb-1.5">Jadwal Misa Mingguan</h2>
        <p className="font-inter font-normal text-sm text-stone-500 text-center mb-1.5">Lihat jadwal misa harian dan mingguan paroki kami.</p>

        {/* Ornament Divider */}
        <div className="flex items-center justify-center gap-4 mx-auto my-8 max-w-sm">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 7H7M17 12H7M17 17H7"></path></svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold-500 to-transparent"></div>
        </div>

        {/* Misa Tabs (Placeholder) */}
        <div className="flex justify-center gap-1 mx-auto my-8 bg-[rgba(26,14,5,0.05)] rounded-full p-1 max-w-lg">
          <button className="font-inter font-medium text-xs tracking-tight uppercase px-4 py-2 rounded-full text-gold-500 bg-primary-500 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94">Harian</button>
          <button className="font-inter font-medium text-xs tracking-tight uppercase px-4 py-2 rounded-full text-stone-500 hover:text-text-dark-100 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94">Mingguan</button>
          <button className="font-inter font-medium text-xs tracking-tight uppercase px-4 py-2 rounded-full text-stone-500 hover:text-text-dark-100 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94">Bulanan</button>
        </div>

        {/* Misa Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {massSchedules.map((day, index) => (
            <div key={index} className={`relative bg-white border border-[rgba(200,169,110,0.1)] rounded-tl-sm rounded-br-2xl p-6 transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:translate-y-[-3px] hover:shadow-md ${day.isToday ? 'border-gold-500 bg-gradient-to-br from-white to-cream-100 shadow-lg' : ''}`}>
              {day.isToday && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-glass-red"></div>}
              <p className={`font-inter font-semibold text-[0.65rem] tracking-wider uppercase mb-3 ${day.isToday ? 'text-gold-500' : 'text-stone-500'}`}>{day.dayLabel}</p>
              <h3 className="font-cormorant-garamond font-semibold text-lg text-text-dark-100 mb-3">{day.dayName}</h3>
              {day.masses.map((mass, massIndex) => (
                <div key={massIndex} className={`mb-3 pb-3 ${massIndex < day.masses.length - 1 ? 'border-b border-[rgba(26,14,5,0.06)]' : ''}`}>
                  <p className="font-cormorant-garamond font-medium text-base text-glass-red mb-0.5">{mass.time}</p>
                  <p className="font-inter font-normal text-sm text-text-dark-100 leading-snug">{mass.name}</p>
                  <p className="font-inter font-normal text-xs text-stone-500 mt-0.5">{mass.location}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Liturgi Widget (Placeholder) */}
        <div className="flex items-center justify-end gap-2 font-inter text-xs text-stone-500">
          <span className="w-2.5 h-2.5 rounded-full border border-[rgba(0,0,0,0.15)] bg-[#4a8c5c]"></span>
          <p>Musim Liturgi: Hijau</p>
        </div>
      </div>
    </section>
  );
};

export default MassScheduleSection;
