'use client';

import Link from 'next/link';

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
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

interface Props {
  result: QuizResultData;
  questions: Question[];
  moduleCode: string;
  moduleTitle: string;
  slug: string;
  onRetry: () => void;
}

export function QuizResult({ result, questions, moduleCode, moduleTitle, slug, onRetry }: Props) {
  const { score, total_questions, percentage, passed, answers } = result;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/user/dashboard/learn-catholic/modul/${slug}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke Modul
        </Link>

        {/* Result Card */}
        <div className={`mt-6 p-8 rounded-2xl text-center border-2 ${
          passed ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="text-6xl mb-4">{passed ? '🎉' : '💪'}</div>
          <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-800' : 'text-amber-800'}`}>
            {passed ? 'Selamat! Kamu Lulus!' : 'Belum Lulus'}
          </h2>
          <p className="text-slate-600 mb-2">{moduleCode} — {moduleTitle}</p>
          <div className="text-5xl font-bold my-6 text-slate-800">
            {score}/{total_questions}
            <span className="text-2xl text-slate-500 ml-2">({percentage}%)</span>
          </div>
          {passed ? (
            <p className="text-green-600 mb-6">✅ Modul selesai! Modul berikutnya sudah terbuka.</p>
          ) : (
            <p className="text-amber-600 mb-6">Nilai minimal: 70%. Pelajari kembali dan coba lagi.</p>
          )}
          <div className="flex gap-3 justify-center">
            <Link
              href="/user/dashboard/learn-catholic"
              className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
            >
              📍 Peta Perjalanan
            </Link>
            {!passed && (
              <button onClick={onRetry} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700">
                🔄 Coba Lagi
              </button>
            )}
          </div>
        </div>

        {/* Detailed Review */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-slate-700">Review Jawaban</h3>
          {answers.map((a, i) => {
            const q = questions.find(q => q.id === a.question_id);
            return (
              <div key={a.question_id} className={`p-4 rounded-xl border ${a.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">{a.correct ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Soal {i + 1}: {q?.question}</p>
                    <p className="text-sm mt-1">
                      {a.correct ? (
                        <span className="text-green-600">Jawabanmu benar!</span>
                      ) : (
                        <span className="text-red-600">
                          Jawabanmu: {a.selected_option.toUpperCase()}. Benar: {a.correct_option.toUpperCase()}
                        </span>
                      )}
                    </p>
                    {a.explanation && <p className="text-sm text-slate-500 mt-2 italic">{a.explanation}</p>}
                    {a.source_reference && <p className="text-xs text-slate-400 mt-1">Ref: {a.source_reference}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}