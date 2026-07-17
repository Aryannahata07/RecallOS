import { FileText, Calendar, Trash2 } from 'lucide-react';
import { Concept } from '@/types/dashboard';
import { sourceIcon, sourceTypeLabel, formatDate, getRelativeUpcomingTime } from './helpers';

interface ConceptCardProps {
  concept: Concept;
  showScheduledBanner?: boolean;
  showLastReviewed?: boolean;
  onDelete?: (id: string) => void;
}

export function ConceptCard({ concept, showScheduledBanner, showLastReviewed, onDelete }: ConceptCardProps) {
  const isMastered = concept.stability >= 21;
  const isLearning = concept.stability >= 7 && concept.stability < 21;

  return (
    <div className="db-concept-card">
      {showScheduledBanner && (
        <div className="db-scheduled-banner">
          <Calendar size={12} />
          <span>Scheduled on {formatDate(concept.nextReviewDue)} ({getRelativeUpcomingTime(concept.nextReviewDue)})</span>
        </div>
      )}

      <div className="db-concept-card-top">
        <h3 className="db-concept-name">{concept.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className={`db-badge ${isMastered ? 'db-badge-mastered' : isLearning ? 'db-badge-learning' : 'db-badge-new'}`}>
            {isMastered ? 'Mastered' : isLearning ? 'Learning' : 'New'}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(concept.id)}
              className="db-card-delete-btn"
              title="Delete concept"
              aria-label="Delete concept"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="db-concept-desc">{concept.description}</p>

      {showLastReviewed && (
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.4rem 0', display: 'flex', gap: '0.8rem' }}>
          <span><strong>Reps:</strong> {concept.reps} review{concept.reps === 1 ? '' : 's'}</span>
          <span><strong>Stability:</strong> {concept.stability.toFixed(1)}d</span>
        </div>
      )}

      {concept.keyPrinciples.length > 0 && (
        <ul className="db-concept-principles">
          {concept.keyPrinciples.slice(0, 2).map((p, i) => (
            <li key={i}><span className="db-principle-check">✓</span> {p}</li>
          ))}
        </ul>
      )}

      <div className="db-concept-footer">
        {concept.sources && concept.sources.length > 0 ? (
          concept.sources.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="db-source-chip">
              {sourceIcon(s.type)}
              <span>{sourceTypeLabel(s.type)}</span>
            </a>
          ))
        ) : (
          <span className="db-source-chip db-source-chip-manual">
            <FileText size={11} /> Manual Entry
          </span>
        )}
      </div>
    </div>
  );
}
