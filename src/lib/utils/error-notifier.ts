export function notifySystemError(error: unknown, context: string, details?: Record<string, any>) {
  console.error(`[SYSTEM ERROR] ${context}:`, error, details);

  // TODO: Implement actual internal notification mechanism here.
  // This could involve:
  // - Sending an email to admin: import { sendAdminEmail } from '@/lib/email';
  // - Sending a message to a Telegram bot: import { sendTelegramMessage } from '@/lib/telegram';
  // - Logging to a dedicated error tracking service like Sentry or LogRocket.

  const errorMessage = error instanceof Error ? error.message : String(error);
  const notificationDetails = {
    timestamp: new Date().toISOString(),
    context,
    errorMessage,
    ...details,
  };

  console.log('--- Internal System Error Notification (Placeholder) ---');
  console.log(JSON.stringify(notificationDetails, null, 2));
  console.log('-------------------------------------------------------');

  // Example: If a Telegram bot is set up
  // sendTelegramMessage(`🚨 System Error in ${context}: ${errorMessage}`, notificationDetails);
  // Example: If admin email is set up
  // sendAdminEmail('System Error Alert', `Error in ${context}: ${errorMessage}`, notificationDetails);
}