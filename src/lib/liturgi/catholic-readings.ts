import { format } from 'date-fns';

interface ReadingRefs {
  date: string;
  first_reading?: string;
  responsorial_psalm?: string;
  second_reading?: string;
  gospel?: string;
}

function parseAelfLectures(lectures: any[]): ReadingRefs {
  const result: ReadingRefs = { date: '' };
  for (const lecture of lectures) {
    // lectures array contains stringified objects, need to parse ref
    let type = '';
    let ref = '';
    if (typeof lecture === 'string') {
      const typeMatch = lecture.match(/type=([^;]+)/);
      const refMatch = lecture.match(/ref=([^;]+)/);
      type = typeMatch ? typeMatch[1].trim() : '';
      ref = refMatch ? refMatch[1].trim() : '';
    } else {
      type = lecture.type || '';
      ref = lecture.ref || '';
    }
    if (type === 'lecture_1') result.first_reading = ref;
    else if (type === 'psaume') result.responsorial_psalm = ref;
    else if (type === 'lecture_2') result.second_reading = ref;
    else if (type === 'evangile') result.gospel = ref;
  }
  return result;
}

export async function fetchReadings(date: Date): Promise<ReadingRefs | null> {
  const formattedDate = format(date, 'yyyy-MM-dd');
  const apiUrl = `https://api.aelf.org/v1/messes/${formattedDate}/france`;

  try {
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      const retry = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
      if (!retry.ok) {
        console.error(`Failed to fetch readings after retry for ${formattedDate}: ${retry.statusText}`);
        return null;
      }
      const retryData = await retry.json();
      return parseAelfResponse(retryData, formattedDate);
    }
    const data = await response.json();
    return parseAelfResponse(data, formattedDate);
  } catch (error) {
    console.error(`Error fetching readings for ${formattedDate}:`, error);
    return null;
  }
}

function parseAelfResponse(data: any, formattedDate: string): ReadingRefs | null {
  try {
    const messe = data?.messes?.[0];
    if (!messe || !messe.lectures) return null;
    const result = parseAelfLectures(messe.lectures);
    result.date = formattedDate;
    return result;
  } catch (e) {
    console.error('Error parsing aelf response:', e);
    return null;
  }
}