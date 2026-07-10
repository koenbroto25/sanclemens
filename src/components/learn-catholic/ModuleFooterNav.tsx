import Link from 'next/link';
import { ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react';
import type { ModuleItem } from '@/lib/learn-catholic/curriculum';

const MODUL_BASE = '/public/learn-catholic/modul';

export function ModuleFooterNav({
  prev,
  next,
  isLast,
}: {
  prev: ModuleItem | null;
  next: ModuleItem | null;
  isLast: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto pt-10 border-t border-[rgba(200,169,110,0.15)]">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {prev ? (
          <Link
            href={`${MODUL_BASE}/${prev.slug}`}
            className="flex-1 flex items-center gap-3 px-5 py-4 rounded-[4px_20px_4px_20px] bg-white border border-[rgba(200,169,110,0.16)] hover:shadow-[var(--shadow-gold)] transition"
          >
            <ArrowLeft size={18} className="shrink-0" style={{ color: 'var(--color-gold-deep)' }} />
            <div className="min-w-0">
              <div className="text-[0.65rem] uppercase tracking-wide" style={{ color: 'var(--color-stone)' }}>
                Sebelumnya
              </div>
              <div className="font-semibold text-[var(--color-text-dark)] truncate">{prev.title}</div>
            </div>
          </Link>
        ) : (
          <Link
            href="/public/learn-catholic"
            className="flex-1 flex items-center gap-3 px-5 py-4 rounded-[4px_20px_4px_20px] bg-white border border-[rgba(200,169,110,0.16)] hover:shadow-[var(--shadow-gold)] transition"
          >
            <LayoutGrid size={18} className="shrink-0" style={{ color: 'var(--color-gold-deep)' }} />
            <div>
              <div className="text-[0.65rem] uppercase tracking-wide" style={{ color: 'var(--color-stone)' }}>
                Kembali ke
              </div>
              <div className="font-semibold text-[var(--color-text-dark)]">Peta Kurikulum</div>
            </div>
          </Link>
        )}

        {next && (
          <Link
            href={`${MODUL_BASE}/${next.slug}`}
            className="flex-1 flex items-center justify-end gap-3 px-5 py-4 rounded-[4px_20px_4px_20px] text-right bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-deep)] hover:-translate-y-0.5 transition shadow-[var(--shadow-gold)]"
          >
            <div className="min-w-0">
              <div className="text-[0.65rem] uppercase tracking-wide text-[var(--color-cream)] opacity-80">
                Selanjutnya
              </div>
              <div className="font-semibold text-[var(--color-cream)] truncate">{next.title}</div>
            </div>
            <ArrowRight size={18} className="shrink-0 text-[var(--color-cream)]" />
          </Link>
        )}
      </div>

      {isLast && (
        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-stone)' }}>
          Ini modul terakhir dalam kurikulum — lihat perayaan penutup di atas untuk langkah berikutnya.
        </p>
      )}
    </div>
  );
}
