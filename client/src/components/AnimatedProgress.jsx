import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Layers, Award, CheckCircle2, Loader2 } from 'lucide-react';

const stages = [
  { id: 0, label: 'Reading Notes', desc: 'Parsing structure & text semantics', icon: BookOpen },
  { id: 1, label: 'Understanding', desc: 'Extracting key concepts & core ideas', icon: Sparkles },
  { id: 2, label: 'Creating Cards', desc: 'Synthesizing active-recall flashcards', icon: Layers },
  { id: 3, label: 'Building Quiz', desc: 'Assembling MCQs & diagnostic checks', icon: Award },
  { id: 4, label: 'Ready', desc: 'Study kit synthesized and ready!', icon: CheckCircle2 }
];

export default function AnimatedProgress({ isGenerating, onComplete }) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStage(0);
      return;
    }

    // Step through the actual generation stages smoothly
    const timer1 = setTimeout(() => setCurrentStage(1), 1200);
    const timer2 = setTimeout(() => setCurrentStage(2), 2400);
    const timer3 = setTimeout(() => setCurrentStage(3), 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="card-glass max-w-md w-full p-8 rounded-3xl border border-brand-500/30 shadow-2xl shadow-brand-500/20 text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
            Synthesizing Your Study Kit
          </h3>
          <p className="text-sm text-slate-400 mb-8">
            Pocket Mentor is turning raw notes into structured active-learning tools.
          </p>

          {/* Sequential Stage Timeline */}
          <div className="space-y-4 text-left">
            {stages.slice(0, 4).map((stage, idx) => {
              const Icon = stage.icon;
              const isDone = currentStage > idx;
              const isActive = currentStage === idx;

              return (
                <div
                  key={stage.id}
                  className={`flex items-start space-x-3.5 p-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-500/15 border border-brand-500/30 scale-[1.02]'
                      : isDone
                      ? 'bg-slate-900/60 opacity-80'
                      : 'opacity-40'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isActive ? (
                      <Icon className="w-5 h-5 text-brand-400 animate-pulse" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                      <span>{stage.label}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-500/30 text-brand-300 rounded uppercase tracking-wider">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{stage.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
