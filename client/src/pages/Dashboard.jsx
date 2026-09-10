import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Award, BookOpen, Layers, PlusCircle, 
  ArrowRight, Clock, AlertTriangle, CheckCircle2 
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e0e2e8] pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8e91a0]">
              Academic Workspace
            </span>
            <span className="w-1 h-1 rounded-full bg-[#8e91a0]"></span>
            <span className="text-xs text-[#555a6a]">
              Daily Target: {stats?.dailyStudyMinutes || 90}m
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Scholar'}
          </h1>
          <p className="text-sm text-[#555a6a]">
            Your learning plan is prioritized by upcoming deadlines, quiz gaps, and retention decay.
          </p>
        </div>

        {/* Quick CTA */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('import')}
            className="btn-primary flex items-center space-x-2 text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Import Notes</span>
          </button>
        </div>
      </div>

      {/* Primary Centerpiece: Next Best Action */}
      <NextBestAction
        onStartSession={onStartSession || onOpenSession}
        onNavigate={onNavigate}
      />

      {/* Metrics Row — Clean, Restrained, Real Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Streak */}
        <div className="card-miro p-5 space-y-2 bg-white">
          <div className="flex items-center justify-between text-[#8e91a0]">
            <span className="text-xs font-medium">Study Streak</span>
            <Flame className="w-4 h-4 text-[#ffd02f] fill-[#ffd02f]" />
          </div>
          <div className="text-2xl font-bold text-[#1c1c1e] font-mono">
            {stats?.streak || user?.streak || 1} <span className="text-xs text-[#8e91a0] font-sans font-normal">days</span>
          </div>
          <p className="text-[11px] text-[#00b473] font-medium">
            Active daily momentum
          </p>
        </div>

        {/* Metric 2: Quiz Accuracy */}
        <div className="card-miro p-5 space-y-2 bg-white">
          <div className="flex items-center justify-between text-[#8e91a0]">
            <span className="text-xs font-medium">Average Accuracy</span>
            <Award className="w-4 h-4 text-[#4262ff]" />
          </div>
          <div className="text-2xl font-bold text-[#1c1c1e] font-mono">
            {stats?.averageScore ?? 0}%
          </div>
          <p className="text-[11px] text-[#8e91a0]">
            Across {stats?.totalQuizzes || 0} quizzes taken
          </p>
        </div>

        {/* Metric 3: Study Kits */}
        <div className="card-miro p-5 space-y-2 bg-white">
          <div className="flex items-center justify-between text-[#8e91a0]">
            <span className="text-xs font-medium">Active Study Kits</span>
            <Layers className="w-4 h-4 text-[#0fbcb0]" />
          </div>
          <div className="text-2xl font-bold text-[#1c1c1e] font-mono">
            {stats?.totalKits || 0}
          </div>
          <p className="text-[11px] text-[#8e91a0]">
            Generated revision modules
          </p>
        </div>

        {/* Metric 4: Diagnosed Weak Spots */}
        <div className="card-miro p-5 space-y-2 bg-white">
          <div className="flex items-center justify-between text-[#8e91a0]">
            <span className="text-xs font-medium">Concepts to Review</span>
            <AlertTriangle className="w-4 h-4 text-[#ff9999]" />
          </div>
          <div className="text-2xl font-bold text-[#1c1c1e] font-mono">
            {stats?.weakTopics?.length || 0}
          </div>
          <p className="text-[11px] text-[#ff9999] font-medium">
            Diagnosed by quiz engine
          </p>
        </div>
      </div>

      {/* Secondary Grid: Recent Kits & Contextual Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: To-Do Goals & Recent Study Kits */}
        <div className="lg:col-span-2 space-y-6">
          <RevisionTodoList
            userId={user?.id}
            weakTopics={stats?.weakTopics || []}
            recentSessions={stats?.recentSessions || []}
            onOpenSession={onOpenSession}
            onNavigate={onNavigate}
          />

          {/* Recent Study Kits */}
          <div className="card-miro p-6 sm:p-7 border-[#e0e2e8] bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#1c1c1e]" />
                <h3 className="text-base font-bold text-[#1c1c1e] tracking-tight">
                  Recent Study Kits
                </h3>
              </div>
              <button
                onClick={() => onNavigate('import')}
                className="text-xs font-semibold text-[#4262ff] hover:underline"
              >
                + Create New
              </button>
            </div>

            {stats?.recentSessions && stats.recentSessions.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => onOpenSession(session._id)}
                    className="p-4 rounded-xl border border-[#e0e2e8] hover:border-[#4262ff]/50 bg-white hover:bg-[#f7f8fa] cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1 mr-4">
                      <div className="flex items-center space-x-2">
                        <span className="badge-pill badge-neutral text-[10px]">
                          {session.subject || 'General'}
                        </span>
                        <span className="text-[11px] text-[#8e91a0] flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1c1c1e] group-hover:text-[#4262ff] transition-colors truncate">
                        {session.title}
                      </h4>
                      <p className="text-xs text-[#555a6a] line-clamp-1">
                        {session.sixtySecondSummary?.coreIdea || 'Active study session with concepts, flashcards and quiz.'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 text-[#8e91a0] group-hover:text-[#4262ff] transition-colors flex-shrink-0">
                      <span className="text-xs font-medium hidden sm:inline">Open</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#8e91a0] text-xs rounded-xl bg-[#fafbfc] border border-dashed border-[#e0e2e8] space-y-2">
                <p>No study kits created yet.</p>
                <button
                  onClick={() => onNavigate('import')}
                  className="btn-primary text-xs py-1.5 px-3.5"
                >
                  Import Your First Notes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Revision Needs & Quick Recall */}
        <div className="space-y-6">
          {/* Weak Concepts Card */}
          <div className="card-miro p-6 border-[#e0e2e8] bg-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1c1c1e] flex items-center space-x-1.5">
                <span>Concepts for Review</span>
              </span>
              <span className="badge-pill badge-coral text-[10px]">
                Quiz Gaps
              </span>
            </div>

            {stats?.weakTopics && stats.weakTopics.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-[#555a6a]">
                  These concepts were missed in recent quiz assessments:
                </p>
                <div className="space-y-2">
                  {stats.weakTopics.slice(0, 3).map((w, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#fff8e0]/60 border border-[#ffd02f]/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1c1c1e]">{w.concept}</span>
                      <span className="text-[11px] font-mono font-medium text-[#746019]">{w.correct}/{w.attempts} correct</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#f7f8fa] border border-[#e0e2e8] text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-[#00b473] mx-auto" />
                <p className="text-xs font-bold text-[#1c1c1e]">All Concepts Solid</p>
                <p className="text-[11px] text-[#8e91a0]">No active quiz weak spots diagnosed.</p>
              </div>
            )}
          </div>

          {/* Quick Rapid Recall */}
          {stats?.recentSessions?.[0] && (
            <div className="card-miro p-6 border-[#e0e2e8] bg-[#f7f8fa] space-y-3">
              <div className="badge-pill badge-yellow text-[10px]">
                RAPID RECALL
              </div>
              <h4 className="text-sm font-bold text-[#1c1c1e]">
                60-Second Refresher
              </h4>
              <p className="text-xs text-[#555a6a] leading-relaxed">
                Review your core summary before class or an exam.
              </p>
              <button
                onClick={() => onOpenSession(stats.recentSessions[0]._id)}
                className="btn-secondary w-full text-xs py-2 bg-white"
              >
                Review "{stats.recentSessions[0].title.slice(0, 24)}…"
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
