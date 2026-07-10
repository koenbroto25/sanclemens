'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QuizPanel } from '@/components/catechism/QuizPanel';
import { QuizResult } from '@/components/catechism/QuizResult';

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order_index: number;
}

interface GradedAnswer {
  question_id: string;
  selected_option: string;
  correct_option: string;
  correct: boolean;
  explanation: string;
  source_reference: string;
}

interface QuizResultData {
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  answers: GradedAnswer[];
}

export default function QuizPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/catechism/quiz/${slug}`);
        if (!res.ok) {
          const json = await res.json();
          setError(json.error || 'Gagal memuat kuis.');
          return;
        }
        const json = await res.json();
        if (json.success) {
          setQuestions(json.data.questions);
          setModuleTitle(json.data.module.title);
          setModuleCode(json.data.module.code);
        }
      } catch {
        setError('Terjadi kesalahan memuat kuis.');
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [slug]);

  const handleSubmit = async (answers: Record<string, string>) => {
    try {
      const answersPayload = Object.entries(answers).map(([qId, selected]) => ({
        question_id: qId,
        selected_option: selected,
      }));
      const res = await fetch(`/api/catechism/quiz/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersPayload }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
    } catch {
      setError('Gagal mengirim jawaban.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Kuis Tidak Tersedia</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link href={`/user/dashboard/learn-catholic/modul/${slug}`}
            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            ← Kembali
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    return <QuizResult result={result} questions={questions} moduleCode={moduleCode} moduleTitle={moduleTitle} slug={slug} onRetry={() => setResult(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href={`/user/dashboard/learn-catholic/modul/${slug}`}
          className="text-sm text-slate-500 hover:text-slate-700">
          ← Kembali ke Modul
        </Link>

        <h1 className="text-xl font-bold text-slate-800 mt-4 mb-1">
          Kuis: {moduleCode}
        </h1>
        <p className="text-sm text-slate-500 mb-6">{moduleTitle}</p>

        <QuizPanel questions={questions} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}