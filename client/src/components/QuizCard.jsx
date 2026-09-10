import React, { useState } from 'react';
import { HelpCircle, ArrowRight, ArrowLeft, Send } from 'lucide-react';

export default function QuizCard({ quiz, onSubmit, isSubmitting }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [q.id]: selectedOptionIndex }

  const questions = quiz?.questions || [];

  if (!questions || questions.length === 0) {
    return (
      <div className="card-miro p-12 text-center bg-[#fafbfc] border-[#e0e2e8]">
        <HelpCircle className="w-10 h-10 text-[#ffd02f] mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#1c1c1e] mb-1">No Quiz Generated</h3>
        <p className="text-xs text-[#555a6a]">Generate a study kit to test your retention with diagnostic questions.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIndex
    }));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(answers);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Quiz Top Header */}
      <div className="card-miro p-4 sm:p-5 border-[#e0e2e8] bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="badge-pill badge-neutral text-[10px]">
              {quiz.topic || 'Diagnostic Assessment'}
            </span>
            <span className="badge-pill badge-yellow font-mono text-[10px]">
              {answeredCount}/{questions.length} answered
            </span>
          </div>
          <p className="text-xs font-semibold text-[#1c1c1e] pt-1">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-32 bg-[#f0f2f5] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#1c1c1e] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Palette Navigation Dots */}
      <div className="flex items-center justify-center space-x-2 overflow-x-auto py-1">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = currentIndex === idx;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-7 h-7 rounded-full text-xs font-mono font-bold transition-all ${
                isCurrent
                  ? 'bg-[#1c1c1e] text-white shadow-subtle'
                  : isAnswered
                  ? 'bg-[#e6f7f0] text-[#00b473] border border-[#00b473]/40'
                  : 'bg-[#f7f8fa] text-[#8e91a0] border border-[#e0e2e8] hover:bg-[#eef0f3]'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Box */}
      <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-white shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <span className="badge-pill badge-neutral text-[10px]">
            Concept: {currentQ.concept || 'Core Idea'}
          </span>
          <span className="text-[11px] text-[#8e91a0]">
            Select one answer
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-[#1c1c1e] leading-snug">
          {currentQ.question}
        </h3>

        {/* MCQ Options */}
        <div className="space-y-2.5">
          {currentQ.options?.map((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = answers[currentQ.id] === optIdx;

            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={`flex items-center p-3.5 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-[#fff8e0]/70 border-[#ffd02f] shadow-sm text-[#1c1c1e]'
                    : 'bg-white border-[#e0e2e8] hover:bg-[#fafbfc] hover:border-[#c7cad5] text-[#2c2c34]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold mr-3 transition-colors ${
                    isSelected
                      ? 'bg-[#1c1c1e] text-white'
                      : 'bg-[#f7f8fa] border border-[#e0e2e8] text-[#555a6a]'
                  }`}
                >
                  {letter}
                </div>
                <span className="text-xs sm:text-sm font-medium flex-1">
                  {opt}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Card Navigation & Submission */}
        <div className="flex items-center justify-between pt-6 border-t border-[#eef0f3]">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary text-xs px-4 py-2 flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="btn-primary text-xs px-5 py-2 flex items-center space-x-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-yellow text-xs px-6 py-2 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>{isSubmitting ? 'Evaluating…' : 'Submit Quiz'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
