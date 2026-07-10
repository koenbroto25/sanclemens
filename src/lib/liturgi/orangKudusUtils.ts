import orangKudusData from '@/data/liturgi/orangkudus.json';

export interface Saint {
  noID: number;
  tgl: number;
  bulan: number;
  tipe: string;
  nama: string;
  riwayat: string;
}

export function getSaintsByDate(date: Date): Saint[] {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return (orangKudusData as Saint[]).filter((s) => s.bulan === month && s.tgl === day);
}

export function getSaintByName(name: string): Saint | undefined {
  const lower = name.toLowerCase();
  return (orangKudusData as Saint[]).find((s) =>
    s.nama.toLowerCase().includes(lower)
  );
}

export function getAllSaints(): Saint[] {
  return orangKudusData as Saint[];
}