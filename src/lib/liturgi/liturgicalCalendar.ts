/**
 * Liturgical Calendar Utilities
 * Sumber data: https://litcal.johnromanodorazio.com (via API proxy internal)
 */

export interface LiturgicalInfo {
  celebration: string;
  color: string;
  liturgicalRank?: string;
  season?: string;
}

const COLOR_LABEL: Record<string, string> = {
  green:  'Hijau',
  white:  'Putih',
  red:    'Merah',
  purple: 'Ungu',
  rose:   'Rosa',
  gold:   'Emas',
};

const COLOR_HEX: Record<string, string> = {
  Hijau: '#4a8c5c',
  Putih: '#f0ebe0',
  Merah: '#8b2635',
  Ungu:  '#6b4c8a',
  Rosa:  '#e8a0b0',
  Emas:  '#c8a96e',
};

export async function getTodayLiturgicalInfo(
  timezone: string = 'Asia/Makassar'
): Promise<LiturgicalInfo> {
  try {
    const res = await fetch('/api/liturgi/calendar', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const litcal: Array<{
      date: string;
      name: string;
      color: string[];
      liturgical_season?: string;
      grade?: number;
    }> = data?.litcal || [];

    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD

    // Filter events for today, pick highest grade (lowest number = highest rank)
    const todayEvents = litcal.filter(e => e.date.startsWith(today));
    if (todayEvents.length === 0) {
      return { celebration: 'Masa Biasa', color: 'Hijau', season: 'Biasa' };
    }

    const main = todayEvents.reduce((a, b) => ((a.grade ?? 99) <= (b.grade ?? 99) ? a : b));
    const colorKey = (main.color?.[0] || 'green').toLowerCase();

    return {
      celebration: main.name || 'Masa Biasa',
      color: COLOR_LABEL[colorKey] || 'Hijau',
      season: main.liturgical_season || '',
    };
  } catch (error) {
    console.error('Error getting liturgical info:', error);
    return { celebration: 'Masa Biasa', color: 'Hijau', season: 'Biasa' };
  }
}

export function getLiturgicalColorHex(colorName: string): string {
  return COLOR_HEX[colorName] || '#c8a96e';
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyLiturgicalTheme(info: LiturgicalInfo): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const hex = getLiturgicalColorHex(info.color);
  root.style.setProperty('--liturgi-current', hex);
  root.style.setProperty('--liturgi-current-soft', hexToRgba(hex, 0.12));
}
