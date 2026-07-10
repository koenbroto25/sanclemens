export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;

    // Find module
    const { data: mod } = await supabase
      .from('catechism_modules')
      .select('id, slug, code, title')
      .eq('slug', slug)
      .single();

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check progress — only allow quiz if module is unlocked/in_progress
    const { data: progress } = await supabase
      .from('catechism_progress')
      .select('status, quiz_passed')
      .eq('user_id', user.user.id)
      .eq('module_id', mod.id)
      .single();

    if (!progress || progress.status === 'locked') {
      return NextResponse.json({ error: 'Module locked. Complete the module first.' }, { status: 403 });
    }

    // If already passed quiz, allow review
    const isReview = progress.quiz_passed === true;

    // Fetch quiz questions (without correct_answer for active quiz)
    const { data: questions, error } = await supabase
      .from('catechism_quizzes')
      .select('id, question, option_a, option_b, option_c, option_d, explanation, source_reference, order_index')
      .eq('module_id', mod.id)
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No quiz available for this module yet' }, { status: 404 });
    }

    // Shuffle questions for fairness
    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    // For active quiz, remove correct_answer, explanation, source_reference from questions
    // For review, include everything
    const responseData = shuffled.map(q => {
      if (isReview) {
        return q;
      }
      // Also fetch correct_answer separately for review mode
      const { explanation, source_reference, ...publicQuestion } = q;
      return publicQuestion;
    });

    // Get previous attempts
    const { data: attempts } = await supabase
      .from('catechism_quiz_attempts')
      .select('score, total_questions, passed, answers, attempted_at')
      .eq('user_id', user.user.id)
      .eq('module_id', mod.id)
      .order('attempted_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      data: {
        module: { slug: mod.slug, code: mod.code, title: mod.title },
        questions: responseData,
        is_review: isReview,
        total_questions: questions.length,
        previous_attempts: attempts || [],
      },
      success: true,
    });
  } catch (error) {
    console.error('Server error in GET /api/catechism/quiz/[slug]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();
    const { answers } = body; // [{question_id, selected_option}]

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers array required' }, { status: 400 });
    }

    // Find module
    const { data: mod } = await supabase
      .from('catechism_modules')
      .select('id, code, title, order_index')
      .eq('slug', slug)
      .single();

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check progress
    const { data: progress } = await supabase
      .from('catechism_progress')
      .select('id, status')
      .eq('user_id', user.user.id)
      .eq('module_id', mod.id)
      .single();

    if (!progress || progress.status === 'locked') {
      return NextResponse.json({ error: 'Module locked' }, { status: 403 });
    }

    // Get correct answers
    const { data: questions } = await supabase
      .from('catechism_quizzes')
      .select('id, correct_answer, explanation, source_reference')
      .eq('module_id', mod.id)
      .eq('is_published', true);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No quiz available' }, { status: 404 });
    }

    const answerMap = new Map(questions.map(q => [q.id, q]));

    // Grade
    let score = 0;
    const gradedAnswers = answers.map(a => {
      const q = answerMap.get(a.question_id);
      const correct = q ? q.correct_answer === a.selected_option : false;
      if (correct) score++;
      return {
        question_id: a.question_id,
        selected_option: a.selected_option,
        correct_option: q?.correct_answer || '',
        correct,
        explanation: q?.explanation || '',
        source_reference: q?.source_reference || '',
      };
    });

    const totalQuestions = questions.length;
    const passed = (score / totalQuestions) >= 0.7; // 70% passing score

    // Save attempt
    const { error: attemptError } = await supabase
      .from('catechism_quiz_attempts')
      .insert({
        user_id: user.user.id,
        module_id: mod.id,
        score,
        total_questions: totalQuestions,
        passed,
        answers: gradedAnswers,
      });

    if (attemptError) {
      console.error('Error saving quiz attempt:', attemptError);
    }

    // If passed, update progress
    if (passed) {
      await supabase
        .from('catechism_progress')
        .update({
          status: 'completed',
          quiz_passed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id);
    }

    return NextResponse.json({
      data: {
        score,
        total_questions: totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        passed,
        answers: gradedAnswers,
      },
      success: true,
    });
  } catch (error) {
    console.error('Server error in POST /api/catechism/quiz/[slug]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}