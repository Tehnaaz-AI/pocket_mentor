import React, { useEffect, useState } from 'react';
import { 
  Award, RefreshCw, CheckCircle2, XCircle, 
  Sparkles, ChevronDown, ChevronUp 
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
    if (accuracy >= 70) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [accuracy]);

  // Handle Revise Again
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Active Revision Mode */}
      {activeRevisionQuiz && !revisionSubmitted && (
        <div className="space-y-6">
          <div className="card-miro p-4 border-[#ffd02f]/60 bg-[#fff8e0]/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#1c1c1e]" />
              <span className="text-xs sm:text-sm font-semibold text-[#1c1c1e]">
                Targeted Drill: Revising {weakConcepts.join(', ')}
              </span>
            </div>
            <button
              onClick={() => setActiveRevisionQuiz(null)}
              className="text-xs text-[#555a6a] hover:text-[#1c1c1e] font-medium"
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
        <div className="card-miro p-6 sm:p-8 border-[#00b473]/30 bg-[#e6f7f0]/40 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-[#00b473] mx-auto" />
          <h3 className="text-lg font-bold text-[#1c1c1e]">Targeted Drill Complete</h3>
          <p className="text-xs text-[#555a6a]">
            Score: <span className="font-mono font-bold text-[#1c1c1e]">{revisionSubmitted.score}/{revisionSubmitted.total} ({revisionSubmitted.accuracy}%)</span>.
            Your updated mastery has been saved to your progress record.
          </p>
          <div className="pt-2">
            <button
              onClick={onBackToDashboard}
              className="btn-primary text-xs"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Primary Results Display */}
      {!activeRevisionQuiz && (
        <>
          {/* Score Header Card */}
          <div className="card-miro p-8 sm:p-10 border-[#e0e2e8] bg-white text-center space-y-6 shadow-card">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#f7f8fa] border-2 border-[#e0e2e8] flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-[#1c1c1e] font-mono leading-none">{accuracy}%</span>
                <span className="text-[9px] block uppercase text-[#8e91a0] font-semibold mt-0.5">Score</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#1c1c1e] tracking-tight">
                {accuracy >= 80 ? 'Solid Mastery Achieved' : accuracy >= 50 ? 'Good Progress Made' : 'Targeted Revision Recommended'}
              </h2>
              <p className="text-xs text-[#555a6a]">
                You answered <span className="font-bold text-[#1c1c1e] font-mono">{score}</span> of <span className="font-bold text-[#1c1c1e] font-mono">{total}</span> questions correctly.
              </p>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {weakConcepts.length > 0 && (
                <button
                  onClick={handleReviseAgain}
                  disabled={isRevising}
                  className="btn-yellow px-6 py-2.5 text-xs font-semibold flex items-center space-x-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRevising ? 'animate-spin' : ''}`} />
                  <span>{isRevising ? 'Building Revision Drill…' : 'Revise Weak Concepts Now'}</span>
                </button>
              )}

              <button
                onClick={onBackToDashboard}
                className="btn-secondary px-5 py-2.5 text-xs font-semibold"
              >
                Back to Home
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

          {/* Detailed Graded Question Review */}
          <div className="card-miro border-[#e0e2e8] bg-white p-6 sm:p-8 space-y-5">
            <div
              onClick={() => setShowReview(!showReview)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#1c1c1e]">
                  Detailed Answer Review
                </h3>
                <span className="badge-pill badge-neutral font-mono text-[10px]">
                  {gradedQuestions.length} Questions
                </span>
              </div>
              {showReview ? <ChevronUp className="w-4 h-4 text-[#8e91a0]" /> : <ChevronDown className="w-4 h-4 text-[#8e91a0]" />}
            </div>

            {showReview && (
              <div className="space-y-3.5 pt-2">
                {gradedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      q.isCorrect
                        ? 'bg-[#e6f7f0]/20 border-[#00b473]/30'
                        : 'bg-[#ffc6c6]/15 border-[#ff9999]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-[#00b473] flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#ff9999] flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold text-[#1c1c1e]">
                          Question {idx + 1}
                        </span>
                        <span className="badge-pill badge-neutral text-[10px]">
                          {q.concept}
                        </span>
                      </div>
                      <span className={`badge-pill text-[9px] ${
                        q.isCorrect ? 'badge-teal' : 'badge-coral'
                      }`}>
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-[#1c1c1e] mb-3 leading-relaxed">
                      {q.question}
                    </h4>

                    {/* Options list */}
                    <div className="space-y-1.5 mb-3">
                      {q.options?.map((opt, oIdx) => {
                        const isChosen = q.selectedOption === oIdx;
                        const isActualCorrect = q.correctOption === oIdx;

                        let optClass = 'bg-white border-[#e0e2e8] text-[#555a6a]';
                        if (isActualCorrect) {
                          optClass = 'bg-[#e6f7f0] border-[#00b473]/40 text-[#187574] font-medium';
                        } else if (isChosen && !isActualCorrect) {
                          optClass = 'bg-[#ffc6c6]/30 border-[#ff9999] text-[#600000] line-through';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${optClass}`}
                          >
                            <span>{opt}</span>
                            {isActualCorrect && (
                              <span className="text-[10px] font-bold text-[#00b473] ml-2">Correct Answer</span>
                            )}
                            {isChosen && !isActualCorrect && (
                              <span className="text-[10px] font-bold text-[#600000] ml-2">Your Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-white p-3 rounded-lg border border-[#e0e2e8] text-xs text-[#555a6a] leading-relaxed">
                        <span className="font-bold text-[#1c1c1e] mr-1">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
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
