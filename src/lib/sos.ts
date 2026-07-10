// src/lib/sos.ts
import { type UserProfile } from "@/types/user"; // Assuming a UserProfile type exists

interface SOSRequest {
  type: "Sakramen Pengurapan" | "Konsultasi Pastoral" | "Bantuan Mendesak Lainnya";
  userId: string;
  userName: string;
  userEmail: string;
  latitude?: number;
  longitude?: number;
  message?: string;
}

export async function triggerPastoralSOS(request: SOSRequest) {
  console.log("Triggering Pastoral SOS:", request);

  // Simulate FCM CRITICAL notification to Pastor, Vikaris, KL
  console.log("Simulating FCM CRITICAL notification...");
  // In a real implementation, this would involve a server-side call
  // to a Supabase Edge Function or similar to send FCM messages.

  // Simulate opening WhatsApp link to Pastor
  const whatsappMessage = encodeURIComponent(
    `[DARURAT PASTORAL] Kebutuhan: ${request.type}\n` +
    `Dari: ${request.userName} (${request.userEmail})\n` +
    (request.latitude && request.longitude ? `Lokasi: https://www.google.com/maps?q=${request.latitude},${request.longitude}\n` : "") +
    (request.message ? `Pesan: ${request.message}` : "")
  );
  const whatsappLink = `https://wa.me/+628123456789?text=${whatsappMessage}`; // Replace with actual Pastor's WhatsApp number
  console.log("WhatsApp Link (Pastor):", whatsappLink);
  // In a real app, you might want to open this automatically or provide a link to the user.

  // Simulate logging the SOS request
  console.log("Logging SOS request to database...");
  // This would typically involve inserting into a 'pastoral_sos' table
  // with details like timestamp, type, user_id, status, etc.

  // Simulate displaying prayer guidance (client-side in page.tsx)
  // Simulate escalation logic (server-side, e.g., a cron job checking 'pastoral_sos' table)
  console.log("Escalation logic will be handled by a server-side process if no response within 15 minutes.");

  return { success: true, whatsappLink };
}

export async function logPastoralSOS(
  userId: string,
  type: SOSRequest["type"],
  status: "triggered" | "responded" | "escalated" | "completed" | "cancelled",
  details?: any
) {
  console.log(`Logging SOS event for user ${userId}, type ${type}, status ${status}`, details);
  // This function would interact with your Supabase database to record
  // events in the 'pastoral_sos_logs' or similar table.
}
