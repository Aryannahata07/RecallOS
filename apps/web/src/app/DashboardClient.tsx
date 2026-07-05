'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Clock,
  List,
  LogOut,
  Search,
  Plus,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  Timer,
  X,
  FileText,
  Video,
  Code2,
  MessageSquare,
  Loader2,
} from 'lucide-react';

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
  stability: number;
  sources: Source[];
}

type ReviewMode = 'summary' | 'flashcard' | 'quiz';
type FSRSRating = 1 | 2 | 3 | 4;

interface DashboardClientProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  totalConcepts: number;
  totalSources: number;
  dueNow: number;
  masteredConcepts: number;
  recentConcepts: Concept[];
  signOutAction: () => Promise<void>;
  initialTab?: 'dashboard' | 'review' | 'concepts';
}

function EmbeddedReviewSession({ onFinished }: { onFinished: () => void }) {
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<ReviewMode>('summary');
  const [generated, setGenerated] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    fetch('/api/review')
      .then(r => r.json())
      .then(data => setConcepts(data.concepts || []));
  }, []);

  const currentConcept = concepts && concepts[index];

  const generate = useCallback(async (m: ReviewMode) => {
    if (!currentConcept) return;
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
        body: JSON.stringify({ conceptId: currentConcept.id, mode: m }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setGenerated(data);
    } catch (e: any) {
      setError(e.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentConcept?.id]);

  useEffect(() => {
    if (currentConcept) {
      setRated(false);
      generate('summary');
    }
  }, [currentConcept?.id]);

  const handleRate = async (rating: FSRSRating) => {
    if (!currentConcept) return;
    setRated(true);
    await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId: currentConcept.id, rating }),
    });
    setTimeout(() => {
      if (!concepts) return;
      if (index + 1 >= concepts.length) setDone(true);
      else setIndex(i => i + 1);
    }, 600);
  };

  const renderSourceIcon = (stype: string) => {
    if (stype === 'youtube') return <Video size={12} />;
    if (stype === 'leetcode') return <Code2 size={12} />;
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

  if (concepts.length === 0 || done) {
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

  return (
    <div className="concept-dashboard" style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span className="db-section-label">Reviewing Concept</span>
        <span className="review-progress">{index + 1} / {concepts.length} concepts</span>
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
            onClick={() => generate(m)}
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
                <strong>{selectedOption === generated.data.correctIndex ? 'Correct' : 'Incorrect'}</strong>
                <p>{generated.data.explanation}</p>
              </div>
            )}
          </div>
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
          Saved! Loading next concept...
        </div>
      )}
    </div>
  );
}

