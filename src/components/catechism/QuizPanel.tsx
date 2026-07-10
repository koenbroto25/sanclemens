'use client';

import { useState } from 'react';

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order_index: number;
}

interface QuizPanelProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
}

export function QuizPanel({ questions, onSubmit }: QuizPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = questions.every(q => selectedAnswers[q.id]);

  const selectAnswer = (optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: optionId }));
  };

  const nextQuestion = () => {
    if (!isLastQuestion) setCurrentIndex(i => i + 1);
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(selectedAnswers);
    setSubmitting(false);
  };

  if (!currentQ) return null;

  return (
    <div>
      {/* Progress dots */}
      <div className="flex gap-1 mb-6 justify-center">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              selectedAnswers[questions[i]?.id]
                ? 'bg-amber-500'
                : i === currentIndex
                ? 'bg-amber-300 ring-2 ring-amber-200'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
        <p className="text-sm text-slate-400 mb-2">Pertanyaan {currentIndex + 1} dari {questions.length}</p>
        <p className="text-lg font-medium text-slate-800 mb-6">{currentQ.question}</p>

        <div className="space-y-3">
          {[
            { id: 'a', text: currentQ.option_a },
            { id: 'b', text: currentQ.option_b },
            { id: 'c', text: currentQ.option_c },
            { id: 'd', text: currentQ.option_d },
          ].map((opt) => {
            const isSelected = selectedAnswers[currentQ.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => selectAnswer(opt.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="font-semibold mr-2 text-slate-600">{opt.id.toUpperCase()}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-30"
        >
          ← Sebelumnya
        </button>

        <span className="text-sm text-slate-400">
          {Object.keys(selectedAnswers).length}/{questions.length} terjawab
        </span>

        {!isLastQuestion ? (
          <button
            onClick={nextQuestion}
            disabled={!selectedAnswers[currentQ.id]}
            className="px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-30"
          >
            Selanjutnya →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-30"
          >
            {submitting ? 'Mengirim...' : '✍️ Kumpulkan'}
          </button>
        )}
      </div>
    </div>
  );
}