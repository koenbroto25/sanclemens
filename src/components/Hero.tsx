import React from 'react';
import Image from 'next/image';
import gerejaSantoClemens from '../../public/gereja-santo-clemens.jpg'; // Adjust path as needed

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" style={{ position: "relative" }}>
        <Image
          src={gerejaSantoClemens}
          alt="Gereja Santo Klemens Sepinggan"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "50% 25%" }}
          className="filter contrast-[1.15] brightness-[0.78] sepia-[0.30] saturate-[0.80] hue-rotate-[-5deg]"
        />
          sizes="100vw"
        <div className="overlay"></div>
        <div className="grain" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}></div>
      </div>
      <div className="hero-content reveal">
        <p className="hero-eyebrow">
          Selamat Datang
        </p>
        <h1>
          Paroki Santo Klemens Sepinggan
          <br />
          Keuskupan Agung Samarinda
        </h1>
        <p className="max-w-xl text-text-light opacity-80 text-lg mb-8">
          Melayani umat dengan kasih, iman, dan pengharapan dalam semangat kekeluargaan.
        </p>
        <div className="flex gap-4">
          <a href="#jadwal-misa" className="btn-register">Jadwal Misa</a>
          <a href="#bergabung" className="btn-login">Bergabung</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
