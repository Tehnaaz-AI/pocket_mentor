import React, { useState, useEffect } from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Sparkles, Shuffle } from 'lucide-react';

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
      <div className="card-miro p-12 text-center bg-[#fafbfc] border-[#e0e2e8]">
        <Sparkles className="w-10 h-10 text-[#ffd02f] mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#1c1c1e] mb-1">No Flashcards In Deck</h3>
        <p className="text-xs text-[#555a6a]">Generate a study kit to review active recall flashcards.</p>
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
    const updated = [...cards];
    updated[currentIndex].mastery = rating;
    setCards(updated);
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top Deck Controls */}
      <div className="flex items-center justify-between text-xs text-[#555a6a] px-1">
        <div className="flex items-center space-x-2">
          <span className="badge-pill badge-neutral font-mono font-medium">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="badge-pill badge-yellow">
            {currentCard.concept || 'Key Concept'}
          </span>
        </div>

        <button
          onClick={handleShuffle}
          className="btn-ghost text-xs px-2.5 py-1 flex items-center space-x-1"
          title="Shuffle deck"
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
          className={`relative w-full h-full duration-300 transform-style-3d transition-transform rounded-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Face (Question) */}
          <div className="absolute inset-0 backface-hidden card-miro p-8 sm:p-10 border-[#e0e2e8] bg-white flex flex-col justify-between shadow-card hover:border-[#1c1c1e] transition-colors">
            <div className="flex justify-between items-center">
              <span className="badge-pill badge-neutral uppercase tracking-wider text-[10px]">
                Question / Prompt
              </span>
              <span className="text-xs text-[#8e91a0] flex items-center space-x-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click or Space to flip</span>
              </span>
            </div>

            <div className="my-auto py-4">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c1c1e] leading-snug text-center tracking-tight">
                {currentCard.question}
              </h3>
            </div>

            <div className="text-center text-xs text-[#8e91a0] font-medium">
              Difficulty: <span className="text-[#1c1c1e] font-semibold">{currentCard.difficulty || 'Medium'}</span>
            </div>
          </div>

          {/* Back Face (Answer) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 card-miro p-8 sm:p-10 border-[#ffd02f]/60 bg-[#fff8e0]/40 flex flex-col justify-between shadow-lift">
            <div className="flex justify-between items-center">
              <span className="badge-pill badge-yellow uppercase tracking-wider text-[10px]">
                Key Answer
              </span>
              <span className="text-xs font-semibold text-[#1c1c1e]">
                {currentCard.concept}
              </span>
            </div>

            <div className="my-auto overflow-y-auto max-h-48 pr-2 py-2">
              <p className="text-base sm:text-lg text-[#1c1c1e] font-medium leading-relaxed">
                {currentCard.answer}
              </p>
            </div>

            {/* Rating Buttons */}
            <div className="pt-4 border-t border-[#e0e2e8] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-[#555a6a] hidden sm:inline font-medium">Rate recall:</span>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleRate('Hard')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    currentCard.mastery === 'Hard'
                      ? 'bg-[#ff9999] text-[#600000] border border-[#ff9999]'
                      : 'bg-white text-[#600000] border border-[#ff9999] hover:bg-[#ffc6c6]/30'
                  }`}
                >
                  Hard
                </button>
                <button
                  onClick={() => handleRate('Medium')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    currentCard.mastery === 'Medium'
                      ? 'bg-[#ffd02f] text-[#1c1c1e] border border-[#ffd02f]'
                      : 'bg-white text-[#746019] border border-[#ffd02f] hover:bg-[#fff8e0]'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => handleRate('Easy')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    currentCard.mastery === 'Easy'
                      ? 'bg-[#00b473] text-white border border-[#00b473]'
                      : 'bg-white text-[#00b473] border border-[#00b473] hover:bg-[#e6f7f0]'
                  }`}
                >
                  Easy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          className="btn-secondary text-xs px-4 py-2 flex items-center space-x-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-xs text-[#8e91a0]">
          Use <kbd className="px-1.5 py-0.5 bg-[#f7f8fa] border border-[#e0e2e8] rounded text-[11px] font-mono text-[#1c1c1e]">←</kbd> / <kbd className="px-1.5 py-0.5 bg-[#f7f8fa] border border-[#e0e2e8] rounded text-[11px] font-mono text-[#1c1c1e]">→</kbd> or Space
        </div>

        <button
          onClick={handleNext}
          className="btn-secondary text-xs px-4 py-2 flex items-center space-x-1.5"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
