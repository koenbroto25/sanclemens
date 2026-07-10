import doaData from '@/data/liturgi/kumpulandoa.json';

export interface Doa {
  doaID: number;
  nama: string;
  urutan: number;
  isiDoa: string;
}

export function getDoaById(id: number): Doa | undefined {
  return (doaData as Doa[]).find((d) => d.doaID === id);
}

export function searchDoa(query: string): Doa[] {
  const lower = query.toLowerCase();
  return (doaData as Doa[]).filter((d) =>
    d.nama.toLowerCase().includes(lower) ||
    d.isiDoa.toLowerCase().includes(lower)
  );
}

export function getAllDoaSorted(): Doa[] {
  return [...(doaData as Doa[])].sort((a, b) => a.urutan - b.urutan);
}