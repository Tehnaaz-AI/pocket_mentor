import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

export default function WeaknessMap({ weakConcepts = [], conceptDiagnostics = {}, onReviseAgain, isRevising }) {
  const conceptsList = Object.entries(conceptDiagnostics).map(([concept, data]) => {
    const accuracy = data.total > 0 ? (data.correct / data.total) : 0;
    let status = 'Needs Review';
    if (accuracy === 1) status = 'Mastered';
    else if (accuracy >= 0.5) status = 'Improving';

    return {
      concept,
      total: data.total,
      correct: data.correct,
      accuracy: Math.round(accuracy * 100),
      status
    };
  });

  return (
    <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-white space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="badge-pill badge-coral text-[10px]">
              GAP DIAGNOSTICS
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#1c1c1e] tracking-tight mt-1">
            Concept Diagnostics & Retention
          </h3>
          <p className="text-xs text-[#555a6a]">
            Performance breakdown across each specific concept tested in this quiz.
          </p>
        </div>

        {weakConcepts.length > 0 && onReviseAgain && (
          <button
            onClick={onReviseAgain}
            disabled={isRevising}
            className="btn-primary text-xs px-4 py-2 flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevising ? 'animate-spin' : ''}`} />
            <span>{isRevising ? 'Building Revision…' : 'Revise Weak Concepts'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of Concept Diagnostic Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {conceptsList.map((item, idx) => {
          let badgeClass = 'badge-coral';
          let statusIcon = <AlertTriangle className="w-3 h-3 text-[#600000]" />;
          let barColor = 'bg-[#ff9999]';

          if (item.status === 'Mastered') {
            badgeClass = 'badge-teal';
            statusIcon = <CheckCircle2 className="w-3 h-3 text-[#00b473]" />;
            barColor = 'bg-[#00b473]';
          } else if (item.status === 'Improving') {
            badgeClass = 'badge-yellow';
            statusIcon = <TrendingUp className="w-3 h-3 text-[#746019]" />;
            barColor = 'bg-[#ffd02f]';
          }

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#fafbfc] border border-[#e0e2e8] space-y-3 hover:border-[#c7cad5] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-[#1c1c1e] line-clamp-1">
                  {item.concept}
                </span>
                <span className={`badge-pill text-[9px] ${badgeClass}`}>
                  {statusIcon}
                  <span>{item.status}</span>
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-[#555a6a] mb-1 font-mono">
                  <span>{item.correct}/{item.total} correct</span>
                  <span className="font-bold text-[#1c1c1e]">{item.accuracy}%</span>
                </div>
                <div className="w-full bg-[#f0f2f5] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${barColor} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
