import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle, HelpCircle, AlertCircle, ArrowRight, ArrowLeft, Send } from 'lucide-react';

export default function QuizCard({ quiz, onSubmit, isSubmitting }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [q.id]: selectedOptionIndex }
  const [examMode, setExamMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 5); // 5 minutes default

  const questions = quiz?.questions || [];

  // Exam mode timer countdown
  useEffect(() => {
    if (!examMode) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [examMode, timeLeft]);

  if (!questions || questions.length === 0) {
    return (
      <div className="card-glass p-12 rounded-3xl text-center">
        <HelpCircle className="w-12 h-12 text-brand-400 mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-white mb-1">No Quiz Generated Yet</h3>
        <p className="text-sm text-slate-400">Generate a study kit to test your knowledge.</p>
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Quiz Top Bar */}
      <div className="card-glass p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
              {quiz.topic || 'Diagnostic Assessment'}
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded-md">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>
          <p className="text-sm font-bold text-white mt-1">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Exam Mode Toggle & Timer */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setExamMode(!examMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              examMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-slate-200'
            }`}
          >
            {examMode ? 'Exam Mode Active' : 'Enable Exam Mode'}
          </button>

          {examMode && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 font-mono text-sm font-bold">
              <Timer className="w-4 h-4 animate-spin-slow" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
        <div
          className="bg-gradient-to-r from-brand-600 to-indigo-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
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
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-brand-600 text-white ring-2 ring-brand-400 shadow-md shadow-brand-600/30'
                  : isAnswered
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-slate-900 text-slate-500 border border-white/5 hover:bg-slate-800'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Box */}
      <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl relative">
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/20">
            Target Concept: {currentQ.concept || 'Foundational'}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Single Choice
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-6 leading-relaxed">
          {currentQ.question}
        </h3>

        {/* MCQ Options */}
        <div className="space-y-3">
          {currentQ.options?.map((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
            const isSelected = answers[currentQ.id] === optIdx;

            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={`flex items-center p-4 rounded-2xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-brand-600/20 border-brand-500 shadow-lg shadow-brand-600/10 text-white translate-x-1'
                    : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/70 hover:border-white/10 text-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold mr-3.5 transition-colors ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {letter}
                </div>
                <span className="text-sm sm:text-base font-medium flex-1">
                  {opt}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Card Navigation & Submission */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Previous</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-600/20 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all animate-pulse-subtle"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Quiz'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
