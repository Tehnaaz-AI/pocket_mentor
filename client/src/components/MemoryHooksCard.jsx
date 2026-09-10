import React from 'react';
import { Lightbulb, Compass, Zap, Sparkles } from 'lucide-react';

export default function MemoryHooksCard({ memoryHooks = [] }) {
  if (!memoryHooks || memoryHooks.length === 0) {
    return (
      <div className="card-glass p-8 rounded-3xl text-center">
        <Sparkles className="w-10 h-10 text-brand-400 mx-auto mb-2 opacity-60" />
        <p className="text-sm text-slate-400">No memory hooks generated for this note.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white tracking-tight">AI Memory Hooks & Analogies</h3>
      </div>
      <p className="text-xs text-slate-400 -mt-2 mb-4">
        Mnemonics and real-world anchors engineered to trigger rapid recall during exams.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memoryHooks.map((hook, idx) => (
          <div
            key={idx}
            className="card-glass p-5 rounded-2xl border border-white/10 hover:border-brand-500/30 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-brand-400" />
                <span>{hook.concept}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Mental Anchor
              </span>
            </div>

            {/* Mnemonic */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Mnemonic Trick:</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {hook.mnemonic}
              </p>
            </div>

            {/* Analogy */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-300 mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Intuitive Analogy:</span>
              </div>
              <p className="text-xs text-slate-300">
                {hook.analogy}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
