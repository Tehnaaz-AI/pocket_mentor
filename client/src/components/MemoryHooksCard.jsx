import React from 'react';
import { Lightbulb, Compass, Zap, Sparkles } from 'lucide-react';

export default function MemoryHooksCard({ memoryHooks = [] }) {
  if (!memoryHooks || memoryHooks.length === 0) {
    return (
      <div className="card-miro p-10 text-center bg-[#fafbfc] border-[#e0e2e8]">
        <Sparkles className="w-10 h-10 text-[#0fbcb0] mx-auto mb-2" />
        <h4 className="text-base font-bold text-[#1c1c1e] mb-1">No Memory Hooks Available</h4>
        <p className="text-xs text-[#555a6a]">Memory hooks will be generated when notes contain rich conceptual models.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <span className="badge-pill badge-teal text-[10px]">
            RETENTION ANCHORS
          </span>
        </div>
        <h3 className="text-lg font-bold text-[#1c1c1e] tracking-tight mt-1">
          Memory Hooks & Mental Models
        </h3>
        <p className="text-xs text-[#555a6a]">
          Mnemonics and analogies engineered to trigger immediate recall under test conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memoryHooks.map((hook, idx) => (
          <div
            key={idx}
            className="card-miro p-5 border-[#e0e2e8] bg-white space-y-3.5 hover:border-[#0fbcb0]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1c1c1e] flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#0fbcb0]" />
                <span>{hook.concept}</span>
              </span>
              <span className="badge-pill badge-neutral text-[10px]">
                Anchor
              </span>
            </div>

            {/* Mnemonic Trick */}
            <div className="bg-[#fff8e0]/60 p-3.5 rounded-xl border border-[#ffd02f]/40 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#746019]">
                <Zap className="w-3.5 h-3.5" />
                <span>Mnemonic Trigger:</span>
              </div>
              <p className="text-xs text-[#1c1c1e] font-mono leading-relaxed">
                {hook.mnemonic}
              </p>
            </div>

            {/* Analogy */}
            <div className="bg-[#c3faf5]/25 p-3.5 rounded-xl border border-[#0fbcb0]/30 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#187574]">
                <Compass className="w-3.5 h-3.5" />
                <span>Real-World Analogy:</span>
              </div>
              <p className="text-xs text-[#2c2c34] leading-relaxed">
                {hook.analogy}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
