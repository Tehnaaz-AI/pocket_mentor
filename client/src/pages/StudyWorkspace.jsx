import React, { useState, useEffect } from 'react';
import { 
  Clock, BookOpen, Layers, Award, Sparkles, Volume2, 
  VolumeX, ArrowLeft, Lightbulb, MessageSquare, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import FlashcardDeck from '../components/Flashcard';
import QuizCard from '../components/QuizCard';
import AskNotesModal from '../components/AskNotesModal';
import MemoryHooksCard from '../components/MemoryHooksCard';

export default function StudyWorkspace({ sessionId, onBackToDashboard, onQuizCompleted }) {
  const [sessionData, setSessionData] = useState(null);
  const [activeTab, setActiveTab] = useState('sixty'); // 'sixty', 'summary', 'flashcards', 'quiz', 'hooks', 'ask'
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
    return () => {
      // Stop speech on unmount
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sessionId]);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudySession(sessionId);
      setSessionData(data);
    } catch (err) {
      console.error('Failed to load study session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateCard = async (cardId, rating) => {
    try {
      await api.rateFlashcard(cardId, rating);
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  const handleSubmitQuiz = async (answers) => {
    if (!sessionData?.quiz?._id) return;

    setIsSubmittingQuiz(true);
    try {
      const results = await api.submitQuiz(sessionData.quiz._id, answers);
      if (onQuizCompleted) {
        onQuizCompleted(results, sessionData.session);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Text-To-Speech for 60-Second Revision
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const sixty = sessionData?.session?.sixtySecondSummary;
      if (!sixty) return;

      const fullScript = `Topic: ${sixty.topic}. ${sixty.coreIdea}. Key takeaways: ${sixty.keyPoints?.join('. ')}. Memorable takeaway: ${sixty.memorableTakeaway}`;
      const utterance = new SpeechSynthesisUtterance(fullScript);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center animate-spin">
          <Sparkles className="w-6 h-6 text-brand-400" />
        </div>
        <p className="text-sm text-slate-400">Loading your personalized study workspace...</p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-sm text-rose-400">Study session could not be located.</p>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { session, note, flashcards, quiz } = sessionData;

  const tabs = [
    { id: 'sixty', label: '60s Revision', icon: Clock, badge: 'Rapid' },
    { id: 'summary', label: 'Detailed Summary', icon: BookOpen },
    { id: 'flashcards', label: `Flashcards (${flashcards?.length || 0})`, icon: Layers },
    { id: 'quiz', label: `Diagnostic Quiz (${quiz?.questions?.length || 0})`, icon: Award },
    { id: 'hooks', label: 'Memory Hooks', icon: Lightbulb },
    { id: 'ask', label: 'Ask My Notes', icon: MessageSquare, badge: 'RAG' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-500/15 text-brand-300 border border-brand-500/30">
            {session.subject}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
            {session.difficulty} Level
          </span>
        </div>
      </div>

      {/* Session Title Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {session.title}
        </h1>
        <p className="text-xs text-slate-400 flex items-center space-x-2">
          <span>Created on {new Date(session.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{note?.wordCount || 0} source words parsed</span>
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-1 ring-brand-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: 60-Second Summary */}
      {activeTab === 'sixty' && session.sixtySecondSummary && (
        <div className="card-glass p-6 sm:p-10 rounded-3xl border border-white/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">60-Second High-Yield Revision</h3>
                <p className="text-xs text-slate-400">Read in under one minute or listen with AI speech</p>
              </div>
            </div>

            {/* Audio Speech Button */}
            <button
              onClick={toggleSpeech}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isSpeaking
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-900 border-white/10 hover:border-brand-500/40 text-slate-200'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Narration'}</span>
            </button>
          </div>

          {/* Core Elevator Pitch */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Core Idea:</span>
            <p className="text-base text-slate-100 font-medium leading-relaxed">
              {session.sixtySecondSummary.coreIdea}
            </p>
          </div>

          {/* Key Bullet Takeaways */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Takeaways:</h4>
            <div className="space-y-2.5">
              {session.sixtySecondSummary.keyPoints?.map((pt, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300 font-medium">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Memorable Punchline */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-900/40 to-indigo-900/40 border border-brand-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-1">
              💡 Memorable Takeaway:
            </span>
            <p className="text-sm font-semibold text-white">
              {session.sixtySecondSummary.memorableTakeaway}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Summary */}
      {activeTab === 'summary' && (
        <div className="card-glass p-6 sm:p-10 rounded-3xl border border-white/10 space-y-6">
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-line text-sm sm:text-base text-slate-200 leading-relaxed font-sans space-y-4">
              {session.summary}
            </div>
          </div>

          {/* Key Concepts Pills */}
          {session.keyConcepts && session.keyConcepts.length > 0 && (
            <div className="pt-6 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Detected Key Concepts:
              </span>
              <div className="flex flex-wrap gap-2">
                {session.keyConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="py-4">
          <FlashcardDeck
            flashcards={flashcards}
            onRateCard={handleRateCard}
          />
        </div>
      )}

      {/* Tab 4: Quiz */}
      {activeTab === 'quiz' && (
        <div className="py-4">
          <QuizCard
            quiz={quiz}
            onSubmit={handleSubmitQuiz}
            isSubmitting={isSubmittingQuiz}
          />
        </div>
      )}

      {/* Tab 5: Memory Hooks */}
      {activeTab === 'hooks' && (
        <div className="py-4">
          <MemoryHooksCard memoryHooks={session.memoryHooks} />
        </div>
      )}

      {/* Tab 6: Ask My Notes */}
      {activeTab === 'ask' && (
        <div className="py-4">
          <AskNotesModal sessionId={session._id} />
        </div>
      )}
    </div>
  );
}
