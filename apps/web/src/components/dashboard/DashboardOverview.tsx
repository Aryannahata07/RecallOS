import { BookOpen, Timer, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import { Concept, TabType } from '@/types/dashboard';
import { ConceptCard } from './ConceptCard';

interface DashboardOverviewProps {
  totalConcepts: number;
  totalSources: number;
  dueNow: number;
  masteredConcepts: number;
  filteredConcepts: Concept[];
  setActiveTab: (tab: TabType) => void;
  onDeleteConcept?: (id: string) => void;
}

export function DashboardOverview({
  totalConcepts,
  totalSources,
  dueNow,
  masteredConcepts,
  filteredConcepts,
  setActiveTab,
  onDeleteConcept,
}: DashboardOverviewProps) {
  const retentionRate = totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0;

  return (
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
          <div className="db-stat-trend">Links & Raw Text</div>
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
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--surface2)" strokeWidth="11" />
              <circle
                cx="60" cy="60" r="48" fill="none"
                stroke="url(#retGrad)" strokeWidth="11" strokeLinecap="round"
                strokeDasharray={`${(retentionRate / 100) * 301.6} 301.6`}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="retGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--muted)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="db-donut-label">
              <span className="db-donut-pct">{retentionRate}%</span>
              <span className="db-donut-sub">mastered</span>
            </div>
          </div>
          <div className="db-retention-legend">
            <div className="db-legend-item"><span className="db-legend-dot db-legend-mastered" />{masteredConcepts} Mastered</div>
            <div className="db-legend-item"><span className="db-legend-dot db-legend-learning" />{totalConcepts - masteredConcepts} In Progress</div>
          </div>
        </div>
      </section>

      {/* Recently Captured Concepts */}
      <section className="db-concepts-section">
        <div className="db-concepts-header">
          <span className="db-section-label">Recently Captured Concepts</span>
          <button onClick={() => setActiveTab('concepts')} className="db-history-link" style={{ fontSize: '0.8rem' }}>
            View All ({totalConcepts}) →
          </button>
        </div>

        {filteredConcepts.length === 0 ? (
          <div className="db-empty">
            <Search size={28} className="db-empty-icon" />
            <h3>No concepts found</h3>
            <p>Click "+ Add Knowledge" above to capture links or paste raw text.</p>
          </div>
        ) : (
          <div className="db-concept-grid">
            {filteredConcepts.slice(0, 6).map((concept) => (
              <ConceptCard key={concept.id} concept={concept} onDelete={onDeleteConcept} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
