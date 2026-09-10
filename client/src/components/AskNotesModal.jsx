import React, { useState } from 'react';
import { HelpCircle, Send, Quote, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function AskNotesModal({ sessionId }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await api.askMyNotes(sessionId, query);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to search your notes.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    "What is the main requirement for mutual exclusion?",
    "How does the rate-limiting enzyme work?",
    "What is the difference between L1 and L2 regularization?"
  ];

  return (
    <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Ask My Notes</h3>
            <p className="text-xs text-slate-400">Ask any question and receive answers strictly verified against your lecture notes.</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAsk} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What causes a deadlock in process synchronization?"
          className="w-full px-4 py-3.5 pr-28 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-colors shadow-inner"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-brand-600/20"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Ask AI</span>
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Quick ideas:</span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => setQuery(sq)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-brand-300 hover:border-brand-500/30 transition-colors"
          >
            "{sq.slice(0, 35)}..."
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grounded Answer Display */}
      {result && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-brand-500/30 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grounded Answer</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              result.isFoundInNotes
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {result.isFoundInNotes ? 'Direct Source Match' : 'General Context'}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {result.answer}
          </p>

          {/* Verbatim Source Citation */}
          {result.sourceExcerpt && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-bold text-slate-400 flex items-center space-x-1 mb-1.5">
                <Quote className="w-3 h-3 text-brand-400" />
                <span>Verified Note Excerpt:</span>
              </div>
              <blockquote className="text-xs text-slate-300 italic bg-slate-950/60 p-3 rounded-xl border-l-2 border-brand-500">
                "{result.sourceExcerpt}"
              </blockquote>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
