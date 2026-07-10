export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { retrieveKnowledge, generateQueryEmbedding, RetrievalContext } from '@/lib/ai/retriever';
import { generateLLMResponse, generateLLMResponseWithTools, Tool } from '@/lib/ai/llm';
import { getDocumentTypes } from '@/lib/documents/document-helpers';
import { Document } from '@/lib/documents/pdf-generator'; // Assuming Document interface is exported from pdf-generator

interface BotChatRequestBody {
  user_message: string;
  session_id?: string;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const bot_id = params.botId;
    const body: BotChatRequestBody = await request.json();
    const message = body.user_message;

    if (!bot_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: bot_id (route param), user_message' },
        { status: 400 }
      );
    }

    const user = await getCurrentUserProfile();
    const accessLayer = user?.access_layer ?? 0;

    const supabase = createClient();
    const { data: botConfig, error: botConfigError } = await supabase
      .from('bot_configs')
      .select('*')
      .eq('bot_id', bot_id)
      .single();

    if (botConfigError || !botConfig) {
      return NextResponse.json(
        { error: `Bot configuration not found for bot_id: ${bot_id}` },
        { status: 404 }
      );
    }

    if (accessLayer < botConfig.access_level_required) {
      return NextResponse.json({
        success: false,
        bot_id,
        bot_name: botConfig.bot_name || 'Unknown Bot',
        bot_response: 'Maaf, Anda tidak memiliki akses untuk menggunakan bot ini.',
        sources: [],
        retrieval_path: 'access_denied',
        is_guest: !user,
      });
    }

    const domain = botConfig.primary_domain || 'general';
    const queryEmbedding = await generateQueryEmbedding(message);

    const retrievalContext: RetrievalContext = {
      query: message,
      embedding: queryEmbedding,
      domain,
      bot_id,
      user_access_level: accessLayer,
    };

    const retrievalResult = await retrieveKnowledge(retrievalContext, botConfig.bot_access || []);

    const contextText = retrievalResult.sources
      .map((s, i) => `[${i + 1}] ${s.sourceReference}: ${s.contentPreview}`)
      .join('\n\n');

    const botName = botConfig.bot_name || 'AI Assistant';

    const availableTools: Tool[] = [
      {
        name: 'get_user_documents',
        description: 'Ambil daftar dokumen digital milik user tertentu. Gunakan ini untuk menemukan sertifikat sakramen, KTP digital, atau KK Katolik yang dimiliki user. Jika user bertanya tentang dokumen dirinya atau anggota keluarganya, gunakan tool ini.',
        parameters: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'ID pengguna (UUID) yang dokumennya ingin diambil. Jika tidak disediakan, akan menggunakan ID user yang sedang chatting.'
            },
            documentType: {
              type: 'string',
              description: 'Jenis dokumen yang ingin dicari (contoh: KTPD, KK, BAPTIS, KOMUNI, KRISMA, NIKAH). Opsional.'
            },
            status: {
              type: 'string',
              description: 'Status dokumen yang ingin dicari (contoh: issued, pending_user_verification, pending_official_approval, revoked, draft). Opsional. Default: issued.'
            }
          },
          required: [],
        },
      },
      {
        name: 'verify_document',
        description: 'Verifikasi keaslian suatu dokumen digital dengan nomor dokumennya. Gunakan jika user ingin memverifikasi dokumen tertentu.',
        parameters: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'Nomor dokumen (contoh: KTPD-2026-00001) yang ingin diverifikasi.',
            },
          },
          required: ['documentId'],
        },
      },
      {
        name: 'download_document',
        description: 'Dapatkan link download PDF dokumen digital yang sudah terbit. Gunakan jika user ingin mengunduh dokumen tertentu.',
        parameters: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'ID unik (UUID) dari dokumen yang ingin diunduh. Ini BUKAN nomor dokumen (misal: KTPD-2026-00001), tapi UUID yang ada di database. Contoh: "b0f7e4e1-2a3b-4c5d-6e7f-8a9b0c1d2e3f". Anda harus memanggil get_user_documents terlebih dahulu untuk mendapatkan documentId (UUID) yang benar.'
            }
          },
          required: ['documentId'],
        }
      }
    ];

    let responseText: string;
    let toolCalls: any[] = [];
    let toolResponse: any = null;

    // First LLM call: decide if a tool should be used
    const llmToolResult = await generateLLMResponseWithTools({
      prompt: message,
      systemPrompt: `Kamu adalah ${botName}, asisten AI untuk Paroki Santo Klemens.
        Konteks dari basis pengetahuan:
        ${contextText || 'Tidak ada konteks yang tersedia.'}
        Jika user menanyakan tentang dokumen mereka atau anggota keluarga, atau ingin memverifikasi/mendownload dokumen, gunakan tool yang tersedia.
        `,
      temperature: 0.7,
      maxTokens: 1024,
      tools: availableTools,
      chatHistory: body.chat_history || [],
    });
    
    responseText = llmToolResult.text;
    toolCalls = llmToolResult.toolCalls || [];

    if (toolCalls.length > 0) {
      const toolCall = toolCalls[0]; // Assuming one tool call for simplicity
      const { name, args } = toolCall;

      if (name === 'get_user_documents') {
        const targetUserId = args.userId || user?.id;
        if (!targetUserId) {
          toolResponse = { error: 'Tidak dapat mengidentifikasi user untuk mengambil dokumen.' };
        } else {
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('pidu_owner_id', targetUserId)
            .order('issued_at', { ascending: false });

          if (error) {
            toolResponse = { error: `Gagal mengambil dokumen: ${error.message}` };
          } else if (data && data.length > 0) {
            toolResponse = { documents: data.map(doc => ({
              id: doc.id,
              document_id: doc.document_id,
              document_type_code: doc.document_type_code,
              status: doc.status,
              issued_at: doc.issued_at,
              pdf_url: doc.pdf_url,
            }))};
          } else {
            toolResponse = { message: 'Tidak ditemukan dokumen untuk user ini.' };
          }
        }
      } else if (name === 'verify_document') {
        const { documentId: docNum } = args;
        if (!docNum) {
          toolResponse = { error: 'Nomor dokumen diperlukan untuk verifikasi.' };
        } else {
          // Direct API call to verify endpoint
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents/verify/${docNum}`);
          const data = await res.json();
          toolResponse = data;
        }
      } else if (name === 'download_document') {
        const { documentId } = args; // This documentId is the UUID from the database
        if (!documentId) {
          toolResponse = { error: 'UUID dokumen diperlukan untuk mengunduh.' };
        } else {
          // Construct the download URL directly from the API
          const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/documents/${documentId}/download`;
          toolResponse = { download_url: downloadUrl, message: `Silakan klik link ini untuk mengunduh dokumen: ${downloadUrl}` };
        }
      }

      // Second LLM call to process tool output
      const toolOutputPrompt = `Tool ${name} dieksekusi dengan argumen ${JSON.stringify(args)} dan menghasilkan output: ${JSON.stringify(toolResponse)}.
      Berdasarkan output ini dan pesan pengguna sebelumnya, berikan respons yang relevan.`;

      const llmResultAfterTool = await generateLLMResponse({
        prompt: toolOutputPrompt,
        systemPrompt: `Kamu adalah ${botName}, asisten AI untuk Paroki Santo Klemens.
        Konteks dari basis pengetahuan:
        ${contextText || 'Tidak ada konteks yang tersedia.'}
        `,
        temperature: 0.7,
        maxTokens: 1024,
      });
      responseText = llmResultAfterTool.text;
    }

    if (user?.id) {
      await supabase.from('ai_interaction_logs').insert({
        user_id: user.id,
        bot_id,
        query: message,
        domain,
        question_type: 'bot_chat',
        sources_used: retrievalResult.sources.map((s) => s.sourceReference),
        confidence: retrievalResult.confidence,
        retrieval_path: retrievalResult.retrieval_path,
        bot_served: botName,
        was_redirected: false,
        was_refused: false,
        injection_attempt: false,
        created_at: new Date().toISOString(),
      }).then(({ error }) => { if (error) console.error('Failed to log interaction:', error); });
    }

    return NextResponse.json({
      success: true,
      bot_id,
      bot_name: botName,
      bot_response: responseText,
      sources: retrievalResult.sources.map((s) => ({
        content: s.contentPreview,
        source_reference: s.sourceReference,
      })),
      retrieval_path: retrievalResult.retrieval_path,
      is_guest: !user,
    });
  } catch (error) {
    console.error('Server error in POST /api/bot/[botId]/chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}