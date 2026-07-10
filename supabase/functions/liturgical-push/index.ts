import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // Prayer reminder times
    const prayerTimes = [
      { hour: 6, minute: 0, name: 'Angelus Pagi', type: 'angelus' },
      { hour: 12, minute: 0, name: 'Angelus Siang', type: 'angelus' },
      { hour: 15, minute: 0, name: 'Doa Kerahiman Ilahi', type: 'divine_mercy' },
    ];

    let sentCount = 0;

    // Check prayer reminders
    for (const prayer of prayerTimes) {
      const prayerTime = prayer.hour * 60 + prayer.minute;
      if (Math.abs(prayerTime - currentTime) <= 5) {
        const { data: prayerPrefs } = await supabase
          .from('user_preferences')
          .select('user_id, prayer_reminder_enabled, prayer_reminder_minutes_before, profiles(id, full_name)')
          .eq('prayer_reminder_enabled', true)
          .not('prayer_reminder_minutes_before', 'is', null);

        if (prayerPrefs && prayerPrefs.length > 0) {
          const notifs: any[] = [];
          for (const pref of prayerPrefs) {
            const reminderTime = prayerTime - (pref.prayer_reminder_minutes_before as number);
            if (Math.abs(reminderTime - currentTime) <= 1) {
              const profile = (pref as any).profiles;
              if (profile) {
                notifs.push({
                  user_id: profile.id,
                  judul: 'Pengingat Doa: ' + prayer.name,
                  pesan: 'Doa ' + prayer.name + ' akan dimulai dalam ' + pref.prayer_reminder_minutes_before + ' menit.',
                  tipe: 'prayer_reminder',
                  related_table: null,
                  scheduled_for: now.toISOString(),
                });
              }
            }
          }
          if (notifs.length > 0) {
            await supabase.from('notifications').insert(notifs);
            sentCount += notifs.length;
          }
        }
        break;
      }
    }

    // Saint day notifications
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateKey = month + '-' + day;

    const { data: saintProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, nama_baptis')
      .not('nama_baptis', 'is', null)
      .eq('status', 'active');

    if (saintProfiles && saintProfiles.length > 0) {
      const saintNotifs: any[] = [];
      for (const profile of saintProfiles) {
        const baptismalName = profile.nama_baptis as string;
        const todaySaints = await getSaintsByDateFromJson(now);
        const matchingSaint = todaySaints.find((s: any) =>
          s.nama.toLowerCase().includes(baptismalName.toLowerCase()) ||
          baptismalName.toLowerCase().includes(s.nama.toLowerCase())
        );

        if (matchingSaint) {
          saintNotifs.push({
            user_id: profile.id,
            judul: 'Hari Raya ' + matchingSaint.nama,
            pesan: 'Selamat memperingati hari raya ' + matchingSaint.nama + ', ' + profile.full_name + '!',
            tipe: 'saint_day',
            related_table: 'profiles',
            scheduled_for: now.toISOString(),
          });
        }
      }

      if (saintNotifs.length > 0) {
        await supabase.from('notifications').insert(saintNotifs);
        sentCount += saintNotifs.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function getSaintsByDateFromJson(date: Date): Promise<any[]> {
  try {
    const response = await fetch('https://raw.githubusercontent.com/ilhamrisky/doa-harian-katolik/main/resources/orangkudus.json');
    const data = await response.json();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = month + '-' + day;
    return data.filter((s: any) => s.tanggal === dateKey);
  } catch (error) {
    console.error('Error fetching saints data:', error);
    return [];
  }
}
