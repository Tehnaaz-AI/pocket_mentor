import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Award, BookOpen, Layers, PlusCircle, 
  ArrowRight, Clock, RefreshCw, AlertTriangle, Zap, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import RevisionTodoList from '../components/RevisionTodoList';
import NextBestAction from '../components/NextBestAction';

export default function Dashboard({ user, onNavigate, onOpenSession, onStartSession }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Greeting & Daily Goal Banner */}
      <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-md">
                Active Student Workspace
              </span>
              {/* Reads the student's real study budget, which is also what the
                  priority engine fits today's plan to. */}
              <span className="text-xs text-slate-400">
                Daily Goal: {stats?.dailyStudyMinutes || 90} mins
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Scholar'}! 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Turn your class notes into quick summaries, flashcards, and diagnostic quizzes. Review your weak spots to boost retention.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('import')}
              className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-600/25 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Import New Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Next Best Action — the Academic OS layer, inside the existing dashboard */}
      <NextBestAction
        onStartSession={onStartSession || onOpenSession}
        onNavigate={onNavigate}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Streak */}
        <div className="card-glass p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.streak || user?.streak || 1} <span className="text-xs text-slate-400 font-normal">Days</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center">
            <span>+1 today • Keep momentum</span>
          </p>
        </div>

        {/* Metric 2: Quiz Accuracy */}
        <div className="card-glass p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Average Accuracy</span>
            <Award className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.averageScore || 0}%
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Across {stats?.totalQuizzes || 0} quizzes taken
          </p>
        </div>

        {/* Metric 3: Study Kits */}
        <div className="card-glass p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Study Kits</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.totalKits || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Generated revision modules
          </p>
        </div>

        {/* Metric 4: Weak Spots */}
        <div className="card-glass p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Concepts for Review</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {stats?.weakTopics?.length || 0}
          </div>
          <p className="text-[11px] text-rose-300/80 font-medium">
            Diagnosed by quiz engine
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Study Kits & Revision Due */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Quick Revision To-Do List & Recent Study Kits */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Revision To-Do List */}
          <RevisionTodoList
            userId={user?.id}
            weakTopics={stats?.weakTopics || []}
            recentSessions={stats?.recentSessions || []}
            onOpenSession={onOpenSession}
            onNavigate={onNavigate}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-brand-400" />
                <span>Recent Revision Study Kits</span>
              </h2>
            <button
              onClick={() => onNavigate('import')}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
            >
              + Create New
            </button>
          </div>

          {stats?.recentSessions && stats.recentSessions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSessions.map(session => (
                <div
                  key={session._id}
                  onClick={() => onOpenSession(session._id)}
                  className="card-glass card-glass-hover p-5 rounded-2xl border border-white/10 cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {session.subject || 'General'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                      {session.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {session.sixtySecondSummary?.coreIdea || 'Active study session with flashcards and quiz.'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-slate-400 group-hover:text-brand-300 transition-colors pl-4">
                    <span className="text-xs font-semibold hidden sm:inline">Open Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-glass p-8 rounded-3xl text-center space-y-4">
              <Sparkles className="w-12 h-12 text-brand-400 mx-auto opacity-50" />
              <div>
                <h3 className="text-base font-bold text-white">No Study Kits Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Upload your class notes, lecture slides, or paste text to generate your first AI revision kit.
                </p>
              </div>
              <button
                onClick={() => onNavigate('import')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Create Study Kit
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Right 1 Col: Revision Due & Quick 60s Actions */}
        <div className="space-y-6">
          {/* Revision Due Card */}
          <div className="card-glass p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                <RefreshCw className="w-4 h-4" />
                <span>Revision Due</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                High Priority
              </span>
            </div>

            {stats?.weakTopics && stats.weakTopics.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  You missed questions on these concepts in your recent quizzes:
                </p>
                <div className="space-y-2">
                  {stats.weakTopics.slice(0, 3).map((w, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-200">{w.concept}</span>
                      <span className="text-[10px] text-rose-300 font-semibold">{w.correct}/{w.attempts} Correct</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300">All Topics Solid!</p>
                <p className="text-[11px] text-emerald-400/80">No active weak spots diagnosed yet.</p>
              </div>
            )}
          </div>

          {/* Quick Action: 60-Second Revision */}
          <div className="card-glass p-6 rounded-3xl border border-brand-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/40 space-y-3">
            <div className="flex items-center space-x-2 text-brand-300">
              <Zap className="w-4 h-4 fill-brand-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Quick Action</span>
            </div>
            <h4 className="text-sm font-bold text-white">60-Second Rapid Revision</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have only a minute before class? Jump straight into your most recent high-yield summary.
            </p>
            {stats?.recentSessions?.[0] ? (
              <button
                onClick={() => onOpenSession(stats.recentSessions[0]._id)}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20"
              >
                Review "{stats.recentSessions[0].title.slice(0, 25)}..."
              </button>
            ) : (
              <button
                onClick={() => onNavigate('import')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Import Notes First
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
