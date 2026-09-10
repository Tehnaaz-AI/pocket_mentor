import React from 'react';
import { ArrowRight, Sparkles, BookOpen, Layers, CheckCircle, Zap, Shield, Brain, Play } from 'lucide-react';
import { api } from '../services/api';

export default function Landing({ onStartLearning, onQuickDemo }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/20 via-indigo-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI-Powered Study Assistant & Personal Revision Coach</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn messy notes into your{' '}
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              personal revision kit.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Stop passive re-reading. Pocket Mentor transforms raw lecture notes, PDFs, and slides into 
            60-second summaries, active recall flashcards, and diagnostic quizzes—then closes the loop by 
            turning your mistakes into targeted revision drills.
          </p>

          {/* Primary Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onQuickDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02] group"
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>Launch Instant 1-Click Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onStartLearning}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-brand-500/40 text-slate-200 hover:text-white font-semibold text-base transition-all shadow-md"
            >
              Sign Up Free
            </button>
          </div>

          {/* Dynamic Transformation Animation Preview */}
          <div className="pt-12 max-w-4xl mx-auto">
            <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-slate-400 font-mono ml-2">Core Learning Loop in Action</span>
                </div>
                <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-md">
                  Understand → Recall → Test → Revise
                </span>
              </div>

              {/* Three Pillars Representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* 1. Raw Notes */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-brand-400" />
                    <span>1. Unstructured Notes</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg line-clamp-3">
                    "Process Pi critical section... mutual exclusion needed... race condition... wait() decrements semaphore..."
                  </div>
                </div>

                {/* 2. AI Synthesis */}
                <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-brand-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span>2. AI Study Kit</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-brand-500/20 text-brand-300 font-semibold">⚡ 60s Takeaway</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/20 text-indigo-300 font-semibold">🗂️ Active Flashcards</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-purple-500/20 text-purple-300 font-semibold">📝 Diagnostic Quiz</span>
                  </div>
                </div>

                {/* 3. Targeted Revise Again */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>3. Smart Revise Loop</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Identifies mistakes from quiz answers and generates custom reinforcement mini-drills.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefit Pillars */}
      <section className="py-12 border-t border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Understand Deeply</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Receive crisp 60-second audio summaries, clear structured breakdowns, and memorable AI analogies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Recall & Retain</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Flip interactive 3D flashcards with Spaced Repetition ratings (Easy/Medium/Hard) to seal concepts in memory.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Diagnose & Revise</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Take timed or relaxed MCQ quizzes. Pocket Mentor maps your weak spots and immediately prescribes targeted practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        Pocket Mentor — Autonomous AI Revision System • Built with MERN + Intelligent AI
      </footer>
    </div>
  );
}
