import { NextRequest, NextResponse } from 'next/server';

let saintsData: any[] | null = null;

async function loadSaintsData(): Promise<any[]> {
  if (saintsData) return saintsData;
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'Doa-Harian-Katolik-main', 'Doa-Harian-Katolik-main', 'resources', 'orangkudus.json');
    const data = fs.readFileSync(filePath, 'utf8');
    saintsData = JSON.parse(data);
    return saintsData ?? [];
  } catch (error) {
    console.error('Error loading orangkudus.json:', error);
    return [];
  }
}

function getTodayDate(): { day: number; month: number } {
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1, // 1-12
  };
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const saints = await loadSaintsData();
    const { day, month } = getTodayDate();
    
    // Filter saints for today
    const todaySaints = saints.filter((saint: any) => 
      saint.tgl === day && saint.bulan === month
    );
    
    // Format response
    const formattedSaints = todaySaints.map((saint: any) => ({
      nama: saint.nama,
      tipe: saint.tipe || 'Orang Kudus',
      riwayat: saint.riwayat,
    }));
    
    return NextResponse.json({
      date: `${day} ${new Date().toLocaleDateString('id-ID', { month: 'long' })}`,
      saints: formattedSaints,
    });
    
  } catch (error) {
    console.error('Error in /api/liturgi/saints:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}