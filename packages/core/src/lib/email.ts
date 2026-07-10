// Stub for Next.js build - actual implementation is in Deno/Edge Functions
export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  console.warn('sendEmail is not available in this environment');
}
export {};