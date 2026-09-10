import React, { useState } from 'react';
import { Send, Quote, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
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
    "What are the main requirements?",
    "Explain this with a concrete example",
    "How does this relate to the core theorem?"
  ];

  return (
    <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-white space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <span className="badge-pill badge-blue text-[10px]">
            NOTE GROUNDED AI
          </span>
        </div>
        <h3 className="text-lg font-bold text-[#1c1c1e] tracking-tight mt-1">
          Ask My Notes
        </h3>
        <p className="text-xs text-[#555a6a]">
          Ask questions about the lecture material you are currently studying. Answers are grounded directly in your notes.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAsk} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What is the fundamental mechanism behind this concept?"
          className="input-miro w-full pr-28 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="btn-primary absolute right-2 top-1.5 bottom-1.5 px-4 text-xs font-semibold"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
          <span>Ask</span>
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#8e91a0]">Suggested queries:</span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => setQuery(sq)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#f7f8fa] border border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:border-[#1c1c1e] transition-colors"
          >
            "{sq}"
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#ffc6c6]/40 border border-[#ff9999] text-[#600000] text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grounded Answer Display */}
      {result && (
        <div className="p-6 rounded-2xl bg-[#fafbfc] border border-[#e0e2e8] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1c1c1e] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd02f]" />
              <span>Grounded Response</span>
            </span>
            <span className={`badge-pill text-[10px] ${
              result.isFoundInNotes
                ? 'badge-teal'
                : 'badge-yellow'
            }`}>
              {result.isFoundInNotes ? 'Verified Note Source' : 'General Conceptual Context'}
            </span>
          </div>

          <p className="text-sm text-[#1c1c1e] leading-relaxed">
            {result.answer}
          </p>

          {/* Verbatim Source Citation */}
          {result.sourceExcerpt && (
            <div className="pt-3 border-t border-[#eef0f3]">
              <div className="text-[11px] font-bold text-[#8e91a0] flex items-center space-x-1 mb-1.5">
                <Quote className="w-3 h-3 text-[#1c1c1e]" />
                <span>Source Excerpt from Notes:</span>
              </div>
              <blockquote className="text-xs text-[#555a6a] italic bg-white p-3.5 rounded-xl border-l-2 border-[#1c1c1e]">
                "{result.sourceExcerpt}"
              </blockquote>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
