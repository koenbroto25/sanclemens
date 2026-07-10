// Edge Function: generate-baptis-certificate
// Generate PDF certificate for Baptism
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

    const { baptismId } = await req.json();

    if (!baptismId) {
      return new Response(JSON.stringify({ error: "Missing baptismId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[GENERATE-BAPTIS-CERTIFICATE] Generating certificate for Baptism ID: ${baptismId}`);

    // 1. Fetch baptism details
    const { data: baptism, error: baptismError } = await supabase
      .from('baptisms')
      .select(`
        id,
        candidate_id,
        godfather_id,
        godmother_id,
        baptism_date,
        baptism_location,
        pastor_name,
        certificate_number,
        certificate_urls,
        status
      `)
      .eq('id', baptismId)
      .single();

    if (baptismError || !baptism) {
      console.error("Error fetching baptism:", baptismError);
      return new Response(
        JSON.stringify({ error: "Baptism record not found", details: baptismError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate status
    if (baptism.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: "Baptism is not completed. Certificate can only be generated for completed baptisms." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch candidate (child) profile
    const { data: candidate, error: candidateError } = await supabase
      .from('profiles')
      .select('id, full_name, name_baptis, date_of_birth, place_of_birth, gender, nik')
      .eq('id', baptism.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: "Candidate profile not found", details: candidateError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Generate certificate number if not exists
    let certificateNumber = baptism.certificate_number;
    if (!certificateNumber) {
      const currentYear = new Date().getFullYear();
      // Get count of baptisms this year for numbering
      const { count, error: countError } = await supabase
        .from('baptisms')
        .select('*', { count: 'exact', head: true })
        .gte('baptism_date', `${currentYear}-01-01`)
        .lte('baptism_date', `${currentYear}-12-31`);

      if (countError) {
        console.error("Error counting baptisms:", countError);
      }

      const sequence = (count || 0) + 1;
      certificateNumber = `B/${currentYear}/${String(sequence).padStart(3, '0')}`;
    }

    // 4. TODO: Generate actual PDF using pdf-lib
    // For now, create certificate metadata and store it
    const certificateData = {
      certificate_number: certificateNumber,
      baptism_id: baptismId,
      candidate_name: candidate.full_name,
      candidate_baptismal_name: candidate.name_baptis,
      birth_date: candidate.date_of_birth,
      birth_place: candidate.place_of_birth,
      baptism_date: baptism.baptism_date,
      baptism_location: baptism.baptism_location,
      pastor_name: baptism.pastor_name,
      generated_at: new Date().toISOString(),
      parish_name: "Paroki Santo Klemens Sepinggan",
      parish_address: "Gereja Santo Martinus, Lanud - Balikpapan",
      diocese: "Keuskupan Agung Samarinda",
    };

    // 5. Store certificate metadata in a JSON file (placeholder for PDF)
    const fileName = `baptis/${new Date().getFullYear()}/${certificateNumber.replace(/\//g, '-')}.json`;
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

    // 7. Update baptism record
    const { error: updateError } = await supabase
      .from('baptisms')
      .update({
        certificate_number: certificateNumber,
        certificate_urls: certificateUrl ? [certificateUrl] : [],
        updated_at: new Date().toISOString()
      })
      .eq('id', baptismId);

    if (updateError) {
      console.error("Error updating baptism record:", updateError);
    }

    return new Response(
      JSON.stringify({
        function: "generate-baptis-certificate",
        status: "success",
        message: `Baptism certificate generated successfully for ID: ${baptismId}`,
        certificateNumber: certificateNumber,
        certificateUrl: certificateUrl,
        candidateName: candidate.full_name,
        baptismDate: baptism.baptism_date,
        note: "PDF generation with pdf-lib will be implemented in a future update. Currently storing certificate metadata as JSON."
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in generate-baptis-certificate:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
