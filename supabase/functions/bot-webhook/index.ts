// Edge Function: bot-webhook
// Handler webhook bot asisten
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("[BOT-WEBHOOK] Received bot webhook payload:", payload);

    // Assuming a generic payload structure from a bot platform (e.g., WhatsApp, web chat)
    // You might need to adapt this based on the actual platform's webhook structure.
    const platform = req.headers.get("x-bot-platform") || "web"; // e.g., 'whatsapp', 'web_chat'
    const userId = payload.user_id || payload.from_id; // User ID from the platform
    const messageText = payload.message?.text || payload.text; // Incoming message text
    const conversationId = payload.conversation_id || `${userId}-${platform}`; // Unique conversation ID

    if (!messageText) {
      return new Response(JSON.stringify({ error: "Missing message text in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Store conversation history in `public.bot_conversations`
    // Find existing conversation or create a new one
    let { data: conversation, error: fetchError } = await supabase
      .from('bot_conversations')
      .select('*')
      .eq('session_id', conversationId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') { // No rows found
      const { data: newConv, error: createError } = await supabase
        .from('bot_conversations')
        .insert({
          bot_type: 'info_publik', // Default, could be determined dynamically
          session_id: conversationId,
          user_id: userId || null,
          platform: platform,
          messages: [{ role: 'user', content: messageText, timestamp: new Date().toISOString() }],
          started_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (createError) throw createError;
      conversation = newConv;
    } else if (fetchError) {
      throw fetchError;
    } else {
      // Append new message to existing conversation
      const updatedMessages = [...(conversation?.messages || []), { role: 'user', content: messageText, timestamp: new Date().toISOString() }];
      const { data: updatedConv, error: updateError } = await supabase
        .from('bot_conversations')
        .update({ messages: updatedMessages, last_message_at: new Date().toISOString() })
        .eq('session_id', conversationId)
        .select()
        .single();
      if (updateError) throw updateError;
      conversation = updatedConv;
    }

    console.log(`[BOT-WEBHOOK] Conversation ${conversationId} updated.`);

    // --- FULL IMPLEMENTATION CONTINUATION ---
    // 2. Forward message to 'packages/bot-engine' for intent processing
    //    const botEngine = new BotEngine(); // Assuming BotEngine is an imported class
    //    const botResponse = await botEngine.processMessage(messageText, conversation?.bot_type);

    // 3. Send responses back to the user through the appropriate platform
    //    Based on `platform` and `botResponse`

    // Placeholder bot response
    const botResponseText = `Anda bertanya: "${messageText}". Ini adalah respons bot placeholder. Implementasi penuh akan memproses pertanyaan Anda lebih lanjut.`;
    const updatedMessagesWithBot = [...(conversation?.messages || []), { role: 'bot', content: botResponseText, timestamp: new Date().toISOString() }];

    // Update conversation with bot's response
    await supabase
      .from('bot_conversations')
      .update({ messages: updatedMessagesWithBot })
      .eq('session_id', conversationId);


    return new Response(
      JSON.stringify({
        function: "bot-webhook",
        status: "success",
        message: "Bot webhook processed and conversation logged. Full bot engine integration pending.",
        botResponse: botResponseText,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in bot-webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
