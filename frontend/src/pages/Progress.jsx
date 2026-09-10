import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Flame, Award, BookOpen, Clock, 
  Sparkles, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';

export default function Progress({ onNavigate, onOpenSession }) {
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
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Sparkles className="w-6 h-6 text-[#ffd02f] animate-pulse" />
        <span className="text-xs text-[#555a6a] font-medium">Loading your progress history…</span>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1.5 border-b border-[#e0e2e8] pb-6">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8e91a0]">
            Analytics & Growth
          </span>
          <span className="w-1 h-1 rounded-full bg-[#8e91a0]"></span>
          <span className="badge-pill badge-teal text-[10px]">
            Real Data
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] tracking-tight">
          Learning Progress & Concept Mastery
        </h1>
        <p className="text-sm text-[#555a6a]">
          Direct diagnostics of your retention rate, quiz assessments, and concept strength over time.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-miro p-6 border-[#e0e2e8] bg-white space-y-2">
          <div className="flex items-center justify-between text-[#8e91a0] text-xs font-medium">
            <span>Overall Accuracy</span>
            <Award className="w-4 h-4 text-[#4262ff]" />
          </div>
          <div className="text-3xl font-bold text-[#1c1c1e] font-mono">
            {progressData?.averageScore ?? 0}%
          </div>
          <p className="text-xs text-[#555a6a]">
            Across {progressData?.totalQuizzes || 0} quiz assessments
          </p>
        </div>

        <div className="card-miro p-6 border-[#e0e2e8] bg-white space-y-2">
          <div className="flex items-center justify-between text-[#8e91a0] text-xs font-medium">
            <span>Active Study Streak</span>
            <Flame className="w-4 h-4 text-[#ffd02f] fill-[#ffd02f]" />
          </div>
          <div className="text-3xl font-bold text-[#1c1c1e] font-mono">
            {progressData?.studyStreak || 1} <span className="text-xs font-normal text-[#8e91a0] font-sans">days</span>
          </div>
          <p className="text-xs text-[#00b473] font-medium">
            Daily consistency reinforces long-term memory
          </p>
        </div>

        <div className="card-miro p-6 border-[#e0e2e8] bg-white space-y-2">
          <div className="flex items-center justify-between text-[#8e91a0] text-xs font-medium">
            <span>Diagnosed Topics</span>
            <BookOpen className="w-4 h-4 text-[#0fbcb0]" />
          </div>
          <div className="text-3xl font-bold text-[#1c1c1e] font-mono">
            {topics.length}
          </div>
          <p className="text-xs text-[#555a6a]">
            {topics.filter(t => t.mastery === 'Mastered').length} Mastered • {topics.filter(t => t.mastery === 'Needs Review').length} Review Due
          </p>
        </div>
      </div>

      {/* Concept Mastery Breakdown */}
      <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-white space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1c1c1e] tracking-tight flex items-center space-x-2">
            <span>Concept Mastery Breakdown</span>
          </h2>
          <span className="text-xs text-[#8e91a0]">
            {topics.length} concepts diagnosed
          </span>
        </div>

        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((t, idx) => {
              let badgeClass = 'badge-coral';
              let barColor = 'bg-[#ff9999]';
              if (t.mastery === 'Mastered') {
                badgeClass = 'badge-teal';
                barColor = 'bg-[#00b473]';
              } else if (t.mastery === 'Improving') {
                badgeClass = 'badge-yellow';
                barColor = 'bg-[#ffd02f]';
              }

              return (
                <div key={idx} className="p-4 rounded-xl bg-[#fafbfc] border border-[#e0e2e8] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-[#1c1c1e]">{t.name}</span>
                    <span className={`badge-pill text-[10px] ${badgeClass}`}>
                      {t.mastery}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#555a6a] font-mono">
                    <span>{t.correct} correct / {t.attempts} tested</span>
                    <span className="font-bold text-[#1c1c1e]">{t.accuracy}%</span>
                  </div>
                  <div className="w-full bg-[#f0f2f5] h-1.5 rounded-full overflow-hidden">
                    <div className={`${barColor} h-full rounded-full transition-all duration-300`} style={{ width: `${t.accuracy}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-[#8e91a0] text-xs rounded-xl bg-[#fafbfc] border border-dashed border-[#e0e2e8]">
            Your learning history and concept mastery will appear here after your first quiz assessment.
          </div>
        )}
      </div>

      {/* Quiz Attempt History Timeline */}
      {history.length > 0 && (
        <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-white space-y-4">
          <h2 className="text-base font-bold text-[#1c1c1e] tracking-tight">
            Recent Assessment History
          </h2>
          <div className="divide-y divide-[#eef0f3]">
            {history.slice(-8).reverse().map((h, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#1c1c1e]">{h.topic}</div>
                  <div className="text-[11px] text-[#8e91a0]">{new Date(h.date).toLocaleDateString()} at {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-right">
                  <span className={`text-xs sm:text-sm font-bold font-mono ${h.accuracy >= 70 ? 'text-[#00b473]' : 'text-[#746019]'}`}>
                    {h.accuracy}%
                  </span>
                  <div className="text-[11px] text-[#8e91a0]">{h.score} correct</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