export default function DashboardClient({
  user,
  totalConcepts,
  totalSources,
  dueNow,
  masteredConcepts,
  recentConcepts,
  signOutAction,
  initialTab = 'dashboard',
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'concepts'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'article' | 'youtube' | 'leetcode' | 'chat'>('article');
  const [rawContent, setRawContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState('');
  const [ingestError, setIngestError] = useState('');

  const filteredConcepts = recentConcepts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keyPrinciples.some((p) => p.toLowerCase().includes(q))
    );
  });

  const sourceIcon = (stype: string) => {
    if (stype === 'youtube') return <Video size={11} />;
    if (stype === 'leetcode') return <Code2 size={11} />;
    if (stype === 'chat') return <MessageSquare size={11} />;
    return <FileText size={11} />;
  };

  const sourceTypeLabel = (stype: string) => {
    if (stype === 'youtube') return 'YouTube';
    if (stype === 'leetcode') return 'LeetCode';
    if (stype === 'chat') return 'ChatGPT';
    return 'Article';
  };

  const retentionRate = totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0;

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngestError(''); setIngestSuccess(''); setIsIngesting(true);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url || `https://manual-entry-${Date.now()}.local`,
          title: title || 'Manual Note', type,
          rawContent: rawContent || title,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setIngestError(data.error || 'Failed to ingest content'); setIsIngesting(false); return; }
      setIngestSuccess('Content queued for extraction! Refreshing...');
      setTimeout(() => {
        setIsModalOpen(false); setUrl(''); setTitle(''); setRawContent(''); setIngestSuccess('');
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setIngestError(err.message || 'Something went wrong');
    } finally { setIsIngesting(false); }
  };

  const typeOptions = [
    { id: 'article', label: 'Article', Icon: FileText },
    { id: 'youtube', label: 'YouTube', Icon: Video },
    { id: 'leetcode', label: 'LeetCode', Icon: Code2 },
    { id: 'chat', label: 'ChatGPT', Icon: MessageSquare },
  ];

  return (
    <div className="db-root">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="db-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`db-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="db-sidebar-top">
          <div className="db-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-creme.png" alt="RecallOS" className="db-logo-img" />
            <span className="db-logo-text">RecallOS</span>
          </div>

          <nav className="db-nav">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`db-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={15} /> Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('review'); setSidebarOpen(false); }}
              className={`db-nav-item ${activeTab === 'review' ? 'active' : ''}`}
            >
              <Clock size={15} /> Review Session
              {dueNow > 0 && <span className="db-nav-badge">{dueNow}</span>}
            </button>
            <button
              onClick={() => { setActiveTab('concepts'); setSidebarOpen(false); }}
              className={`db-nav-item ${activeTab === 'concepts' ? 'active' : ''}`}
            >
              <List size={15} /> My Concepts
            </button>
          </nav>
        </div>

        <div className="db-sidebar-bottom">
          <div className="db-user-card">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="db-avatar" />
            ) : (
              <div className="db-avatar db-avatar-fallback">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="db-user-info">
              <span className="db-user-name">{user.name || 'User'}</span>
              <span className="db-user-email">{user.email}</span>
            </div>
            <button onClick={() => signOutAction()} className="db-signout-btn" title="Sign out">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <main className="db-main">
        {/* Topbar */}
        <header className="db-topbar">
          <div className="db-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <button className="db-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
              <List size={17} />
            </button>
            <div>
              <h1 className="db-page-title">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'review' && 'Review Session'}
                {activeTab === 'concepts' && 'My Concepts'}
              </h1>
              <p className="db-page-subtitle">
                {activeTab === 'review'
                  ? 'FSRS Spaced Repetition Engine'
                  : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="db-search-wrap">
            <Search size={14} className="db-search-icon" />
            <input
              type="text" placeholder="Search concepts, topics..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="db-search-input"
            />
            {searchQuery && (
              <button className="db-search-clear" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="db-header-actions">
            <button onClick={() => setIsModalOpen(true)} className="db-add-btn">
              <Plus size={14} />
              <span>Add Knowledge</span>
            </button>
            {dueNow > 0 && activeTab !== 'review' && (
              <button onClick={() => setActiveTab('review')} className="db-review-pill">
                <span className="db-review-pill-dot" />
                {dueNow} due
              </button>
            )}
          </div>
        </header>

        {/* ── TAB 1: REVIEW SESSION (EMBEDDED IN MAIN AREA) ── */}
        {activeTab === 'review' && (
          <EmbeddedReviewSession onFinished={() => setActiveTab('dashboard')} />
        )}

        {/* ── TAB 2 & 3: DASHBOARD & CONCEPTS OVERVIEW ── */}
        {activeTab !== 'review' && (
          <>
            {/* Stats */}
            <section className="db-stats">
              <div className="db-stat-card db-stat-blue">
                <div className="db-stat-icon"><BookOpen size={18} /></div>
                <div className="db-stat-body">
                  <span className="db-stat-num">{totalConcepts}</span>
                  <span className="db-stat-label">Concepts Learned</span>
                </div>
                <div className="db-stat-trend">All time</div>
              </div>
              <div className="db-stat-card db-stat-orange">
                <div className="db-stat-icon"><Timer size={18} /></div>
                <div className="db-stat-body">
                  <span className="db-stat-num">{dueNow}</span>
                  <span className="db-stat-label">Due for Review</span>
                </div>
                <div className="db-stat-trend">Right now</div>
              </div>
              <div className="db-stat-card db-stat-green">
                <div className="db-stat-icon"><CheckCircle2 size={18} /></div>
                <div className="db-stat-body">
                  <span className="db-stat-num">{masteredConcepts}</span>
                  <span className="db-stat-label">Mastered</span>
                </div>
                <div className="db-stat-trend">Stability ≥ 21d</div>
              </div>
              <div className="db-stat-card db-stat-purple">
                <div className="db-stat-icon"><TrendingUp size={18} /></div>
                <div className="db-stat-body">
                  <span className="db-stat-num">{totalSources}</span>
                  <span className="db-stat-label">Sources Captured</span>
                </div>
                <div className="db-stat-trend">YT · Articles · LC</div>
              </div>
            </section>

            {/* Middle row */}
            <section className="db-mid-row">
              <div className="db-review-card">
                <div className="db-review-card-header">
                  <span className="db-section-label">Review Session</span>
                </div>
                <div className="db-review-card-body">
                  <h3 className="db-review-title">
                    {dueNow > 0 ? `${dueNow} concept${dueNow > 1 ? 's' : ''} waiting` : "You're all caught up"}
                  </h3>
                  <p className="db-review-sub">
                    {dueNow > 0
                      ? "Your memory starts fading — lock these in before they slip."
                      : "No concepts due right now. Come back later or capture something new."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('review')}
                  className={`db-review-cta-btn ${dueNow === 0 ? 'db-review-cta-secondary' : ''}`}
                >
                  {dueNow > 0 ? 'Start Session' : 'Browse Concepts'}
                </button>
              </div>

              <div className="db-retention-card">
                <span className="db-section-label">Retention Rate</span>
                <div className="db-retention-meter">
                  <svg viewBox="0 0 120 120" className="db-donut">
                    <circle cx="60" cy="60" r="48" fill="none" stroke="var(--surface2)" strokeWidth="11"/>
                    <circle cx="60" cy="60" r="48" fill="none"
                      stroke="url(#retGrad)" strokeWidth="11" strokeLinecap="round"
                      strokeDasharray={`${(retentionRate / 100) * 301.6} 301.6`}
                      transform="rotate(-90 60 60)"
                    />
                    <defs>
                      <linearGradient id="retGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--accent)"/>
                        <stop offset="100%" stopColor="var(--muted)"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="db-donut-label">
                    <span className="db-donut-pct">{retentionRate}%</span>
                    <span className="db-donut-sub">mastered</span>
                  </div>
                </div>
                <div className="db-retention-legend">
                  <div className="db-legend-item"><span className="db-legend-dot db-legend-mastered"/>{masteredConcepts} Mastered</div>
                  <div className="db-legend-item"><span className="db-legend-dot db-legend-learning"/>{totalConcepts - masteredConcepts} In Progress</div>
                </div>
              </div>
            </section>

            {/* Concepts */}
            <section className="db-concepts-section" id="concepts">
              <div className="db-concepts-header">
                <span className="db-section-label">
                  {searchQuery ? `Results (${filteredConcepts.length})` : 'Recently Captured'}
                </span>
                <span className="db-concepts-count">{totalConcepts} total</span>
              </div>

              {filteredConcepts.length === 0 ? (
                <div className="db-empty">
                  <Search size={28} className="db-empty-icon" />
                  <h3>No concepts found</h3>
                  <p>{searchQuery
                    ? `No matches for "${searchQuery}". Try a different keyword.`
                    : 'Click "+ Add Knowledge" above or use the Chrome Extension to capture your first concept.'}</p>
                </div>
              ) : (
                <div className="db-concept-grid">
                  {filteredConcepts.map((concept) => (
                    <div key={concept.id} className="db-concept-card">
                      <div className="db-concept-card-top">
                        <h3 className="db-concept-name">{concept.name}</h3>
                        <span className={`db-badge ${concept.stability >= 21 ? 'db-badge-mastered' : concept.stability >= 7 ? 'db-badge-learning' : 'db-badge-new'}`}>
                          {concept.stability >= 21 ? 'Mastered' : concept.stability >= 7 ? 'Learning' : 'New'}
                        </span>
                      </div>
                      <p className="db-concept-desc">{concept.description}</p>
                      {concept.keyPrinciples.length > 0 && (
                        <ul className="db-concept-principles">
                          {concept.keyPrinciples.slice(0, 2).map((p, i) => (
                            <li key={i}><span className="db-principle-check">✓</span> {p}</li>
                          ))}
                        </ul>
                      )}
                      <div className="db-concept-footer">
                        {concept.sources.length > 0 ? concept.sources.map((s) => (
                          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="db-source-chip">
                            {sourceIcon(s.type)}
                            <span>{sourceTypeLabel(s.type)}</span>
                          </a>
                        )) : (
                          <span className="db-source-chip db-source-chip-manual">
                            <FileText size={11} /> Manual Note
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ── Add Knowledge Modal ── */}
      {isModalOpen && (
        <div className="db-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <div>
                <h2 className="db-modal-title">Add Knowledge Source</h2>
                <p className="db-modal-sub">Paste a URL or raw content to extract Knowledge Blueprints</p>
              </div>
              <button className="db-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={13} />
              </button>
            </div>

            {ingestSuccess && <div className="auth-alert auth-alert-success">{ingestSuccess}</div>}
            {ingestError && <div className="auth-alert auth-alert-error">{ingestError}</div>}

            <form onSubmit={handleIngestSubmit} className="db-modal-form">
              <div className="auth-field">
                <label className="auth-label">Source Type</label>
                <div className="db-type-selector">
                  {typeOptions.map(({ id, label, Icon }) => (
                    <button key={id} type="button"
                      className={`db-type-btn ${type === id ? 'active' : ''}`}
                      onClick={() => setType(id as any)}>
                      <Icon size={13} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Source Title</label>
                <input type="text" placeholder="e.g. How TCP/IP Handshake Works"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="auth-input" style={{ paddingLeft: '0.9rem' }} required />
              </div>

              <div className="auth-field">
                <label className="auth-label">Source URL (Optional)</label>
                <input type="url" placeholder="https://example.com/article"
                  value={url} onChange={(e) => setUrl(e.target.value)}
                  className="auth-input" style={{ paddingLeft: '0.9rem' }} />
              </div>

              <div className="auth-field">
                <label className="auth-label">Raw Content / Notes / Code</label>
                <textarea placeholder="Paste article text, transcript, ChatGPT discussion, or notes here..."
                  value={rawContent} onChange={(e) => setRawContent(e.target.value)}
                  className="db-modal-textarea" rows={4} required />
              </div>

              <div className="db-modal-equal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="db-modal-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isIngesting} className="db-modal-btn-primary">
                  {isIngesting ? <Loader2 size={14} className="auth-spinner-icon" /> : null}
                  {isIngesting ? 'Extracting...' : 'Extract Blueprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
