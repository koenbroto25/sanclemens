/**
 * Bot Redirection Rules Hook
 * Implements redirection logic for all bots based on qna_hub_v6.md Â§3
 * Ensures redirection happens without LLM call (Orchestrator layer)
 */

import { useMemo } from 'react';

interface RedirectionRule {
  trigger: (query: string, userAccessLevel: number) => boolean;
  redirectTo: string;
  message: string;
}

function getRedirectionRules(botId: string, userAccessLevel: number): RedirectionRule[] {
  return (() => {
    // Base rules for all bots
    const baseRules: RedirectionRule[] = [
      // Theology/Spiritual guidance â†’ Bot 3 or Bot 8
      {
        trigger: (query) => /sakramen|eukarist|krisma|baptis|nikah|doa|rohani|iman|gospel|alkitab|katekismus|kgk|khk|paus|vatican|teologi|ajaran/i.test(query),
        redirectTo: botId === 'bot_1' || botId === 'bot_7' ? 'bot_8' : 'bot_3',
        message: 'Untuk pertanyaan iman dan ajaran Gereja, saya arahkan Anda ke fitur Learn Catholic kami. Klik di sini untuk membuka.'
      },
      // Business/Work â†’ Bot 7
      {
        trigger: (query) => /cari|jual|beli|usaha|tukang|bengkel|katering|lowongan|kerja|karier|skill|keahlian|jasa|toko|produk/i.test(query),
        redirectTo: 'bot_7',
        message: 'Untuk mencari usaha atau lowongan kerja, silakan gunakan fitur Pasar Kasih kami.'
      },
      // Family data â†’ Bot 6
      {
        trigger: (query) => /keluarga|kk|kartu|domisili|surat|anggota|saudara/i.test(query),
        redirectTo: 'bot_6',
        message: 'Untuk data keluarga Katolik, silakan gunakan fitur Klemen Keluarga.'
      },
      // Parish admin â†’ Bot 2 or Bot 4
      {
        trigger: (query) => /prosedur|administrasi|sekretariat|surat|kegiatan|jadwal|warta/i.test(query),
        redirectTo: userAccessLevel >= 5 ? 'bot_4' : 'bot_2',
        message: userAccessLevel >= 5 
          ? 'Untuk urusan DPP, silakan hubungi Bot Asisten DPP.'
          : 'Untuk informasi prosedur, silakan hubungi Sekretariat Paroki.'
      }
    ];

    // Bot-specific rules
    switch (botId) {
      case 'bot_1': // Klemen Penjaga Pintu - homepage
        return baseRules;

      case 'bot_3': // Companion Rohani - no cross-domain except charity_social
        return [
          {
            trigger: (query) => /cari (kerja|pekerjaan|lowongan)|butuh (kerja|pekerjaan)|mencari (kerja|pekerjaan)/i.test(query),
            redirectTo: 'bot_7',
            message: 'Untuk kebutuhan pekerjaan atau usaha, silakan gunakan fitur Klemen Kerja di menu utama.'
          }
        ];

      case 'bot_5': // Bot Lingkungan
        return [
          {
            trigger: (query, level) => /prosedur|kebijakan|dpd|paroki/i.test(query) && level >= 5,
            redirectTo: 'bot_4',
            message: 'Untuk urusan DPP, silakan hubungi Bot Asisten DPP.'
          },
          ...baseRules
        ];

      case 'bot_6': // Bot Keluarga
        return [
          {
            trigger: (query) => /prosedur|administrasi|sekretariat|surat baptis|surat nikah/i.test(query),
            redirectTo: 'bot_2',
            message: 'Untuk informasi prosedur, silakan gunakan Bot CS Sekretariat.'
          },
          ...baseRules
        ];

      case 'bot_7': // Bot Klemen Kerja / Pasar Kasih
        return [
          {
            trigger: (query) => /doa|rohani|iman|teologi|kgk|khk/i.test(query),
            redirectTo: 'bot_8',
            message: 'Untuk pertanyaan iman, silakan gunakan fitur Learn Catholic.'
          },
          {
            trigger: (query) => /pendampingan|konseling|darurat rohani|krisis/i.test(query),
            redirectTo: 'bot_3',
            message: 'Untuk pendampingan rohani, silakan login dan gunakan fitur Companion Rohani.'
          }
        ];

      case 'bot_8': // Learn Catholic
        return [
          {
            trigger: (query) => /cari kerja|lowongan|usaha|jual|beli|tukang/i.test(query),
            redirectTo: 'bot_7',
            message: 'Untuk informasi usaha dan lowongan, silakan gunakan fitur Pasar Kasih.'
          },
          {
            trigger: (query, level) => /pendampingan|konseling|darurat|krisis emosional/i.test(query) && level >= 2,
            redirectTo: 'bot_3',
            message: 'Untuk pendampingan rohani yang lebih personal, Anda bisa menggunakan fitur Companion Rohani.'
          }
        ];

      default:
        return [];
    }
  })();
}

export function checkBotRedirection(botId: string, query: string, userAccessLevel: number): { botId: string; message: string } | null {
  const rules = getRedirectionRules(botId, userAccessLevel);
  for (const rule of rules) {
    if (rule.trigger(query, userAccessLevel)) {
      return {
        botId: rule.redirectTo,
        message: rule.message
      };
    }
  }
  return null;
}

export function useBotRedirection(botId: string, userAccessLevel: number) {
  const rules = useMemo(() => getRedirectionRules(botId, userAccessLevel), [botId, userAccessLevel]);
  const checkRedirection = (query: string) => checkBotRedirection(botId, query, userAccessLevel);

  return {
    rules,
    checkRedirection
  };
}

/**
 * Get bot display name by bot_id
 */
export function getBotDisplayName(botId: string): string {
  const botNames: Record<string, string> = {
    bot_1: 'Klemen Penjaga Pintu',
    bot_2: 'Bot CS Sekretariat',
    bot_3: 'Bot Companion Rohani',
    bot_4: 'Bot Asisten DPP',
    bot_5: 'Bot Lingkungan',
    bot_6: 'Bot Klemen Keluarga',
    bot_7: 'Bot Klemen Kerja (Pasar Kasih)',
    bot_8: 'Bot Learn Catholic',
    bot_pastor: 'Bot Pastor',
    bot_superadmin: 'Bot Super Admin'
  };

  return botNames[botId] || 'AI Assistant';
}