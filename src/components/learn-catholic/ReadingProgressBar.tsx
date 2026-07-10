'use client';

import { useEffect, useState } from 'react';

/** Garis tipis di paling atas viewport yang terisi sesuai progres scroll
 *  membaca modul — memberi rasa "sudah sejauh mana" tanpa mengganggu. */
export function ReadingProgressBar() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setPercent(Math.min(100, Math.max(0, pct)));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-[3px] bg-transparent">
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{ width: `${percent}%`, background: 'var(--color-gold)' }}
      />
    </div>
  );
}
