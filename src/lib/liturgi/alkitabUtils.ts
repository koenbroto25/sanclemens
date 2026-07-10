import alkitabData from '@/data/liturgi/kitab.json';

export interface Ayat {
  kitabID: number;
  bab: number;
  ayat: number;
  namaPendek: string;
  namaPanjang: string;
  firman: string;
  judul: string;
  noUrut: number;
}

export function getAyat(kitab: string, pasal: number, ayat: number): Ayat | undefined {
  return (alkitabData as Ayat[]).find((a) =>
    (a.namaPendek.toLowerCase() === kitab.toLowerCase() ||
      a.namaPanjang.toLowerCase() === kitab.toLowerCase()) &&
    a.bab === pasal &&
    a.ayat === ayat
  );
}

export function searchAlkitab(query: string): Ayat[] {
  const lower = query.toLowerCase();
  return (alkitabData as Ayat[]).filter((a) =>
    a.namaPendek.toLowerCase().includes(lower) ||
    a.namaPanjang.toLowerCase().includes(lower) ||
    a.firman.toLowerCase().includes(lower)
  );
}

export function getAyatByKitab(kitab: string): Ayat[] {
  return (alkitabData as Ayat[]).filter((a) =>
    a.namaPendek.toLowerCase() === kitab.toLowerCase() ||
    a.namaPanjang.toLowerCase() === kitab.toLowerCase()
  );
}