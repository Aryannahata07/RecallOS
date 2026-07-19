import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewProps {
  flashcards: Flashcard[];
}

export function FlashcardView({ flashcards }: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setFlipped(false);
  }, [currentIndex]);

  if (!flashcards || flashcards.length === 0) {
    return <div className="loading-state">No flashcards available.</div>;
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Indicator & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="home-btn"
            style={{ 
              margin: 0, 
              padding: '0.4rem 0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem',
              opacity: currentIndex === 0 ? 0.4 : 1,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="home-btn"
            style={{ 
              margin: 0, 
              padding: '0.4rem 0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem',
              opacity: currentIndex === flashcards.length - 1 ? 0.4 : 1,
              cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Card Arena */}
      <div className="flashcard-container" onClick={() => setFlipped(f => !f)}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="card-front">
            <span className="card-label">Question</span>
            <p>{currentCard.question}</p>
            <span className="flip-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RotateCw size={11} /> Click to reveal answer
            </span>
          </div>
          <div className="card-back">
            <span className="card-label">Answer</span>
            <p>{currentCard.answer}</p>
            <span className="flip-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RotateCw size={11} /> Click to view question
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
