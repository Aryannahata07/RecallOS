'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ReviewClient({ initialCards }: { initialCards: any[] }) {
  const [cards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);

  if (currentIndex >= cards.length) {
    return (
      <div className="text-center animate-in zoom-in duration-500">
        <h2 className="text-3xl font-bold mb-4">Session Complete! 🧠</h2>
        <p className="text-zinc-400 mb-8">Great job preventing memory decay.</p>
        <Link href="/" className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg font-medium text-white transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRate = async (rating: number) => {
    setLoading(true);
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, rating })
      });
      setShowAnswer(false);
      setCurrentIndex(c => c + 1);
    } catch (err) {
      alert("Failed to save review");
    }
    setLoading(false);
  };

  return (
    <div className="w-full animate-in slide-in-from-right-8 duration-300">
      <div className="text-xs text-zinc-500 mb-6 uppercase tracking-widest text-center">
        {currentCard.concept.name} • Card {currentIndex + 1} of {cards.length}
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8 shadow-2xl min-h-[250px] flex items-center justify-center text-center text-2xl font-medium leading-relaxed">
        {currentCard.question}
      </div>

      {showAnswer ? (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-8 mb-8 min-h-[150px] text-lg text-emerald-100 flex items-center justify-center text-center shadow-inner">
            {currentCard.answer}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button disabled={loading} onClick={() => handleRate(1)} className="bg-rose-950/40 hover:bg-rose-900 border border-rose-800/50 py-4 rounded-xl font-bold text-rose-300 transition-all hover:scale-105 active:scale-95">1. Again</button>
            <button disabled={loading} onClick={() => handleRate(2)} className="bg-amber-950/40 hover:bg-amber-900 border border-amber-800/50 py-4 rounded-xl font-bold text-amber-300 transition-all hover:scale-105 active:scale-95">2. Hard</button>
            <button disabled={loading} onClick={() => handleRate(3)} className="bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-800/50 py-4 rounded-xl font-bold text-emerald-300 transition-all hover:scale-105 active:scale-95">3. Good</button>
            <button disabled={loading} onClick={() => handleRate(4)} className="bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-800/50 py-4 rounded-xl font-bold text-cyan-300 transition-all hover:scale-105 active:scale-95">4. Easy</button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowAnswer(true)}
          className="w-full bg-white text-black font-bold text-xl py-6 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-white/5"
        >
          Show Answer
        </button>
      )}
    </div>
  );
}
