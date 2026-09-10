import React, { useState, useEffect } from 'react';
import {
  Sparkles, ChevronDown, ChevronUp, Clock, ArrowRight,
  AlertTriangle, RefreshCw, Upload, TrendingUp
} from 'lucide-react';
import { api } from '../services/api';

const FACTOR_LABELS = {
  weakness: 'Weakness Level',
  recentFailure: 'Recent Quiz Gaps',
  deadlineUrgency: 'Deadline Proximity',
  goalRelevance: 'Academic Goal Fit',
  timeFit: 'Schedule Fit'
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
      if (data.actionType === 'import' || !data.sessionId) {
        onNavigate?.('import');
        return;
      }
      onStartSession?.(data.sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  /* Loading state */
  if (isLoading) {
    return (
      <div className="card-miro p-8 border-[#e0e2e8] flex items-center justify-center space-x-3 bg-white">
        <Sparkles className="w-5 h-5 text-[#ffd02f] animate-pulse" />
        <span className="text-sm font-medium text-[#555a6a]">Determining your next best study action…</span>
      </div>
    );
  }

  /* Empty state */
  if (!recommendation) {
    return (
      <div className="card-miro p-8 sm:p-10 border-[#e0e2e8] bg-[#fafbfc] space-y-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffd02f]"></span>
          <h2 className="text-xl font-bold text-[#1c1c1e] tracking-tight">What should I study today?</h2>
        </div>
        <p className="text-sm text-[#555a6a] max-w-xl leading-relaxed">
          {emptyMessage || 'Import your notes to begin. Pocket Mentor analyzes your learning materials and quiz performance to tell you exactly what to revise next.'}
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate?.('import')}
            className="btn-primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span>Import First Notes</span>
          </button>
        </div>
      </div>
    );
  }

  const factors = recommendation.factors || {};
  const scorePct = Math.round((recommendation.priorityScore / 50) * 100);
  const needsNotes = recommendation.actionType === 'import';

  return (
    <div className="card-miro border-[#e0e2e8] bg-white overflow-hidden shadow-card">
      {/* Top Banner Highlight */}
      <div className="p-6 sm:p-8 bg-[#fff8e0]/60 border-b border-[#ffd02f]/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="badge-pill badge-yellow">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffd02f]"></span>
                RECOMMENDED TODAY
              </span>
              {recommendation.subjectName && (
                <span className="badge-pill badge-neutral font-medium">
                  {recommendation.subjectName}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] tracking-tight pt-1">
              {recommendation.topicName}
            </h2>

            <div className="flex items-center space-x-2 text-xs text-[#555a6a] pt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#8e91a0]" />
              <span className="font-medium">{recommendation.estimatedMinutes || 25} minutes recommended session</span>
            </div>
          </div>

          {/* Priority Score Display */}
          <div className="text-right sm:pl-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8e91a0]">
              Priority Index
            </div>
            <div className="text-3xl font-bold text-[#1c1c1e] font-mono leading-tight">
              {recommendation.priorityScore}
              <span className="text-xs text-[#8e91a0] font-sans font-medium"> / 50</span>
            </div>
            <div className="w-24 h-1.5 rounded-full bg-[#e0e2e8] overflow-hidden ml-auto mt-1.5">
              <div
                className="h-full rounded-full bg-[#ffd02f]"
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Recommended Structure / Blocks */}
        {recommendation.plan && recommendation.plan.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8e91a0]">
              Session Blueprint
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {recommendation.plan.map((block, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#f7f8fa] border border-[#eef0f3] flex items-center space-x-3"
                >
                  <span className="text-xs font-bold text-[#1c1c1e] font-mono px-2 py-0.5 rounded bg-white border border-[#e0e2e8]">
                    {block.minutes}m
                  </span>
                  <span className="text-xs font-medium text-[#2c2c34] truncate">{block.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing notes notification */}
        {needsNotes && (
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-[#fff8e0] border border-[#ffd02f]/40">
            <AlertTriangle className="w-4 h-4 text-[#746019] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#746019] leading-relaxed">
              Notes for <strong>{recommendation.topicName}</strong> have not been imported yet. Import them now and Pocket Mentor will automatically generate your study kit.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-[#ffc6c6]/40 border border-[#ff9999] text-xs text-[#600000]">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="btn-primary px-6 py-3 text-sm font-semibold"
          >
            {needsNotes ? <Upload className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-[#ffd02f]" />}
            <span>
              {isStarting
                ? 'Preparing Workspace…'
                : needsNotes ? 'Import Notes for Topic' : 'Start Study Session'}
            </span>
            {!isStarting && <ArrowRight className="w-4 h-4 ml-2" />}
          </button>

          <button
            onClick={() => setShowWhy((v) => !v)}
            className="btn-secondary text-xs"
          >
            <span>Why this topic?</span>
            {showWhy ? <ChevronUp className="w-3.5 h-3.5 ml-1.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-1.5" />}
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Recalculate recommendation"
            className="btn-ghost p-2.5 rounded-full border border-[#e0e2e8]"
          >
            <RefreshCw className={`w-4 h-4 text-[#555a6a] ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Explainability Drawer */}
        {showWhy && (
          <div className="pt-4 border-t border-[#eef0f3] space-y-4">
            <div className="text-xs text-[#555a6a] leading-relaxed bg-[#f7f8fa] p-4 rounded-xl border border-[#eef0f3]">
              {recommendation.reasoning || 'Recommendation generated by evaluating your active topic mastery, recent quiz errors, and study pace.'}
            </div>

            {/* Factor breakdown */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8e91a0]">
                <span>PRIORITY FACTOR BREAKDOWN</span>
                <span>WEIGHT (0–10)</span>
              </div>

              <div className="space-y-2">
                {Object.entries(FACTOR_LABELS).map(([key, label]) => {
                  const value = factors[key] ?? 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-36 text-xs font-medium text-[#555a6a]">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#f0f2f5] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${value >= 7 ? 'bg-[#ff9999]' : value >= 4 ? 'bg-[#ffd02f]' : 'bg-[#4262ff]'}`}
                          style={{ width: `${(value / 10) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-[#1c1c1e] font-mono">
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Topic ranking */}
            {ranking.length > 1 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#8e91a0]">
                  Other Priority Rankings
                </div>
                <div className="space-y-1.5">
                  {ranking.slice(0, 3).map((r) => (
                    <div
                      key={r.topicId}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs ${
                        r.topicId === recommendation.topicId
                          ? 'bg-[#fff8e0] border border-[#ffd02f]/40 font-semibold text-[#1c1c1e]'
                          : 'bg-[#fafbfc] border border-[#eef0f3] text-[#555a6a]'
                      }`}
                    >
                      <span>{r.topic}</span>
                      <span className="font-mono font-medium">score: {r.priorityScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
