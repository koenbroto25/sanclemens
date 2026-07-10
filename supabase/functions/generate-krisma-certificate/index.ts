// Edge Function: generate-krisma-certificate
// Generate PDF certificate for Confirmation (Krisma)
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
// import { PDFDocument, rgb, StandardFonts } from 'https://unpkg.com/pdf-lib/dist/pdf-lib.es.js';
// NOTE: pdf-lib import is prepared but Deno compatibility in Edge Functions may require testing.

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { krismaId } = await req.json();

    if (!krismaId) {
      return new Response(JSON.stringify({ error: "Missing krismaId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[GENERATE-KRISMA-CERTIFICATE] Generating certificate for Krisma ID: ${krismaId}`);

    // 1. Fetch krisma details
    const { data: krisma, error: krismaError } = await supabase
      .from('confirmations') // Assuming 'confirmations' table for Krisma
      .select(`
        id,
        candidate_id,
        confirmation_date,
        confirmation_location,
        pastor_name,
        certificate_number,
        certificate_urls,
        status
      `)
      .eq('id', krismaId)
      .single();

    if (krismaError || !krisma) {
      console.error("Error fetching krisma:", krismaError);
      return new Response(
        JSON.stringify({ error: "Krisma record not found", details: krismaError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate status
    if (krisma.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: "Krisma is not completed. Certificate can only be generated for completed krisma." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch candidate profile
    const { data: candidate, error: candidateError } = await supabase
      .from('profiles')
      .select('id, full_name, name_baptis, date_of_birth, place_of_birth, gender, nik')
      .eq('id', krisma.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: "Candidate profile not found", details: candidateError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Generate certificate number if not exists
    let certificateNumber = krisma.certificate_number;
    if (!certificateNumber) {
      const currentYear = new Date().getFullYear();
      // Get count of krisma this year for numbering
      const { count, error: countError } = await supabase
        .from('confirmations')
        .select('*', { count: 'exact', head: true })
        .gte('confirmation_date', `${currentYear}-01-01`)
        .lte('confirmation_date', `${currentYear}-12-31`);

      if (countError) {
        console.error("Error counting krisma:", countError);
      }

      const sequence = (count || 0) + 1;
      certificateNumber = `K/${currentYear}/${String(sequence).padStart(3, '0')}`;
    }

    // 4. TODO: Generate actual PDF using pdf-lib
    // For now, create certificate metadata and store it
    const certificateData = {
      certificate_number: certificateNumber,
      krisma_id: krismaId,
      candidate_name: candidate.full_name,
      candidate_baptismal_name: candidate.name_baptis,
      birth_date: candidate.date_of_birth,
      birth_place: candidate.place_of_birth,
      confirmation_date: krisma.confirmation_date,
      confirmation_location: krisma.confirmation_location,
      pastor_name: krisma.pastor_name,
      generated_at: new Date().toISOString(),
      parish_name: "Paroki Santo Klemens Sepinggan",
      parish_address: "Gereja Santo Martinus, Lanud - Balikpapan",
      diocese: "Keuskupan Agung Samarinda",
    };

    // 5. Store certificate metadata in a JSON file (placeholder for PDF)
    const fileName = `krisma/${new Date().getFullYear()}/${certificateNumber.replace(/\//g, '-')}.json`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('sakramen-certificates')
      .upload(fileName, JSON.stringify(certificateData, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error("Error uploading certificate:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to store certificate", details: uploadError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Generate signed URL (7 days expiry)
    const { data: signedUrlData, error: urlError } = await supabase
      .storage
      .from('sakramen-certificates')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (urlError) {
      console.error("Error generating signed URL:", urlError);
    }

    const certificateUrl = signedUrlData?.signedUrl || null;

    // 7. Update krisma record
    const { error: updateError } = await supabase
      .from('confirmations')
      .update({
        certificate_number: certificateNumber,
        certificate_urls: certificateUrl ? [certificateUrl] : [],
        updated_at: new Date().toISOString()
      })
      .eq('id', krismaId);

    if (updateError) {
      console.error("Error updating krisma record:", updateError);
    }

    return new Response(
      JSON.stringify({
        function: "generate-krisma-certificate",
        status: "success",
        message: `Krisma certificate generated successfully for ID: ${krismaId}`,
        certificateNumber: certificateNumber,
        certificateUrl: certificateUrl,
        candidateName: candidate.full_name,
        confirmationDate: krisma.confirmation_date,
        note: "PDF generation with pdf-lib will be implemented in a future update. Currently storing certificate metadata as JSON."
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in generate-krisma-certificate:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
