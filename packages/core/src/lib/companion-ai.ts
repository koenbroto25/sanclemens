// packages/core/src/lib/companion-ai.ts

// Placeholder for vulnerability detection logic
export function detectVulnerability(message: string): boolean {
    const vulnerableKeywords = [
        'cemas', 'sedih', 'khawatir', 'putus asa', 'sendiri', 'takut', 'marah', 'frustrasi',
        'sulit', 'masalah', 'krisis', 'berat', 'menyerah', 'depresi', 'stres',
        'bunuh diri', 'menyakiti diri', 'tidak berguna', 'capek hidup', 'udahan', 'pasrah',
        'beban', 'tertekan', 'gelisah', 'bingung', 'rasa sakit', 'penderitaan',
    ];

    const lowerCaseMessage = message.toLowerCase();

    for (const keyword of vulnerableKeywords) {
        if (lowerCaseMessage.includes(keyword)) {
            console.warn(`Vulnerability detected with keyword: "${keyword}"`);
            return true;
        }
    }
    return false;
}

// Placeholder for actual AI integration (z-ai/glm-4.5-air:free)
export async function getAICompanionResponse(
  decryptedMessage: string,
  currentMode: string,
  sessionId: string | null
): Promise<string> {
  // In a real implementation, this would call the z-ai API.
  // For now, it returns a simulated response.
  console.log(`AI processing in mode ${currentMode} for session ${sessionId}: "${decryptedMessage}"`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500)); 

  return `Sebagai Companion Rohani dalam mode "${currentMode}", saya memahami. Mari kita renungkan hal ini lebih dalam.`;
}