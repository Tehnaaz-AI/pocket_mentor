import React from 'react';
import { ArrowRight, Sparkles, BookOpen, Layers, CheckCircle2, Zap, Brain } from 'lucide-react';

export default function Landing({ onStartLearning, onQuickDemo }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-white text-[#1c1c1e]">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff8e0] border border-[#ffd02f]/50 text-[#746019] text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffd02f]"></span>
            <span>Intelligent Academic Study Companion</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#1c1c1e] leading-[1.1] max-w-4xl mx-auto">
            Turn class notes into an{' '}
            <span className="underline decoration-[#ffd02f] decoration-4 underline-offset-4">
              active revision system.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#555a6a] max-w-2xl mx-auto font-normal leading-relaxed">
            Stop passive re-reading. Pocket Mentor transforms raw lecture notes and PDFs into high-yield 
            summaries, active recall flashcards, and diagnostic quizzes—then turns your quiz errors 
            into targeted revision drills.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onQuickDemo}
              className="btn-yellow px-7 py-3.5 text-sm font-semibold flex items-center space-x-2 w-full sm:w-auto shadow-card"
            >
              <Zap className="w-4 h-4 text-[#1c1c1e] fill-[#1c1c1e]" />
              <span>Launch 1-Click Guest Demo</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onStartLearning}
              className="btn-secondary px-7 py-3.5 text-sm font-semibold w-full sm:w-auto"
            >
              Create Account
            </button>
          </div>

          {/* Core Learning Loop Visualizer */}
          <div className="pt-12 max-w-4xl mx-auto">
            <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-[#fafbfc] shadow-card text-left space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-[#eef0f3] pb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e]" />
                  <span className="text-xs font-bold text-[#1c1c1e] uppercase tracking-wider">The Pocket Mentor Learning Loop</span>
                </div>
                <span className="badge-pill badge-yellow text-[10px]">
                  Ingest → Study → Quiz → Revise
                </span>
              </div>

              {/* Three Loop Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Unstructured Notes */}
                <div className="p-4 rounded-xl bg-white border border-[#e0e2e8] space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1c1c1e] uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-[#4262ff]" />
                    <span>1. Ingest Notes</span>
                  </div>
                  <p className="text-xs text-[#555a6a] leading-relaxed">
                    Paste raw bullet points or upload lecture documents in PDF, DOCX, or text format.
                  </p>
                </div>

                {/* 2. Structured Study Kit */}
                <div className="p-4 rounded-xl bg-white border border-[#e0e2e8] space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1c1c1e] uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-[#0fbcb0]" />
                    <span>2. Study Workspace</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="badge-pill badge-neutral text-[10px]">60s Summary</span>
                    <span className="badge-pill badge-neutral text-[10px]">Flashcards</span>
                    <span className="badge-pill badge-neutral text-[10px]">Memory Hooks</span>
                  </div>
                </div>

                {/* 3. Targeted Revise Again */}
                <div className="p-4 rounded-xl bg-white border border-[#e0e2e8] space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1c1c1e] uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-[#00b473]" />
                    <span>3. Diagnostic Revise</span>
                  </div>
                  <p className="text-xs text-[#555a6a] leading-relaxed">
                    Evaluates quiz errors and builds instant targeted reinforcement mini-drills.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="py-12 border-t border-[#eef0f3] bg-[#fafbfc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-miro p-6 border-[#e0e2e8] bg-white space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#fff8e0] flex items-center justify-center text-[#746019]">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1c1c1e]">Deep Conceptual Clarity</h3>
              <p className="text-xs text-[#555a6a] leading-relaxed">
                Concise summaries, audio narration, and memorable mental anchors for complex topics.
              </p>
            </div>

            <div className="card-miro p-6 border-[#e0e2e8] bg-white space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#f5f3ff] flex items-center justify-center text-[#4262ff]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1c1c1e]">Active Recall Drill</h3>
              <p className="text-xs text-[#555a6a] leading-relaxed">
                Flip 3D flashcards with immediate recall feedback to reinforce memory retention.
              </p>
            </div>

            <div className="card-miro p-6 border-[#e0e2e8] bg-white space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#e6f7f0] flex items-center justify-center text-[#00b473]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1c1c1e]">Autonomous Weakness Fix</h3>
              <p className="text-xs text-[#555a6a] leading-relaxed">
                Pinpoints exact concept gaps from quizzes and prescribes instant revision kits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-[#eef0f3] py-6 text-center text-xs text-[#8e91a0]">
        Pocket Mentor — Intelligent Academic OS • Quality-First Architecture
      </footer>
    </div>
  );
}
