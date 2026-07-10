// Edge Function: anomaly-detector
// Cron: rekonsiliasi keuangan mingguan & deteksi anomali
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { sendEmail } from "../../../packages/core/src/lib/email.ts"; // Import sendEmail utility

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    console.log("[ANOMALY-DETECTOR] Initiating weekly financial anomaly detection...");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    let anomalies = [];

    // 1. Check for transactions awaiting approval for too long (e.g., > 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoISO = threeDaysAgo.toISOString();

    const { data: pendingTransactions, error: pendingError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, created_at, status')
      .eq('status', 'pending_approval')
      .lt('created_at', threeDaysAgoISO);

    if (pendingError) {
      console.error("Error fetching pending transactions:", pendingError);
    } else if (pendingTransactions && pendingTransactions.length > 0) {
      pendingTransactions.forEach(tx => {
        anomalies.push({
          type: 'OVERDUE_APPROVAL',
          description: `Transaksi '${tx.description}' (ID: ${tx.id}) menunggu persetujuan selama lebih dari 3 hari.`,
          transaction_id: tx.id,
          created_at: tx.created_at
        });
      });
      console.warn(`[ANOMALY-DETECTOR] Found ${pendingTransactions.length} overdue pending approvals.`);
    }

    // 2. Check for negative balances in financial accounts (simple check)
    const { data: accounts, error: accountsError } = await supabase
      .from('financial_accounts') // Assuming a 'financial_accounts' table exists
      .select('id, name, current_balance')
      .lt('current_balance', 0);

    if (accountsError) {
      console.error("Error fetching financial accounts:", accountsError);
    } else if (accounts && accounts.length > 0) {
      accounts.forEach(acc => {
        anomalies.push({
          type: 'NEGATIVE_BALANCE',
          description: `Akun '${acc.name}' (ID: ${acc.id}) memiliki saldo negatif: ${acc.current_balance}.`,
          account_id: acc.id,
          current_balance: acc.current_balance
        });
      });
      console.warn(`[ANOMALY-DETECTOR] Found ${accounts.length} accounts with negative balances.`);
    }

    // 3. Check for Kolekte Differences (assuming 'kolekte_entries' table with two input columns)
    // This assumes a schema like: kolekte_entries(id, misa_id, date, amount_input_a, amount_input_b)
    const { data: kolekteDifferences, error: kolekteError } = await supabase
      .from('kolekte_entries')
      .select('id, misa_id, date, amount_input_a, amount_input_b')
      .lte('date', new Date().toISOString().split('T')[0]) // Only check up to today
      .limit(100); // Limit to avoid processing too many records at once

    if (kolekteError) {
      console.error("Error fetching kolekte entries:", kolekteError);
    } else if (kolekteDifferences && kolekteDifferences.length > 0) {
      kolekteDifferences.forEach(entry => {
        const diff = Math.abs(entry.amount_input_a - entry.amount_input_b);
        const KOLEKTE_DIFFERENCE_THRESHOLD = parseInt(Deno.env.get("KOLEKTE_DIFF_THRESHOLD") || "50000"); // Customizable threshold
        if (diff > KOLEKTE_DIFFERENCE_THRESHOLD) {
          anomalies.push({
            type: 'KOLEKTE_DIFFERENCE',
            description: `Perbedaan kolekte signifikan (Rp ${diff}) untuk Misa ID: ${entry.misa_id} pada tanggal ${entry.date}. Input A: ${entry.amount_input_a}, Input B: ${entry.amount_input_b}.`,
            kolekte_entry_id: entry.id,
            misa_id: entry.misa_id,
            date: entry.date,
            difference: diff,
            severity: 'medium',
          });
        }
      });
      if (anomalies.some(a => a.type === 'KOLEKTE_DIFFERENCE')) {
        console.warn(`[ANOMALY-DETECTOR] Found kolekte differences.`);
      }
    }

    // 4. Check for Late LPJ (Laporan Pertanggungjawaban)
    // Assuming 'kegiatan' table with 'lpj_due_date' and 'lpj_submitted_at'
    const lpjDueDays = parseInt(Deno.env.get("LPJ_DUE_DAYS") || "7");
    const lpjBlockDays = parseInt(Deno.env.get("LPJ_BLOCK_DAYS") || "14");

    const { data: lateLpjActivities, error: lpjError } = await supabase
      .from('kegiatan') // Assuming 'kegiatan' table exists
      .select('id, nama_kegiatan, lpj_due_date, lpj_submitted_at')
      .is('lpj_submitted_at', null) // LPJ not submitted yet
      .not('lpj_due_date', 'is', null) // Only activities with a due date
      .lt('lpj_due_date', oneWeekAgoISO); // LPJ due date was more than a week ago (or whatever 'late' implies)

    if (lpjError) {
      console.error("Error fetching late LPJ activities:", lpjError);
    } else if (lateLpjActivities && lateLpjActivities.length > 0) {
      lateLpjActivities.forEach(activity => {
        const today = new Date();
        const dueDate = new Date(activity.lpj_due_date);
        const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLate > lpjDueDays) { // If overdue based on config
          anomalies.push({
            type: 'LATE_LPJ',
            description: `LPJ untuk kegiatan '${activity.nama_kegiatan}' (ID: ${activity.id}) terlambat ${daysLate} hari.`,
            activity_id: activity.id,
            lpj_due_date: activity.lpj_due_date,
            days_late: daysLate,
            severity: daysLate > lpjBlockDays ? 'critical' : 'high', // Critical if blocked
          });
        }
      });
      if (anomalies.some(a => a.type === 'LATE_LPJ')) {
        console.warn(`[ANOMALY-DETECTOR] Found late LPJ submissions.`);
      }
    }

    // 5. Log anomalies to `public.audit_log` (or a dedicated 'anomalies' table if available)
    if (anomalies.length > 0) {
      const auditLogEntries = anomalies.map(anomaly => ({
        action: `ANOMALY_DETECTED_${anomaly.type}`,
        table_name: anomaly.transaction_id ? 'financial_transactions' : (anomaly.account_id ? 'financial_accounts' : (anomaly.kolekte_entry_id ? 'kolekte_entries' : (anomaly.activity_id ? 'kegiatan' : 'unknown'))), // Determine table based on anomaly type
        record_id: anomaly.transaction_id || anomaly.account_id || anomaly.kolekte_entry_id || anomaly.activity_id,
        new_values: anomaly,
        performed_by: 'system_anomaly_detector', // System user
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('audit_log') // Assuming audit_log table exists
        .insert(auditLogEntries);

      if (insertError) {
        console.error("Error logging anomalies to audit_log:", insertError);
      } else {
        console.log(`[ANOMALY-DETECTOR] Logged ${anomalies.length} anomalies.`);
      }

      // Trigger notifications to Audit Team or Ketua DPP (`AnomalyAlertBanner`)
      const auditTeamEmail = Deno.env.get("AUDIT_TEAM_EMAIL"); // Email for audit team notifications
      const ketuaDppEmail = Deno.env.get("KETUA_DPP_EMAIL");   // Email for Ketua DPP notifications
      
      const emailSubject = `⚠️ Laporan Anomali Keuangan: Ditemukan ${anomalies.length} Anomali Baru`;
      const emailHtml = `
        <p>Shalom Tim Audit & Ketua DPP,</p>
        <p>Sistem deteksi anomali telah menemukan beberapa potensi masalah keuangan:</p>
        <ul>
          ${anomalies.map(a => `<li><strong>${a.type} (${a.severity?.toUpperCase() || 'NORMAL'}):</strong> ${a.description}</li>`).join('')}
        </ul>
        <p>Mohon segera login ke dashboard audit untuk meninjau dan menyelesaikan anomali ini.</p>
        <p>Tuhan memberkati.</p>
        <br>
        <p>Hormat kami,</p>
        <p>Sistem Keuangan Paroki Santo Klemens</p>
      `;
      const emailText = `
        Shalom Tim Audit & Ketua DPP,

        Sistem deteksi anomali telah menemukan beberapa potensi masalah keuangan:

        ${anomalies.map(a => `- ${a.type} (${a.severity?.toUpperCase() || 'NORMAL'}): ${a.description}`).join('\n')}

        Mohon segera login ke dashboard audit untuk meninjau dan menyelesaikan anomali ini.

        Tuhan memberkati.

        Hormat kami,
        Sistem Keuangan Paroki Santo Klemens
      `;

      if (auditTeamEmail) {
        await sendEmail(auditTeamEmail, emailSubject, emailHtml, emailText);
        console.log("[ANOMALY-DETECTOR] Sent anomaly alert email to Audit Team.");
      }
      if (ketuaDppEmail) {
        await sendEmail(ketuaDppEmail, emailSubject, emailHtml, emailText);
        console.log("[ANOMALY-DETECTOR] Sent anomaly alert email to Ketua DPP.");
      }

    } else {
      console.log("[ANOMALY-DETECTOR] No financial anomalies detected this week.");
    }

    return new Response(
      JSON.stringify({
        function: "anomaly-detector",
        status: "success",
        message: `Weekly anomaly detection completed. Found ${anomalies.length} anomalies.`,
        anomaliesFound: anomalies,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in anomaly-detector:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
