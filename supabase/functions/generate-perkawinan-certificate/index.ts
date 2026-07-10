// Edge Function: generate-perkawinan-certificate
// Generate PDF certificate for Marriage (Perkawinan)
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

    const { marriageId } = await req.json();

    if (!marriageId) {
      return new Response(JSON.stringify({ error: "Missing marriageId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[GENERATE-PERKAWINAN-CERTIFICATE] Generating certificate for Marriage ID: ${marriageId}`);

    // 1. Fetch marriage details
    const { data: marriage, error: marriageError } = await supabase
      .from('marriages') // Assuming 'marriages' table for Perkawinan
      .select(`
        id,
        bride_id,
        groom_id,
        marriage_date,
        marriage_location,
        pastor_name,
        certificate_number,
        certificate_urls,
        status
      `)
      .eq('id', marriageId)
      .single();

    if (marriageError || !marriage) {
      console.error("Error fetching marriage:", marriageError);
      return new Response(
        JSON.stringify({ error: "Marriage record not found", details: marriageError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate status
    if (marriage.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: "Marriage is not completed. Certificate can only be generated for completed marriages." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch bride and groom profiles
    const { data: bride, error: brideError } = await supabase
      .from('profiles')
      .select('id, full_name, name_baptis, date_of_birth, place_of_birth, gender, nik')
      .eq('id', marriage.bride_id)
      .single();

    const { data: groom, error: groomError } = await supabase
      .from('profiles')
      .select('id, full_name, name_baptis, date_of_birth, place_of_birth, gender, nik')
      .eq('id', marriage.groom_id)
      .single();

    if (brideError || !bride) {
      return new Response(
        JSON.stringify({ error: "Bride profile not found", details: brideError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (groomError || !groom) {
      return new Response(
        JSON.stringify({ error: "Groom profile not found", details: groomError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Generate certificate number if not exists
    let certificateNumber = marriage.certificate_number;
    if (!certificateNumber) {
      const currentYear = new Date().getFullYear();
      // Get count of marriages this year for numbering
      const { count, error: countError } = await supabase
        .from('marriages')
        .select('*', { count: 'exact', head: true })
        .gte('marriage_date', `${currentYear}-01-01`)
        .lte('marriage_date', `${currentYear}-12-31`);

      if (countError) {
        console.error("Error counting marriages:", countError);
      }

      const sequence = (count || 0) + 1;
      certificateNumber = `M/${currentYear}/${String(sequence).padStart(3, '0')}`;
    }

    // 4. TODO: Generate actual PDF using pdf-lib
    // For now, create certificate metadata and store it
    const certificateData = {
      certificate_number: certificateNumber,
      marriage_id: marriageId,
      bride_name: bride.full_name,
      groom_name: groom.full_name,
      marriage_date: marriage.marriage_date,
      marriage_location: marriage.marriage_location,
      pastor_name: marriage.pastor_name,
      generated_at: new Date().toISOString(),
      parish_name: "Paroki Santo Klemens Sepinggan",
      parish_address: "Gereja Santo Martinus, Lanud - Balikpapan",
      diocese: "Keuskupan Agung Samarinda",
    };

    // 5. Store certificate metadata in a JSON file (placeholder for PDF)
    const fileName = `marriage/${new Date().getFullYear()}/${certificateNumber.replace(/\//g, '-')}.json`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('sakramen-certificates')
      .upload(fileName, JSON.stringify(certificateData, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadData) {
      console.log("Certificate metadata uploaded successfully:", uploadData);
    }
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

    // 7. Update marriage record
    const { error: updateError } = await supabase
      .from('marriages')
      .update({
        certificate_number: certificateNumber,
        certificate_urls: certificateUrl ? [certificateUrl] : [],
        updated_at: new Date().toISOString()
      })
      .eq('id', marriageId);

    if (updateError) {
      console.error("Error updating marriage record:", updateError);
    }

    return new Response(
      JSON.stringify({
        function: "generate-perkawinan-certificate",
        status: "success",
        message: `Marriage certificate generated successfully for ID: ${marriageId}`,
        certificateNumber: certificateNumber,
        certificateUrl: certificateUrl,
        brideName: bride.full_name,
        groomName: groom.full_name,
        marriageDate: marriage.marriage_date,
        note: "PDF generation with pdf-lib will be implemented in a future update. Currently storing certificate metadata as JSON."
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in generate-perkawinan-certificate:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
