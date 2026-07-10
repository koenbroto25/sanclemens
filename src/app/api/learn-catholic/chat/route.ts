export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { get_ai_request_context, get_liturgical_context, log_ai_abuse } from '@/lib/supabase/functions'; // Assuming these functions are in lib/supabase/functions.ts or similar

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, module_id, current_content_id } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const userId = user.user.id;

    // 1. Get AI request context
    const aiContext = await get_ai_request_context(userId, '/learn-catholic');
    const liturgicalContext = await get_liturgical_context(new Date().toISOString().split('T')[0]); // Today's date

    // 2. Fetch relevant learning module data and theological references
    let moduleData: any = null;
    let theologicalReferences: any[] = [];
    if (module_id) {
      const { data: module, error: moduleError } = await supabase
        .from('learning_modules')
        .select(`
          *,
          learning_content(id, content_type, content_data),
          learning_qa_context(suggested_questions, reinforcement_points, theological_sources)
        `)
        .eq('id', module_id)
        .single();

      if (moduleError) {
        console.error('Error fetching module for chat:', moduleError);
        // Continue without module data if error
      }
      moduleData = module;

      if (moduleData?.learning_qa_context?.theological_sources?.length > 0) {
        const { data: refs, error: refsError } = await supabase
          .from('theology.references')
          .select('document_code, title, paragraph_number, content_text')
          .in('document_code', moduleData.learning_qa_context.theological_sources);
        if (refsError) console.error('Error fetching theological references:', refsError);
        else theologicalReferences = refs || [];
      }
    }

    // 3. AI Model Interaction (Placeholder)
    // In a real scenario, this would involve calling an external LLM
    // with the user's query, aiContext, liturgicalContext, moduleData, and theologicalReferences
    // to generate a response.

    let aiResponseContent = `Saya belum dapat memproses pertanyaan Anda secara lengkap saat ini.`;
    let suggestedQuestions = [];
    let theologicalSourcesUsed = theologicalReferences.map(r => `${r.document_code} ${r.paragraph_number || r.title}`);

    // Example AI Logic (simplified placeholder)
    if (query.toLowerCase().includes('krisma') && moduleData?.module_code.includes('KRISMA')) {
      aiResponseContent = `Sakramen Krisma adalah sakramen inisiasi Kristiani yang menyempurnakan rahmat pembaptisan. Ini menguatkan iman dan melengkapi kita dengan karunia Roh Kudus untuk menjadi saksi Kristus.`;
      suggestedQuestions = ["Siapa yang menerima Krisma?", "Apa syarat penerimaan Krisma?"];
    } else if (moduleData && moduleData.learning_content.length > 0) {
        const currentContent = moduleData.learning_content.find((c: any) => c.id === current_content_id);
        if (currentContent?.content_type === 'text') {
            aiResponseContent = `Mengenai topik saat ini: ${currentContent.content_data.text.substring(0, 100)}... ` +
                                 `Apa yang ingin Anda ketahui lebih lanjut dari bagian ini?`;
        }
        suggestedQuestions = moduleData.learning_qa_context?.suggested_questions || ["Apa poin utama pelajaran ini?", "Bagaimana saya bisa menerapkan ini dalam hidup saya?"];
    } else {
        // Fallback for general theology questions using knowledge retriever
        const { data: retrieverResults, error: retrieverError } = await supabase
            .rpc('knowledge_retriever', { query_text: query, match_threshold: 0.7, match_count: 3 }); // Assuming an RPC function for vector search
        
        if (retrieverError) console.error('Retriever RPC error:', retrieverError);
        else {
            if (retrieverResults && retrieverResults.length > 0) {
                aiResponseContent = `Berdasarkan pengetahuan saya: ${retrieverResults[0].content_text.substring(0, 200)}... `;
                theologicalSourcesUsed = [...theologicalSourcesUsed, ...retrieverResults.map((r: any) => `${r.document_code} ${r.paragraph_number || r.title}`) ];
            }
        }
    }


    // 4. Update AI user interaction
    // await update_ai_interaction(userId); // Assuming this function is available

    // 5. Check for abuse (placeholder)
    // const filterResult = await check_for_abuse(query); // Placeholder function
    // if (filterResult.action === 'block') {
    //   await log_ai_abuse('Bot 8', userId, query, 'block', filterResult.reason, aiResponseContent, false);
    //   return NextResponse.json({ error: 'Input diblokir karena melanggar kebijakan' }, { status: 403 });
    // }

    return NextResponse.json({
      success: true,
      response: aiResponseContent,
      suggested_questions: suggestedQuestions,
      theological_sources: theologicalSourcesUsed,
      // debug_context: { aiContext, liturgicalContext, moduleData, theologicalReferences }, // For debugging
    });

  } catch (error) {
    console.error('Server error in POST /api/learn-catholic/chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}