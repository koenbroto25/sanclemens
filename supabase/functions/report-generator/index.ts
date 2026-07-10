// Edge Function: report-generator
// Cron: generate laporan bulanan otomatis ke Pastor
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { sendEmail } from "../../../packages/core/src/lib/email.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"; // Importing pdf-lib for Deno

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const reportTitle = `Laporan Bulanan Paroki Santo Klemens - ${currentMonth + 1}/${currentYear}`;

    console.log(`[REPORT-GENERATOR] Generating monthly report: ${reportTitle}...`);

    // 1. Placeholder for data retrieval (simulate for now)
    const dummyReportData = {
      totalKegiatan: 25,
      totalSakramen: 10,
      totalDanaKasih: 15000000,
      anomaliDetected: 2,
    };

    // 2. Generate PDF report using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText(reportTitle, {
      x: 50,
      y: 750,
      font: boldFont,
      size: 24,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(
      `Ringkasan Kegiatan: ${dummyReportData.totalKegiatan} kegiatan\n` +
      `Ringkasan Sakramen: ${dummyReportData.totalSakramen} sakramen\n` +
      `Total Dana Kasih: Rp ${dummyReportData.totalDanaKasih.toLocaleString('id-ID')}\n` +
      `Anomali Terdeteksi: ${dummyReportData.anomaliDetected} anomali`,
      {
        x: 50,
        y: 650,
        font: font,
        size: 12,
        lineHeight: 18,
        color: rgb(0.2, 0.2, 0.2),
      }
    );

    const pdfBytes = await pdfDoc.save();

    // 3. Upload PDF to Supabase Storage (private bucket)
    const reportFileName = `Laporan_Bulanan_${currentMonth + 1}_${currentYear}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sakramen-certificates') // Reusing a private bucket for now, or create a new 'monthly-reports' bucket
      .upload(`reports/${reportFileName}`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
        // Set RLS policies to allow only authorized users (e.g., Pastor, WK I, WK II) to download
      });

    if (uploadError) {
      console.error("Error uploading PDF report to storage:", uploadError);
      throw new Error(`Failed to upload report: ${uploadError.message}`);
    }

    // 4. Create a signed URL with TTL 7 days
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('sakramen-certificates')
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 7); // 7 days TTL

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    const reportUrl = signedUrlData.signedUrl;

    // 5. Send signed URL via email to Pastor, WK I, and WK II
    const pastorEmail = Deno.env.get("PASTOR_EMAIL");
    const wk1Email = Deno.env.get("WK1_EMAIL"); // Assuming WK1_EMAIL env var
    const wk2Email = Deno.env.get("WK2_EMAIL"); // Assuming WK2_EMAIL env var

    const recipients = [pastorEmail, wk1Email, wk2Email].filter(Boolean) as string[];

    if (recipients.length > 0) {
      const emailSubject = `✅ Laporan Bulanan Paroki - ${currentMonth + 1}/${currentYear} Tersedia`;
      const emailHtml = `
        <p>Shalom Romo/Bapak/Ibu,</p>
        <p>Laporan bulanan untuk Paroki Santo Klemens bulan ${currentMonth + 1}/${currentYear} telah tersedia.</p>
        <p>Anda dapat mengakses laporan terlampir melalui tautan berikut (berlaku 7 hari):</p>
        <p><a href="${reportUrl}">Unduh Laporan Bulanan</a></p>
        <p>Terima kasih atas perhatian dan pelayanan Anda.</p>
        <p>Tuhan memberkati.</p>
      `;
      const emailText = `
        Shalom Romo/Bapak/Ibu,

        Laporan bulanan untuk Paroki Santo Klemens bulan ${currentMonth + 1}/${currentYear} telah tersedia.

        Anda dapat mengakses laporan terlampir melalui tautan berikut (berlaku 7 hari):
        ${reportUrl}

        Terima kasih atas perhatian dan pelayanan Anda.
        Tuhan memberkati.
      `;

      await sendEmail(recipients.join(','), emailSubject, emailHtml, emailText);
      console.log(`[REPORT-GENERATOR] Sent report notification email to ${recipients.length} recipients.`);
    } else {
      console.warn("[REPORT-GENERATOR] No recipient emails configured (PASTOR_EMAIL, WK1_EMAIL, WK2_EMAIL). Report will not be emailed.");
    }

    return new Response(
      JSON.stringify({
        function: "report-generator",
        status: "success",
        message: `Monthly report for ${currentMonth + 1}/${currentYear} generated and delivered.`,
        reportUrl: reportUrl,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in report-generator:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
