import React, { useState, useEffect } from 'react';
import { 
  Clock, BookOpen, Layers, Award, Sparkles, Volume2, 
  VolumeX, ArrowLeft, Lightbulb, MessageSquare, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import FlashcardDeck from '../components/Flashcard';
import QuizCard from '../components/QuizCard';
import AskNotesModal from '../components/AskNotesModal';
import MemoryHooksCard from '../components/MemoryHooksCard';

export default function StudyWorkspace({ sessionId, onBackToDashboard, onQuizCompleted }) {
  const [sessionData, setSessionData] = useState(null);
  const [activeTab, setActiveTab] = useState('concepts'); // 'concepts', 'sixty', 'flashcards', 'quiz', 'hooks', 'ask'
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
    return () => {
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
      alert('Speech synthesis is not supported in this browser.');
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-[#fff8e0] border border-[#ffd02f]/50 flex items-center justify-center animate-pulse">
          <Sparkles className="w-5 h-5 text-[#1c1c1e]" />
        </div>
        <p className="text-xs text-[#555a6a] font-medium">Opening your study workspace…</p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-sm text-[#ff9999] font-medium">Study session could not be located.</p>
        <button
          onClick={onBackToDashboard}
          className="btn-secondary text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { session, note, flashcards, quiz } = sessionData;

  const tabs = [
    { id: 'concepts', label: 'Key Concepts & Summary', icon: BookOpen },
    { id: 'sixty', label: '60s High-Yield', icon: Clock, badge: 'Rapid' },
    { id: 'flashcards', label: `Flashcards (${flashcards?.length || 0})`, icon: Layers },
    { id: 'quiz', label: `Diagnostic Quiz (${quiz?.questions?.length || 0})`, icon: Award },
    { id: 'hooks', label: 'Memory Hooks', icon: Lightbulb },
    { id: 'ask', label: 'Ask My Notes', icon: MessageSquare, badge: 'AI' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e0e2e8]">
        <button
          onClick={onBackToDashboard}
          className="btn-ghost text-xs px-3 py-1.5 flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="badge-pill badge-neutral font-semibold">
            {session.subject || 'General'}
          </span>
          <span className="badge-pill badge-neutral font-medium">
            {session.difficulty} Level
          </span>
          {activeTab !== 'quiz' && (
            <button
              onClick={() => setActiveTab('quiz')}
              className="btn-primary text-xs px-4 py-1.5 ml-2"
            >
              <Award className="w-3.5 h-3.5 mr-1 text-[#ffd02f]" />
              <span>Take Diagnostic Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Session Title Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] tracking-tight">
          {session.title}
        </h1>
        <p className="text-xs text-[#8e91a0] flex items-center space-x-2">
          <span>Created on {new Date(session.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span className="font-mono">{note?.wordCount || session?.summary?.split(/\s+/).length || 0} source words synthesized</span>
        </p>
      </div>

      {/* Navigation Tabs (Miro Pill Tabs) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-[#eef0f3]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#1c1c1e] text-white shadow-subtle'
                  : 'bg-[#f7f8fa] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-[#eef0f3] border border-[#e0e2e8]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                  isActive ? 'bg-[#ffd02f] text-[#1c1c1e]' : 'bg-[#e0e2e8] text-[#555a6a]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Key Concepts & Detailed Summary */}
      {activeTab === 'concepts' && (
        <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-white space-y-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-sm sm:text-base text-[#2c2c34] leading-relaxed font-sans space-y-4">
              {session.summary}
            </div>
          </div>

          {/* Detected Key Concepts Chips */}
          {session.keyConcepts && session.keyConcepts.length > 0 && (
            <div className="pt-6 border-t border-[#eef0f3]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8e91a0] block mb-3">
                Extracted Core Concepts:
              </span>
              <div className="flex flex-wrap gap-2">
                {session.keyConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="badge-pill badge-neutral text-xs py-1 px-3"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 60-Second High-Yield Revision */}
      {activeTab === 'sixty' && session.sixtySecondSummary && (
        <div className="card-miro p-6 sm:p-8 border-[#e0e2e8] bg-white space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eef0f3] pb-4">
            <div className="flex items-center space-x-2.5">
              <span className="badge-pill badge-yellow text-[10px]">
                RAPID SYNOPSIS
              </span>
              <h3 className="text-base font-bold text-[#1c1c1e]">60-Second High-Yield Review</h3>
            </div>

            {/* Audio Speech Button */}
            <button
              onClick={toggleSpeech}
              className={`btn-secondary text-xs px-3.5 py-1.5 flex items-center space-x-1.5 ${
                isSpeaking ? 'border-[#ff9999] text-[#600000] bg-[#ffc6c6]/20' : ''
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Narration'}</span>
            </button>
          </div>

          {/* Core Elevator Pitch */}
          <div className="bg-[#fff8e0]/60 p-5 rounded-xl border border-[#ffd02f]/40 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#746019] block">
              Core Concept:
            </span>
            <p className="text-sm sm:text-base text-[#1c1c1e] font-medium leading-relaxed">
              {session.sixtySecondSummary.coreIdea}
            </p>
          </div>

          {/* Key Bullet Takeaways */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8e91a0]">
              Essential Takeaways:
            </h4>
            <div className="space-y-2">
              {session.sixtySecondSummary.keyPoints?.map((pt, i) => (
                <div key={i} className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#fafbfc] border border-[#eef0f3]">
                  <CheckCircle2 className="w-4 h-4 text-[#00b473] flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-[#2c2c34] font-medium">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Memorable Punchline */}
          <div className="p-4 rounded-xl bg-[#f7f8fa] border border-[#e0e2e8]">
            <span className="text-xs font-bold text-[#1c1c1e] block mb-1">
              💡 Memory Anchor:
            </span>
            <p className="text-xs sm:text-sm text-[#555a6a] font-medium leading-relaxed">
              {session.sixtySecondSummary.memorableTakeaway}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="py-2">
          <FlashcardDeck
            flashcards={flashcards}
            onRateCard={handleRateCard}
          />
        </div>
      )}

      {/* Tab 4: Quiz */}
      {activeTab === 'quiz' && (
        <div className="py-2">
          <QuizCard
            quiz={quiz}
            onSubmit={handleSubmitQuiz}
            isSubmitting={isSubmittingQuiz}
          />
        </div>
      )}

      {/* Tab 5: Memory Hooks */}
      {activeTab === 'hooks' && (
        <div className="py-2">
          <MemoryHooksCard memoryHooks={session.memoryHooks} />
        </div>
      )}

      {/* Tab 6: Ask My Notes */}
      {activeTab === 'ask' && (
        <div className="py-2">
          <AskNotesModal sessionId={session._id} />
        </div>
      )}
    </div>
  );
}
