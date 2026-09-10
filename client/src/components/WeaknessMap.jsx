import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

export default function WeaknessMap({ weakConcepts = [], conceptDiagnostics = {}, onReviseAgain, isRevising }) {
  // Map concept statuses
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
    <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Smart Weakness Map</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Diagnostic breakdown of concepts tested in this session.
          </p>
        </div>

        {weakConcepts.length > 0 && onReviseAgain && (
          <button
            onClick={onReviseAgain}
            disabled={isRevising}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevising ? 'animate-spin' : ''}`} />
            <span>{isRevising ? 'Building Revision...' : 'Revise Weak Concepts Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of Concept Diagnostic Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {conceptsList.map((item, idx) => {
          let badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
          let statusIcon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
          let barColor = 'bg-rose-500';

          if (item.status === 'Mastered') {
            badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            barColor = 'bg-emerald-500';
          } else if (item.status === 'Improving') {
            badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            statusIcon = <TrendingUp className="w-4 h-4 text-amber-400" />;
            barColor = 'bg-amber-500';
          }

          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3 hover:border-brand-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-slate-200 line-clamp-1">
                  {item.concept}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border flex items-center space-x-1 ${badgeColor}`}>
                  {statusIcon}
                  <span className="ml-1">{item.status}</span>
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Score: {item.correct}/{item.total}</span>
                  <span className="font-semibold text-slate-300">{item.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${barColor} h-full rounded-full transition-all duration-500`}
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
