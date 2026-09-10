import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Layers, Award, CheckCircle2, Loader2 } from 'lucide-react';

const stages = [
  { id: 0, label: 'Reading & Parsing', desc: 'Analyzing note structure & semantic relationships', icon: BookOpen },
  { id: 1, label: 'Synthesizing Concepts', desc: 'Extracting key takeaways, definitions, and mental models', icon: Sparkles },
  { id: 2, label: 'Generating Flashcards', desc: 'Formulating high-yield active-recall cards', icon: Layers },
  { id: 3, label: 'Assembling Quiz', desc: 'Drafting multiple-choice questions & diagnostic checks', icon: Award }
];

export default function AnimatedProgress({ isGenerating }) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStage(0);
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1e]/40 backdrop-blur-sm p-4">
      <div className="card-miro max-w-md w-full p-8 border-[#e0e2e8] bg-white shadow-lift text-center relative">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#fff8e0] border border-[#ffd02f]/50 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[#1c1c1e] animate-spin" />
        </div>

        <h3 className="text-xl font-bold text-[#1c1c1e] mb-1.5 tracking-tight">
          Generating Study Kit
        </h3>
        <p className="text-xs text-[#555a6a] mb-6 leading-relaxed">
          Pocket Mentor is building your concepts, flashcards, and diagnostic quiz.
        </p>

        {/* Sequential Stages */}
        <div className="space-y-3 text-left">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = currentStage > idx;
            const isActive = currentStage === idx;

            return (
              <div
                key={stage.id}
                className={`flex items-start space-x-3.5 p-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-[#fff8e0]/60 border-[#ffd02f]/50'
                    : isDone
                    ? 'bg-[#fafbfc] border-[#eef0f3]'
                    : 'bg-white border-[#f0f2f5] opacity-40'
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00b473]" />
                  ) : isActive ? (
                    <Icon className="w-4 h-4 text-[#1c1c1e] animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#c7cad5] flex items-center justify-center text-[10px] text-[#8e91a0] font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#1c1c1e] flex items-center space-x-2">
                    <span>{stage.label}</span>
                    {isActive && (
                      <span className="badge-pill badge-yellow text-[9px] py-0 px-1.5">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#555a6a] mt-0.5">{stage.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
