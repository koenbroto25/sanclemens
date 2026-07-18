import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

interface LiturgicalDay {
  localDate: string;
  name: string;
  readings: { text: string; url: string }[];
  color: string;
}

async function fetchLiturgicalCalendar(yearMonth: string): Promise<LiturgicalDay[]> {
  const [year, month] = yearMonth.split('-');
  const url = `https://www.imankatolik.or.id/kalender.php?t=${year}&b=${month}`;
  
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const calendarData: LiturgicalDay[] = [];
    
    // The page has table.k_tbl containing td.k_tbl_td cells
    $('table.k_tbl').each((_, table) => {
      $(table).find('td.k_tbl_td').each((_, element) => {
        const date = $(element).find('.k_tgl').text().trim();
        const name = $(element).find('.k_perayaan').text().trim();
        const readingsElements = $(element).find('.k_alkitab a');
        const readings: { text: string; url: string }[] = [];
        
        readingsElements.each((i, el) => {
          const readingText = $(el).text().trim();
          const readingLink = $(el).attr('href');
          if (readingLink) {
            readings.push({
              text: readingText,
              url: readingLink.startsWith('http') ? readingLink : `https://www.imankatolik.or.id${readingLink}`
            });
          }
        });
        
        const color = $(element).find('.k_pakaian').text().replace('Warna Liturgi ', '').trim();
        
        // Only add if we have at least a date or name
        if (date || name) {
          calendarData.push({
            localDate: `${date} ${month} ${year}`,
            name,
            readings,
            color,
          });
        }
      });
    });
    
    return calendarData;
  } catch (error) {
    console.error('Error fetching liturgical calendar:', error);
    return [];
  }
}

function formatDateToISO(localDate: string): string {
  // Input: "17 Juli 2026" or "17 07 2026"
  const months: Record<string, string> = {
    'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
    'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
    'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
  };
  
  const parts = localDate.split(' ');
  if (parts.length === 3) {
    const [day, monthNameOrNum, year] = parts;
    const month = months[monthNameOrNum] || monthNameOrNum;
    return `${year}-${month}-${day.padStart(2, '0')}`;
  }
  return localDate;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      targetDate = new Date();
    }
    
    const yearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    const calendarData = await fetchLiturgicalCalendar(yearMonth);
    
    if (calendarData.length === 0) {
      return NextResponse.json({
        date: targetDate.toISOString().split('T')[0],
        season: 'Unknown',
        color: 'hijau',
        readings: [],
        source: 'external'
      });
    }
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const todayInfo = calendarData.find(item => {
      const itemDate = formatDateToISO(item.localDate);
      return itemDate === targetDateStr;
    });
    
    if (!todayInfo) {
      return NextResponse.json({
        date: targetDateStr,
        season: 'Hari Biasa',
        color: 'hijau',
        readings: [],
        source: 'external'
      });
    }
    
    return NextResponse.json({
      date: targetDateStr,
      season: todayInfo.name,
      color: todayInfo.color.toLowerCase(),
      readings: todayInfo.readings.map(r => r.text),
      source: 'external'
    });
    
  } catch (error) {
    console.error('Error in /api/liturgi/calendar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}