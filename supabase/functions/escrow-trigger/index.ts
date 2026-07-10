// Edge Function: escrow-trigger
// Xendit webhook handler Dana Kasih
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { sendEmail, generateDanaKasihConfirmationEmail } from "../../../packages/core/src/lib/email.ts";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const xenditWebhookToken = Deno.env.get("XENDIT_WEBHOOK_TOKEN");
    const incomingToken = req.headers.get("x-callback-token");

    if (!xenditWebhookToken || incomingToken !== xenditWebhookToken) {
      return new Response(JSON.stringify({ error: "Unauthorized webhook" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("[ESCROW-TRIGGER] Received Xendit webhook:", JSON.stringify(payload, null, 2));

    // Extract relevant data from Xendit payload
    const xenditEvent = payload.event;
    const xenditId = payload.id; // Xendit webhook ID
    const externalId = payload.data?.external_id; // Your invoice/transaction ID (should be dana_kasih_id)
    const paymentStatus = payload.data?.status; // e.g., 'PAID', 'EXPIRED', 'FAILED'
    const amount = payload.data?.amount;
    const payerEmail = payload.data?.payer_email || 'anonim@paroki-santo-klemens.org';
    const payerName = payload.data?.payer_name || 'Umat';
    const metadata = payload.data?.metadata || {}; // Additional metadata for Dana Kasih

    if (!externalId || !paymentStatus) {
      console.error("[ESCROW-TRIGGER] Missing external_id or payment_status in payload.", payload);
      return new Response(
        JSON.stringify({ error: "Invalid Xendit payload: missing external_id or status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let newStatus = '';
    let isPaymentSuccess = false;
    switch (paymentStatus) {
      case 'PAID':
        newStatus = 'paid';
        isPaymentSuccess = true;
        break;
      case 'EXPIRED':
        newStatus = 'expired';
        break;
      case 'FAILED':
        newStatus = 'failed';
        break;
      default:
        newStatus = 'pending';
    }

    // Assume RK-2 Bank Account ID is configurable or retrieved
    const rk2BankAccountId = Deno.env.get("RK2_BANK_ACCOUNT_ID") || 'default-rk2-account-id'; // This needs to be defined in .env

    // 1. Update financial_transactions table
    // Assuming externalId is directly the dana_kasih_id
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('financial_transactions')
      .upsert({
        xendit_invoice_id: xenditId, // Xendit webhook ID, assuming it's unique for each payment event
        reference_id: externalId, // This links to dana_kasih campaign ID
        amount: amount,
        status: newStatus,
        type: 'income', // Always income for Dana Kasih donations
        account_id: rk2BankAccountId,
        description: `Donasi Dana Kasih #${externalId} - Xendit Payment`,
        created_at: new Date().toISOString(), // Use created_at for initial upsert
        updated_at: new Date().toISOString(),
        dana_kasih_id: externalId, // Explicitly link to dana_kasih
        -- Assuming user_id can be derived from metadata if donor is logged in when initiating payment
        -- user_id: metadata.user_id || null, 
      }, { onConflict: 'reference_id, type' }) // Upsert based on reference_id and type to avoid duplicates for the same donation
      .select();

    if (updateError) {
      console.error("[ESCROW-TRIGGER] Error upserting/updating transaction status:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (updatedTransaction && updatedTransaction.length > 0) {
      console.log(`[ESCROW-TRIGGER] Transaction ${externalId} upserted/updated to status: ${newStatus}`);

      // 2. Update dana_kasih campaign if payment is successful
      if (isPaymentSuccess) {
        const { data: danaKasihCampaign, error: fetchCampaignError } = await supabase
          .from('dana_kasih')
          .select('id, title, current_amount, total_donatur, created_by')
          .eq('id', externalId)
          .single();

        if (fetchCampaignError) {
          console.error("[ESCROW-TRIGGER] Error fetching Dana Kasih campaign:", fetchCampaignError);
        } else if (danaKasihCampaign) {
          const { data: updatedCampaign, error: updateCampaignError } = await supabase
            .from('dana_kasih')
            .update({
              current_amount: danaKasihCampaign.current_amount + amount,
              total_donatur: danaKasihCampaign.total_donatur + 1, // Increment for each successful donation
              updated_at: new Date().toISOString(),
            })
            .eq('id', externalId)
            .select();

          if (updateCampaignError) {
            console.error("[ESCROW-TRIGGER] Error updating Dana Kasih campaign:", updateCampaignError);
          } else {
            console.log(`[ESCROW-TRIGGER] Dana Kasih campaign ${externalId} updated.`);
            
            // 3. Send automated email confirmation (Invisible Grace)
            const recipientEmail = payerEmail; // Use payerEmail from Xendit or default
            const recipientName = payerName;   // Use payerName from Xendit or default
            const danaKasihTitle = danaKasihCampaign.title;

            if (recipientEmail && danaKasihTitle) {
              const { subject, html, text } = generateDanaKasihConfirmationEmail(recipientName, danaKasihTitle);
              await sendEmail(recipientEmail, subject, html, text);
            }
          }
        } else {
          console.warn(`[ESCROW-TRIGGER] Dana Kasih campaign ${externalId} not found.`);
        }
      }
    } else {
      console.warn(`[ESCROW-TRIGGER] No transaction record created/updated for external_id: ${externalId}.`);
    }

    return new Response(
      JSON.stringify({
        function: "escrow-trigger",
        status: "success",
        message: `Xendit webhook processed for external_id: ${externalId}, status: ${newStatus}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in escrow-trigger:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
