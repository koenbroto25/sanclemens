export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';

interface FeedbackRequest {
  interaction_id?: string;
  qa_pair_id?: string;
  feedback_type: 'helpful' | 'not_helpful' | 'incorrect' | 'outdated';
  feedback_text?: string;
  bot_id: string;
  query: string;
  answer: string;
}

interface FeedbackResponse {
  success: boolean;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { interaction_id, qa_pair_id, feedback_type, feedback_text, bot_id, query, answer } = body;

    // Validate input
    if (!feedback_type || !bot_id || !query || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields: feedback_type, bot_id, query, answer' },
        { status: 400 }
      );
    }

    // Get user session
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Log feedback to ai_feedback_queue or ai_interaction_logs
    // For now, we'll log it as a special interaction log entry
    const { error: logError } = await supabase
      .from('ai_interaction_logs')
      .insert({
        user_id: user.id,
        bot_id,
        query: `[FEEDBACK] ${query}`,
        domain: 'feedback',
        question_type: feedback_type,
        sources_used: [],
        confidence: feedback_type === 'helpful' ? 1 : 0,
        was_redirected: false,
        was_refused: false,
        injection_attempt: false,
        rag_context_used: {
          interaction_id,
          qa_pair_id,
          feedback_text,
          answer_preview: answer.substring(0, 200)
        },
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging feedback:', logError);
      return NextResponse.json(
        { error: 'Failed to log feedback' },
        { status: 500 }
      );
    }

    // If qa_pair_id is provided, update the qa_pairs table with feedback
    if (qa_pair_id) {
      // We could increment a feedback counter or update status
      // For now, just log it
      console.log(`Feedback received for QA pair ${qa_pair_id}: ${feedback_type}`);
    }

    const response: FeedbackResponse = {
      success: true,
      message: 'Feedback submitted successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in /api/qa/feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}