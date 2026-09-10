import React, { useState, useEffect } from 'react';
import {
  Target, Sparkles, ChevronDown, ChevronUp, Clock, ArrowRight,
  AlertTriangle, RefreshCw, Upload, TrendingUp, CalendarClock, Flag
} from 'lucide-react';
import { api } from '../services/api';

/**
 * "What should I do today?" — the Academic OS surfaced inside the existing
 * PocketMentor dashboard.
 *
 * Deliberately NOT a separate dashboard: this mounts above the existing
 * metrics row, and Start Session hands off into the Study Workspace the
 * student already knows, using the same session handoff that Import Notes uses.
 *
 * The priority score and its five factors are computed on the server and only
 * displayed here, so what the student reads is exactly what decided the plan.
 */

const FACTOR_LABELS = {
  weakness: 'Weakness',
  recentFailure: 'Recent failures',
  deadlineUrgency: 'Deadline urgency',
  goalRelevance: 'Goal relevance',
  timeFit: 'Time fit'
};

const FACTOR_HINTS = {
  weakness: 'How far this topic is from mastery (10 − mastery)',
  recentFailure: 'How badly, and how consistently, recent quizzes went',
  deadlineUrgency: 'How close a deadline for this subject is',
  goalRelevance: 'Whether this topic serves an active goal',
  timeFit: 'Whether today’s free time suits a session on it'
};

export default function NextBestAction({ onStartSession, onNavigate }) {
  const [recommendation, setRecommendation] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [emptyMessage, setEmptyMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getNextBestAction();
      setRecommendation(data.recommendation);
      setRanking(data.ranking || []);
      setEmptyMessage(data.recommendation ? null : data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const data = await api.generateRecommendation();
      setRecommendation(data.recommendation);
      setRanking(data.ranking || []);
      setEmptyMessage(data.recommendation ? null : data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleStart = async () => {
    if (!recommendation) return;
    setIsStarting(true);
    setError(null);
    try {
      const data = await api.startRecommendation(recommendation._id);

      // No notes for this topic yet — send the student to the importer rather
      // than fabricating study material.
      if (data.actionType === 'import' || !data.sessionId) {
        onNavigate?.('import');
        return;
      }
      // Hand off to the existing Study Workspace.
      onStartSession?.(data.sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  /* ---------------------------------------------------------------- loading */
  if (isLoading) {
    return (
      <div className="card-glass p-6 rounded-3xl border border-brand-500/25 flex items-center space-x-3">
        <Sparkles className="w-5 h-5 text-brand-400 animate-pulse" />
        <span className="text-sm text-slate-400">Working out what you should study today…</span>
      </div>
    );
  }

  /* ------------------------------------------------------------------ empty */
  if (!recommendation) {
    return (
      <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">What should I do today?</h2>
        </div>
        <p className="text-sm text-slate-400 max-w-xl">
          {emptyMessage || 'Import your notes and take a quiz — Pocket Mentor learns your weak topics from your own material and then tells you what to study next.'}
        </p>
        <button
          onClick={() => onNavigate?.('import')}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all inline-flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Import Notes</span>
        </button>
      </div>
    );
  }

  const factors = recommendation.factors || {};
  const scorePct = Math.round((recommendation.priorityScore / 50) * 100);
  const needsNotes = recommendation.actionType === 'import';

  return (
    <div className="card-glass rounded-3xl border border-brand-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/40 overflow-hidden">
      {/* header */}
      <div className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                What should I do today?
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {recommendation.topicName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{recommendation.estimatedMinutes} minutes</span>
              </span>
              {recommendation.subjectName && (
                <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-semibold">
                  {recommendation.subjectName}
                </span>
              )}
            </div>
          </div>

          {/* priority score */}
          <div className="text-right space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Priority
            </div>
            <div className="text-3xl font-black text-white tabular-nums leading-none">
              {recommendation.priorityScore}
              <span className="text-sm text-slate-500 font-bold">/50</span>
            </div>
            <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden ml-auto">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-400"
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* the time-fitted plan */}
        <div className="space-y-2">
          {(recommendation.plan || []).map((block, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-white/5"
            >
              <span className="flex-none w-16 text-sm font-black text-brand-300 tabular-nums">
                {block.minutes} min
              </span>
              <span className="text-sm text-slate-300">{block.label}</span>
            </div>
          ))}
        </div>

        {needsNotes && (
          <div className="flex items-start space-x-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
            <p className="text-xs text-amber-200">
              You have no notes for <strong>{recommendation.topicName}</strong> yet. Import or paste
              them and Pocket Mentor will build the summary, flashcards and quiz.
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-400">{error}</p>
        )}

        {/* actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-brand-600/25 inline-flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            {needsNotes ? <Upload className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>
              {isStarting
                ? 'Building your study kit…'
                : needsNotes ? 'Import notes for this topic' : 'Start Session'}
            </span>
            {!isStarting && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowWhy((v) => !v)}
            className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center space-x-1.5 transition-colors"
          >
            <span>Why this recommendation?</span>
            {showWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Recalculate from your current academic state"
            className="px-3 py-3 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* explainability panel */}
      {showWhy && (
        <div className="border-t border-white/10 bg-slate-950/50 p-6 sm:p-8 space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            {recommendation.reasoning}
          </p>

          {/* factor breakdown */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Priority breakdown
              </h4>
              <span className="text-[10px] text-slate-500">each factor scores 0–10</span>
            </div>

            <div className="space-y-2">
              {Object.entries(FACTOR_LABELS).map(([key, label]) => {
                const value = factors[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3" title={FACTOR_HINTS[key]}>
                    <span className="flex-none w-36 text-xs text-slate-400">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${value >= 7 ? 'bg-rose-400' : value >= 4 ? 'bg-amber-400' : 'bg-slate-600'}`}
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </div>
                    <span className="flex-none w-10 text-right text-xs font-bold text-white tabular-nums">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <span className="flex-none w-36 text-xs font-bold text-white">Total</span>
              <div className="flex-1" />
              <span className="flex-none w-10 text-right text-sm font-black text-brand-300 tabular-nums">
                {recommendation.priorityScore}
              </span>
            </div>
          </div>

          {/* how it compares */}
          {ranking.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                How your other topics scored
              </h4>
              <div className="space-y-1.5">
                {ranking.map((r) => (
                  <div
                    key={r.topicId}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      r.topicId === recommendation.topicId
                        ? 'bg-brand-500/15 border border-brand-500/30'
                        : 'bg-slate-900/50 border border-white/5'
                    }`}
                  >
                    <span className="font-semibold text-slate-200">{r.topic}</span>
                    <span className="flex items-center space-x-3 text-slate-400">
                      <span>mastery {r.masteryScore}/10</span>
                      <span className="font-bold text-white tabular-nums w-10 text-right">
                        {r.priorityScore}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 max-w-3xl leading-relaxed">
            This score is calculated by Pocket Mentor from your quiz results, goals, deadlines and
            available time — not generated by the AI. The AI writes your summaries, flashcards and
            quiz questions; the numbers above decide what to study.
          </p>
        </div>
      )}
    </div>
  );
}
