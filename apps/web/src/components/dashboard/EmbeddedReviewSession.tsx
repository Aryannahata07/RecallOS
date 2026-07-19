import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, Video, Code2, MessageSquare, FileText, ArrowLeft } from 'lucide-react';
import { Concept, ReviewMode, FSRSRating } from '@/types/dashboard';
import { FlashcardView } from './FlashcardView';
import { QuizView } from './QuizView';

interface EmbeddedReviewSessionProps {
  onFinished: () => void;
}

export function EmbeddedReviewSession({ onFinished }: EmbeddedReviewSessionProps) {
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const [mode, setMode] = useState<ReviewMode>('summary');
  const [generated, setGenerated] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    fetch('/api/review')
      .then(r => r.json())
      .then(data => {
        setConcepts(data.concepts || []);
      });
  }, []);

  // Filter out concepts that have already been reviewed in this session
  const activeDueConcepts = concepts ? concepts.filter(c => !reviewedIds.has(c.id)) : [];
  const currentConcept = activeDueConcepts.find(c => c.id === selectedConceptId);

  const generate = useCallback(async (m: ReviewMode, conceptId: string) => {
    setMode(m);
    setGenerated(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId, mode: m }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setGenerated(data);
    } catch (e: any) {
      setError(e.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConceptId && currentConcept) {
      setRated(false);
      generate('summary', selectedConceptId);
    }
  }, [selectedConceptId, currentConcept?.id]);

  const handleRate = async (rating: FSRSRating) => {
    if (!currentConcept) return;
    setRated(true);
    await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId: currentConcept.id, rating }),
    });

    setTimeout(() => {
      setReviewedIds(prev => new Set(prev).add(currentConcept.id));
      setSelectedConceptId(null);
    }, 600);
  };

  const renderSourceIcon = (stype: string) => {
    if (stype === 'youtube') return <Video size={12} />;
    if (stype === 'leetcode') return <Code2 size={12} />;
    if (stype === 'chat') return <MessageSquare size={12} />;
    return <FileText size={12} />;
  };

  if (!concepts) {
    return (
      <div className="review-loading" style={{ minHeight: '300px' }}>
        <Loader2 size={32} className="auth-spinner-icon" style={{ color: 'var(--accent)' }} />
        <p>Loading review session...</p>
      </div>
    );
  }

  if (activeDueConcepts.length === 0) {
    return (
      <div className="review-done" style={{ minHeight: '300px' }}>
        <CheckCircle2 size={44} style={{ color: 'var(--text)' }} />
        <h2>All Caught Up!</h2>
        <p>No concepts are due for review right now. Come back later or capture something new.</p>
        <button onClick={onFinished} className="home-btn">
          Back to Overview
        </button>
      </div>
    );
  }

  // ── VIEW 1: DUE CONCEPTS SELECTION OVERVIEW ──
  if (!selectedConceptId || !currentConcept) {
    return (
      <div className="concept-dashboard" style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Review Queue ({activeDueConcepts.length})</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>
              Select a concept to begin your Spaced Repetition session
            </p>
          </div>
        </div>

        <div className="db-table-wrapper">
          <table className="db-table">
            <thead>
              <tr>
                <th>Concept Name</th>
                <th>Key Principles Preview</th>
                <th>Source Origin</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeDueConcepts.map((concept) => (
                <tr
                  key={concept.id}
                  className="db-table-row"
                  onClick={() => setSelectedConceptId(concept.id)}
                >
                  <td className="db-table-cell-main">
                    <div className="db-concept-name" style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0 }}>
                      {concept.name}
                    </div>
                  </td>
                  <td>
                    {concept.keyPrinciples.length > 0 ? (
                      <ul className="db-concept-principles" style={{ margin: 0 }}>
                        {concept.keyPrinciples.slice(0, 2).map((p, i) => (
                          <li key={i} style={{ fontSize: '0.75rem' }}>
                            <span className="db-principle-check">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>No principles</span>
                    )}
                  </td>
                  <td>
                    {concept.sources && concept.sources.length > 0 ? (
                      concept.sources.map((s) => (
                        <span key={s.id} className="db-source-chip" style={{ fontSize: '0.72rem' }}>
                          {renderSourceIcon(s.type)}
                          <span>{s.title || s.type}</span>
                        </span>
                      ))
                    ) : (
                      <span className="db-source-chip db-source-chip-manual" style={{ fontSize: '0.72rem' }}>
                        <FileText size={11} /> Manual Entry
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="db-badge db-badge-orange" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '0.72rem' }}>
                      Due Now
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="db-modal-btn-primary"
                      style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConceptId(concept.id);
                      }}
                    >
                      Start Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── VIEW 2: ACTIVE CONCEPT REVISION SESSION ──
  return (
    <div className="concept-dashboard" style={{ marginTop: '0.5rem' }}>
      {/* Top Bar Navigation for active review */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          onClick={() => setSelectedConceptId(null)}
          className="db-history-expand-btn"
          style={{ margin: 0 }}
        >
          <ArrowLeft size={13} /> Back to Due List ({activeDueConcepts.length})
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Switch concept:</span>
          <select
            value={selectedConceptId}
            onChange={(e) => setSelectedConceptId(e.target.value)}
            className="auth-input"
            style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.82rem', height: 'auto' }}
          >
            {activeDueConcepts.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="concept-header">
        <h2 className="concept-title">{currentConcept.name}</h2>
        <p className="concept-desc">{currentConcept.description}</p>
        <div className="source-chips">
          {currentConcept.sources.map(s => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="source-chip">
              {renderSourceIcon(s.type)} <span>{s.title}</span>
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
            onClick={() => generate(m, currentConcept.id)}
          >
            {m === 'summary' ? 'Quick Revision' : m === 'flashcard' ? 'Flashcard' : 'Quiz'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="content-area">
        {loading && (
          <div className="loading-state">
            <Loader2 size={26} className="auth-spinner-icon" style={{ color: 'var(--accent)' }} />
            <p>Generating {mode}...</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-state">
            <p className="error-title">Generation Failed</p>
            <p className="error-msg">{error}</p>
            <p className="error-hint">Make sure GROQ_API_KEY or GEMINI_API_KEY is configured.</p>
            <div className="blueprint-fallback">
              <h4>Raw Blueprint</h4>
              <p><strong>Key Principles:</strong></p>
              <ul>{currentConcept.keyPrinciples.map((p, i) => (
                <li key={i}><CheckCircle2 size={11} style={{ display: 'inline', marginRight: '4px' }} />{p}</li>
              ))}</ul>
            </div>
          </div>
        )}

        {!loading && generated?.mode === 'summary' && (
          <div className="summary-content">
            <div
              className="summary-text"
              dangerouslySetInnerHTML={{
                __html: generated.data.text
                  .replace(/^[\s]*[\*\-]\s*([✓✔⚠️⚡])/gm, '$1')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </div>
        )}

        {!loading && generated?.mode === 'flashcard' && (
          <FlashcardView flashcards={generated.data.flashcards} />
        )}

        {!loading && generated?.mode === 'quiz' && (
          <QuizView
            quizzes={generated.data.quizzes}
            loading={loading}
            onRegenerate={() => generate('quiz', currentConcept.id)}
          />
        )}
      </div>

      {/* FSRS Rating Bar */}
      {!rated && (
        <div className="rating-bar">
          <p className="rating-label">How well did you know this concept?</p>
          <div className="rating-buttons">
            {([1, 2, 3, 4] as FSRSRating[]).map((r) => {
              const labels = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };
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
      {rated && (
        <div className="rated-msg">
          <CheckCircle2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Saved! Returning to list...
        </div>
      )}
    </div>
  );
}
