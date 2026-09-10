import React, { useEffect, useState } from 'react';
import { 
  Award, RefreshCw, CheckCircle2, XCircle, ArrowRight, 
  RotateCcw, Sparkles, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import WeaknessMap from '../components/WeaknessMap';
import QuizCard from '../components/QuizCard';

export default function Results({ 
  quizResult, 
  session, 
  onBackToDashboard, 
  onOpenRevisionSession 
}) {
  const [showReview, setShowReview] = useState(true);
  const [isRevising, setIsRevising] = useState(false);
  const [activeRevisionQuiz, setActiveRevisionQuiz] = useState(null);
  const [revisionSubmitted, setRevisionSubmitted] = useState(null);

  const { score, total, accuracy, weakConcepts = [], gradedQuestions = [], conceptDiagnostics = {} } = quizResult;

  useEffect(() => {
    // Fire confetti for scores 70% and above
    if (accuracy >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [accuracy]);

  // Handle Revise Again click
  const handleReviseAgain = async () => {
    setIsRevising(true);
    try {
      const data = await api.generateReviseAgain(quizResult.quizId);
      setActiveRevisionQuiz(data.quiz);
    } catch (err) {
      console.error('Revise again failed:', err);
    } finally {
      setIsRevising(false);
    }
  };

  const handleRevisionSubmit = async (answers) => {
    if (!activeRevisionQuiz?._id) return;
    try {
      const res = await api.submitQuiz(activeRevisionQuiz._id, answers);
      setRevisionSubmitted(res);
    } catch (err) {
      console.error('Failed submitting revision quiz:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* If Active Revision Mode is ongoing */}
      {activeRevisionQuiz && !revisionSubmitted && (
        <div className="space-y-6">
          <div className="card-glass p-4 rounded-2xl border border-brand-500/30 bg-brand-950/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-bold text-white">
                Targeted Reinforcement Drill (Weak Concepts: {weakConcepts.join(', ')})
              </span>
            </div>
            <button
              onClick={() => setActiveRevisionQuiz(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Exit Revision
            </button>
          </div>

          <QuizCard
            quiz={activeRevisionQuiz}
            onSubmit={handleRevisionSubmit}
          />
        </div>
      )}

      {/* Revision Completed Banner */}
      {revisionSubmitted && (
        <div className="card-glass p-6 rounded-3xl border border-emerald-500/40 bg-emerald-950/20 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Targeted Revision Completed!</h3>
          <p className="text-sm text-slate-300">
            Revision Score: {revisionSubmitted.score}/{revisionSubmitted.total} ({revisionSubmitted.accuracy}%).
            You have strengthened your grasp on previously missed concepts!
          </p>
          <button
            onClick={onBackToDashboard}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Continue to Dashboard
          </button>
        </div>
      )}

      {/* Primary Results Display */}
      {!activeRevisionQuiz && (
        <>
          {/* Score Header Card */}
          <div className="card-glass p-8 sm:p-10 rounded-3xl border border-white/10 text-center relative overflow-hidden space-y-6 shadow-2xl">
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-900 border-4 border-brand-500/30 flex items-center justify-center relative shadow-inner">
              <div className="text-center">
                <span className="text-3xl font-black text-white">{accuracy}%</span>
                <span className="text-[10px] block uppercase text-slate-400 font-bold -mt-1">Accuracy</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {accuracy >= 80 ? 'Outstanding Retention! 🌟' : accuracy >= 50 ? 'Good Progress! 📈' : 'Needs Reinforcement 🎯'}
              </h2>
              <p className="text-sm text-slate-400">
                You correctly answered <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{total}</span> questions.
              </p>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {weakConcepts.length > 0 && (
                <button
                  onClick={handleReviseAgain}
                  disabled={isRevising}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-brand-600/30 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <RefreshCw className={`w-4 h-4 ${isRevising ? 'animate-spin' : ''}`} />
                  <span>{isRevising ? 'Generating Drill...' : 'Revise Weak Concepts Now'}</span>
                </button>
              )}

              <button
                onClick={onBackToDashboard}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-sm font-semibold transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Smart Weakness Map */}
          <WeaknessMap
            weakConcepts={weakConcepts}
            conceptDiagnostics={conceptDiagnostics}
            onReviseAgain={weakConcepts.length > 0 ? handleReviseAgain : null}
            isRevising={isRevising}
          />

          {/* Graded Question Review */}
          <div className="card-glass rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
            <div
              onClick={() => setShowReview(!showReview)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Detailed Question Review</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                  {gradedQuestions.length} Questions
                </span>
              </h3>
              {showReview ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>

            {showReview && (
              <div className="space-y-4 pt-2">
                {gradedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      q.isCorrect
                        ? 'bg-emerald-950/15 border-emerald-500/20'
                        : 'bg-rose-950/15 border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center space-x-2">
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Question {idx + 1} • {q.concept}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        q.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white mb-3 leading-relaxed">
                      {q.question}
                    </h4>

                    {/* Options list */}
                    <div className="space-y-2 mb-3">
                      {q.options?.map((opt, oIdx) => {
                        const isChosen = q.selectedOption === oIdx;
                        const isActualCorrect = q.correctOption === oIdx;

                        let optClass = 'bg-slate-900/60 border-white/5 text-slate-400';
                        if (isActualCorrect) {
                          optClass = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold';
                        } else if (isChosen && !isActualCorrect) {
                          optClass = 'bg-rose-500/20 border-rose-500/40 text-rose-200 line-through';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                          >
                            <span>{opt}</span>
                            {isActualCorrect && (
                              <span className="text-[10px] font-bold text-emerald-400 ml-2">Correct Answer</span>
                            )}
                            {isChosen && !isActualCorrect && (
                              <span className="text-[10px] font-bold text-rose-400 ml-2">Your Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Rationale / Explanation */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-slate-400 mr-1.5">Explanation:</span>
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
