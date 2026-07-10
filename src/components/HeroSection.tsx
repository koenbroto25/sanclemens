import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* Background Image with Overlay and Grain */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/gereja katolik santo clemens inside.jpg"
          alt="Gereja Katolik Santo Klemens Sepinggan Inside"
          className="filter contrast-[1.15] brightness-[0.78] sepia-[0.30] saturate-[0.80] hue-rotate-[-5deg]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(26,14,5,0.70)] via-[rgba(26,14,5,0.30)] via-55% to-[rgba(26,14,5,0.85)]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(44,26,14,0.75)] via-[rgba(26,14,5,0.10)] via-50% to-[rgba(44,26,14,0.65)]"></div>
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px'
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pb-24 w-full">
        <div className="max-w-md text-left">
          <p className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 mb-5 flex items-center gap-3">
            <span className="w-8 h-px bg-gold-500 opacity-60"></span>
            Paroki Santo Klemens Sepinggan
          </p>
          <h1 className="font-cormorant-garamond font-light text-[clamp(3rem,6vw,7rem)] leading-[1.05] text-cream-100 mb-6 max-w-lg tracking-[-0.01em]">
            Selamat Datang di<br/>Rumah Kita Bersama
          </h1>
          <p className="font-inter font-light text-sm text-cream-100 opacity-70 leading-relaxed mb-9 max-w-sm">
            Gereja Santo Martinus &middot; Lanud Balikpapan<br/>Keuskupan Agung Samarinda
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="#jadwal-misa" className="font-inter font-medium text-xs tracking-wide uppercase text-primary-500 bg-gold-500 px-8 py-3.5 rounded-sm transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:bg-gold-300 hover:shadow-md flex items-center gap-2 rounded-tl-sm rounded-br-2xl">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h.01M16 11h.01M9 15h.01M15 15h.01M9 19h.01M15 19h.01M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Jadwal Misa Hari Ini
            </Link>
            <Link href="#bergabung" className="font-inter font-medium text-xs tracking-wide uppercase text-cream-100 border border-[rgba(240,235,224,0.35)] px-8 py-3.5 rounded-sm transition-all duration-400 ease-cubic-bezier-0-25-0-46-0-45-0-94 hover:border-cream-100 hover:bg-[rgba(240,235,224,0.08)] rounded-tl-sm rounded-br-2xl">
              Daftar sebagai Umat
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Next Mass Card */}
      <div className="absolute right-10 bottom-24 z-20 bg-[rgba(26,14,5,0.7)] backdrop-blur-md border border-[rgba(200,169,110,0.2)] rounded-tl-sm rounded-br-2xl p-5 max-w-xs">
        <p className="font-inter font-medium text-[0.6rem] tracking-wide uppercase text-gold-500 mb-2">Misa berikutnya</p>
        <p className="font-cormorant-garamond font-semibold text-3xl text-cream-100 leading-tight">18.00 WITA</p>
        <p className="font-inter font-normal text-sm text-cream-100 opacity-70 mt-1">Misa Harian</p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <p className="font-inter font-normal text-xs tracking-wide uppercase text-cream-100 opacity-50">Gulir untuk mengenal kami</p>
        <div className="animate-bounce">
          <svg className="w-4.5 h-4.5 text-gold-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
