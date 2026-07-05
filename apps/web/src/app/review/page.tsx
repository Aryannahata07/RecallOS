'use client';

import { useState, useCallback, useEffect } from 'react';

interface Source {
  id: string;
  url: string;
  title: string;
  type: string;
}

interface Concept {
  id: string;
  name: string;
  description: string;
  keyPrinciples: string[];
  pitfalls: string[];
  mentalModels: string;
  nextReviewDue: string;
  reps: number;
  sources: Source[];
}

type ReviewMode = 'summary' | 'flashcard' | 'quiz';
type FSRSRating = 1 | 2 | 3 | 4;

interface GeneratedData {
  mode: ReviewMode;
  data: any;
  sources: Source[];
}

const sourceIcon = (type: string) => {
  if (type === 'youtube') return '▶';
  if (type === 'leetcode') return '🧩';
  return '📄';
};

function ConceptDashboard({ concept, onRate, onNext }: {
  concept: Concept;
  onRate: (rating: FSRSRating) => void;
  onNext: () => void;
}) {
  const [mode, setMode] = useState<ReviewMode>('summary');
  const [generated, setGenerated] = useState<GeneratedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [rated, setRated] = useState(false);

  const generate = useCallback(async (m: ReviewMode) => {
    setMode(m);
    setGenerated(null);
    setError(null);
    setFlipped(false);
    setSelectedOption(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId: concept.id, mode: m }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setGenerated(data);
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [concept.id]);

  const handleRate = (rating: FSRSRating) => {
    setRated(true);
    onRate(rating);
    setTimeout(onNext, 600);
  };

  // Auto-load summary on mount
  useEffect(() => { generate('summary'); }, [generate]);

  return (
    <div className="concept-dashboard">
      <div className="concept-header">
        <h2 className="concept-title">{concept.name}</h2>
        <p className="concept-desc">{concept.description}</p>
        <div className="source-chips">
          {concept.sources.map(s => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="source-chip">
              {sourceIcon(s.type)} {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mode-tabs">
        {(['summary', 'flashcard', 'quiz'] as ReviewMode[]).map(m => (
          <button
            key={m}
            className={`mode-tab ${mode === m ? 'active' : ''}`}
            onClick={() => generate(m)}
          >
            {m === 'summary' ? '⚡ Quick Revision' : m === 'flashcard' ? '🃏 Flashcard' : '📝 Quiz'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="content-area">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Generating {mode}...</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-state">
            <p className="error-icon">⚠️</p>
            <p className="error-title">Generation Failed</p>
            <p className="error-msg">{error}</p>
            <p className="error-hint">Make sure your GROQ_API_KEY or GEMINI_API_KEY is set in your .env file.</p>
            <div className="blueprint-fallback">
              <h4>📋 Raw Blueprint (from DB)</h4>
              <p><strong>Key Principles:</strong></p>
              <ul>{concept.keyPrinciples.map((p,i) => <li key={i}>✓ {p}</li>)}</ul>
              <p><strong>Pitfalls:</strong></p>
              <ul>{concept.pitfalls.map((p,i) => <li key={i}>⚠ {p}</li>)}</ul>
              {concept.mentalModels && <p><strong>Mental Model:</strong> {concept.mentalModels}</p>}
            </div>
          </div>
        )}

        {!loading && generated?.mode === 'summary' && (
          <div className="summary-content">
            <div 
              className="summary-text" 
              dangerouslySetInnerHTML={{ 
                __html: generated.data.text
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} 
            />
          </div>
        )}

        {!loading && generated?.mode === 'flashcard' && (
          <div className="flashcard-container" onClick={() => setFlipped(f => !f)}>
            <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
              <div className="card-front">
                <span className="card-label">Question</span>
                <p>{generated.data.question}</p>
                <span className="flip-hint">Click to reveal answer</span>
              </div>
              <div className="card-back">
                <span className="card-label">Answer</span>
                <p>{generated.data.answer}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && generated?.mode === 'quiz' && (
          <div className="quiz-container">
            <div className="quiz-scenario">{generated.data.scenario}</div>
            <p className="quiz-question">{generated.data.question}</p>
            <div className="quiz-options">
              {generated.data.options?.map((opt: string, i: number) => {
                const isCorrect = i === generated.data.correctIndex;
                const isSelected = i === selectedOption;
                let cls = 'quiz-option';
                if (selectedOption !== null) {
                  if (isCorrect) cls += ' correct';
                  else if (isSelected) cls += ' wrong';
                }
                return (
                  <button key={i} className={cls} onClick={() => setSelectedOption(i)} disabled={selectedOption !== null}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selectedOption !== null && (
              <div className="quiz-explanation">
                <strong>{selectedOption === generated.data.correctIndex ? '✅ Correct!' : '❌ Wrong!'}</strong>
                <p>{generated.data.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FSRS Rating Bar */}
      {!rated && (
        <div className="rating-bar">
          <p className="rating-label">How well did you know this?</p>
          <div className="rating-buttons">
            {([1, 2, 3, 4] as FSRSRating[]).map((r) => {
              const labels = { 1: '😵 Again', 2: '😓 Hard', 3: '🙂 Good', 4: '😎 Easy' };
              const cls = { 1: 'btn-again', 2: 'btn-hard', 3: 'btn-good', 4: 'btn-easy' };
              return (
                <button key={r} className={`rating-btn ${cls[r]}`} onClick={() => handleRate(r)}>
                  {labels[r]}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {rated && <div className="rated-msg">✅ Saved! Loading next concept...</div>}
    </div>
  );
}

export default function ReviewPage() {
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  // Fetch due concepts on mount
  useEffect(() => {
    fetch('/api/review')
      .then(r => r.json())
      .then(data => setConcepts(data.concepts || []));
  }, []);

  const handleRate = async (rating: FSRSRating) => {
    if (!concepts) return;
    const concept = concepts[index];
    await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId: concept.id, rating }),
    });
  };

  const handleNext = () => {
    if (!concepts) return;
    if (index + 1 >= concepts.length) setDone(true);
    else setIndex(i => i + 1);
  };

  if (!concepts) return (
    <div className="review-loading">
      <div className="spinner large" />
      <p>Loading your review session...</p>
    </div>
  );

  if (concepts.length === 0 || done) return (
    <div className="review-done">
      <div className="done-icon">🎉</div>
      <h2>All Caught Up!</h2>
      <p>No concepts are due for review right now. Come back later or capture something new!</p>
      <a href="/" className="home-btn">← Back to Dashboard</a>
    </div>
  );

  return (
    <main className="review-page">
      <nav className="review-nav">
        <a href="/" className="nav-back">← RecallOS</a>
        <span className="review-progress">{index + 1} / {concepts.length} concepts</span>
      </nav>
      <ConceptDashboard
        concept={concepts[index]}
        onRate={handleRate}
        onNext={handleNext}
      />
    </main>
  );
}
