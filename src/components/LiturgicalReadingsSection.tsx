import React from 'react';
import useSectionReveal from '../hooks/useSectionReveal';

// Placeholder data for liturgical readings
const liturgicalReadings = {
  date: "Kamis, 6 Juni 2026",
  season: "Pekan Biasa X",
  liturgicalColor: "Hijau",
  firstReading: {
    reference: "1 Raj 17:7-16",
    text: "Demikianlah Elia pergi dan melakukan seperti firman Tuhan; ia pergi ke Zarfat dan tinggal di sana. Ketika ia sampai ke pintu gerbang kota itu, tampaklah di sana seorang janda sedang mengumpulkan kayu api. Elia memanggil perempuan itu dan berkata: 'Cobalah ambil bagiku sedikit air dalam kendi, supaya aku minum.' Ketika perempuan itu pergi mengambilnya, Elia berseru lagi kepadanya: 'Dan bawakanlah juga bagiku sekerat roti.' Perempuan itu menjawab: 'Demi Tuhan, Allahmu yang hidup, sesungguhnya tidak ada roti padaku sedikit pun, kecuali segenggam tepung dalam tempayan dan sedikit minyak dalam buli-buli. Dan sekarang aku sedang mengumpulkan dua potong kayu api, kemudian aku hendak pulang dan mengolahnya bagiku dan bagi anakku, dan sesudah itu kami akan memakannya, lalu mati.' Tetapi Elia berkata kepadanya: 'Janganlah takut, pulanglah, buatlah seperti yang kaukatakan, tetapi buatlah lebih dahulu bagiku sepotong roti bundar kecil dari padanya, dan bawalah kepadaku, kemudian barulah kaubuat bagimu dan bagi anakmu. Sebab beginilah firman Tuhan, Allah Israel: Tepung dalam tempayan tidak akan habis dan minyak dalam buli-buli pun tidak akan berkurang, sampai pada hari Tuhan menurunkan hujan ke atas muka bumi.' Lalu perempuan itu pergi dan melakukan seperti perkataan Elia; maka perempuan itu dan dia serta anak-anaknya hidup dari persediaan itu beberapa waktu lamanya. Tepung dalam tempayan itu tidak habis dan minyak dalam buli-buli itu tidak berkurang seperti firman Tuhan yang diucapkan-Nya dengan perantaraan Elia.",
  },
  gospel: {
    reference: "Mat 5:13-16",
    text: "Yesus bersabda kepada murid-murid-Nya: 'Kamulah garam dunia. Jika garam itu menjadi tawar, dengan apakah ia diasinkan? Tidak ada lagi gunanya selain dibuang dan diinjak orang. Kamulah terang dunia. Kota yang terletak di atas gunung tidak mungkin tersembunyi. Lagipula orang tidak menyalakan pelita lalu meletakkannya di bawah gantang, melainkan di atas kaki dian sehingga menerangi semua orang di dalam rumah itu. Demikianlah hendaknya terangmu bercahaya di depan orang, supaya mereka melihat perbuatanmu yang baik dan memuliakan Bapamu yang di surga.'",
  },
};

const LiturgicalReadingsSection = () => {
  const addSectionRef = useSectionReveal();

  return (
    <section id="bacaan-liturgi" className="relative bg-cream-100 py-20 px-8 reveal" ref={addSectionRef}>
      <div className="max-w-4xl mx-auto">
        <p className="font-inter font-medium text-xs tracking-wider uppercase text-gold-500 text-center mb-1.5">Sabda Tuhan</p>
        <h2 className="font-cormorant-garamond font-semibold text-[clamp(2rem,3.5vw,3rem)] text-center text-text-dark-100 mb-1.5">Bacaan Liturgi Harian</h2>
        <p className="font-inter font-normal text-sm text-stone-500 text-center mb-1.5">Renungkan Sabda Tuhan hari ini.</p>

        {/* Ornament Divider */}
        <div className="flex items-center justify-center gap-4 mx-auto my-8 max-w-sm">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 7H7M17 12H7M17 17H7"></path></svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold-500 to-transparent"></div>
        </div>

        <div className="text-center mb-12">
          <p className="font-inter font-medium text-sm text-text-dark-100">{liturgicalReadings.date}</p>
          <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
            <span className="font-inter font-medium text-xs tracking-tight uppercase text-stone-500 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${liturgicalReadings.liturgicalColor === 'Hijau' ? 'bg-[#4a8c5c]' : ''}`}></span>
              {liturgicalReadings.season}
            </span>
            <span className="font-inter font-medium text-xs tracking-tight uppercase text-stone-500 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${liturgicalReadings.liturgicalColor === 'Hijau' ? 'bg-[#4a8c5c]' : ''}`}></span>
              Warna Liturgi: {liturgicalReadings.liturgicalColor}
            </span>
          </div>
        </div>

        {/* Manuscript Style Card */}
        <div className="bg-white rounded-tl-sm rounded-br-2xl p-12 shadow-md relative border border-[rgba(200,169,110,0.1)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-500 to-transparent rounded-tl-sm"></div> {/* Gold line */}
          
          <h3 className="font-cormorant-garamond font-bold text-xl text-text-dark-100 mb-6">{liturgicalReadings.firstReading.reference}</h3>
          <p className="font-merriweather text-base leading-loose text-text-dark-100 mb-8 first-letter:float-left first-letter:font-cormorant-garamond first-letter:font-bold first-letter:text-5xl first-letter:leading-none first-letter:mr-3 first-letter:text-gold-500">
            {liturgicalReadings.firstReading.text}
          </p>

          <h3 className="font-cormorant-garamond font-bold text-xl text-text-dark-100 mb-6">{liturgicalReadings.gospel.reference}</h3>
          <p className="font-merriweather italic text-lg leading-loose text-text-dark-100">
            {liturgicalReadings.gospel.text}
          </p>
        </div>
      </div>
    </section>
  );
};

export default LiturgicalReadingsSection;
