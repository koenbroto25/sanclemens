// Edge Function: wdl-consent-check
// Cron: validasi expiry consent WDL dan set is_active=FALSE jika expired
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("wdl_consent")
      .update({ is_active: false })
      .lt("expires_at", now)
      .eq("is_active", true)
      .select();

    if (error) {
      console.error("Error updating expired WDL consents:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Updated ${data.length} expired WDL consents.`);
    return new Response(
      JSON.stringify({
        function: "wdl-consent-check",
        status: "success",
        updatedCount: data.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in wdl-consent-check:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
