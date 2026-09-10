import React, { useState, useEffect } from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Check, AlertCircle, Sparkles, Shuffle } from 'lucide-react';

export default function FlashcardDeck({ flashcards = [], onRateCard }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState(flashcards);

  useEffect(() => {
    setCards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  if (!cards || cards.length === 0) {
    return (
      <div className="card-glass p-12 rounded-3xl text-center">
        <Sparkles className="w-12 h-12 text-brand-400 mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-white mb-1">No Flashcards Yet</h3>
        <p className="text-sm text-slate-400">Generate a study kit to view active recall flashcards.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const handleRate = (rating) => {
    if (onRateCard && currentCard._id) {
      onRateCard(currentCard._id, rating);
    }
    // Update local card mastery
    const updated = [...cards];
    updated[currentIndex].mastery = rating;
    setCards(updated);
    // Proceed to next card automatically for seamless flow
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top Deck Controls */}
      <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-400 px-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-slate-800 rounded-full border border-white/5 text-slate-300">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="px-2.5 py-1 bg-brand-500/10 text-brand-300 rounded-full border border-brand-500/20">
            {currentCard.concept || 'Concept'}
          </span>
        </div>

        <button
          onClick={handleShuffle}
          className="flex items-center space-x-1 hover:text-brand-300 transition-colors p-1"
          title="Shuffle cards"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full h-80 sm:h-96 perspective-1000 cursor-pointer select-none group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-3d transition-transform rounded-3xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Face (Question) */}
          <div className="absolute inset-0 backface-hidden card-glass p-8 sm:p-10 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl shadow-black/40 group-hover:border-brand-500/30 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-md">
                Question
              </span>
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click or Space to flip</span>
              </span>
            </div>

            <div className="my-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed text-center">
                {currentCard.question}
              </h3>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              Difficulty: <span className="text-slate-300 font-semibold">{currentCard.difficulty || 'Medium'}</span>
            </div>
          </div>

          {/* Back Face (Answer) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 card-glass p-8 sm:p-10 rounded-3xl border border-brand-500/40 bg-gradient-to-b from-slate-900/95 to-brand-950/40 flex flex-col justify-between shadow-2xl shadow-brand-500/10">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                Answer & Key Concept
              </span>
              <span className="text-xs text-brand-300 font-semibold">
                {currentCard.concept}
              </span>
            </div>

            <div className="my-auto overflow-y-auto max-h-48 pr-1">
              <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
                {currentCard.answer}
              </p>
            </div>

            {/* Rating Buttons on the Back */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-slate-400 hidden sm:inline">Rate Recall:</span>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleRate('Hard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentCard.mastery === 'Hard'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                  }`}
                >
                  Hard (1)
                </button>
                <button
                  onClick={() => handleRate('Medium')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentCard.mastery === 'Medium'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  Medium (2)
                </button>
                <button
                  onClick={() => handleRate('Easy')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentCard.mastery === 'Easy'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                  }`}
                >
                  Easy (3)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrev}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white transition-all shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Previous</span>
        </button>

        <div className="text-xs text-slate-500">
          Use <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-[11px] text-slate-300">←</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-[11px] text-slate-300">→</kbd> to navigate
        </div>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white transition-all shadow-md"
        >
          <span className="text-sm font-semibold">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
