import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Flame, Award, TrendingUp, CheckCircle2, 
  AlertTriangle, Clock, Calendar, Sparkles, BookOpen 
} from 'lucide-react';
import { api } from '../services/api';

export default function Progress({ onNavigate }) {
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProgress();
      setProgressData(res.progress);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  const topics = Object.entries(progressData?.topics || {}).map(([name, data]) => ({
    name,
    ...data,
    accuracy: data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0
  }));

  const history = progressData?.history || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-7 h-7 text-brand-400" />
          <span>Long-Term Revision & Mastery Analytics</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tracking knowledge retention, accuracy trends, and diagnosed weak concepts over time.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-glass p-6 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Overall Accuracy</span>
            <Award className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {progressData?.averageScore || 0}%
          </div>
          <p className="text-xs text-slate-400">
            Across {progressData?.totalQuizzes || 0} quiz assessments
          </p>
        </div>

        <div className="card-glass p-6 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Study Streak</span>
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {progressData?.studyStreak || 1} <span className="text-xs font-normal text-slate-400">Days</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium">
            Daily consistency builds long-term recall
          </p>
        </div>

        <div className="card-glass p-6 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Diagnosed Topics</span>
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {topics.length}
          </div>
          <p className="text-xs text-slate-400">
            {topics.filter(t => t.mastery === 'Mastered').length} Mastered • {topics.filter(t => t.mastery === 'Needs Review').length} Review Due
          </p>
        </div>
      </div>

      {/* Concept Mastery Breakdown */}
      <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          <span>Concept Mastery Index</span>
        </h2>

        {topics.length > 0 ? (
          <div className="space-y-4">
            {topics.map((t, idx) => {
              let badgeColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
              let barColor = 'bg-rose-500';
              if (t.mastery === 'Mastered') {
                badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                barColor = 'bg-emerald-500';
              } else if (t.mastery === 'Improving') {
                badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                barColor = 'bg-amber-500';
              }

              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{t.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                      {t.mastery}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t.correct} correct of {t.attempts} questions tested</span>
                    <span className="font-semibold text-slate-200">{t.accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${t.accuracy}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            Complete your first quiz to generate your concept mastery breakdown.
          </div>
        )}
      </div>

      {/* Quiz Attempt History Timeline */}
      {history.length > 0 && (
        <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Recent Quiz Sessions</span>
          </h2>
          <div className="divide-y divide-white/5">
            {history.slice(-6).reverse().map((h, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{h.topic}</div>
                  <div className="text-xs text-slate-400">{new Date(h.date).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${h.accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {h.accuracy}%
                  </span>
                  <div className="text-[11px] text-slate-500">{h.score} Correct</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
