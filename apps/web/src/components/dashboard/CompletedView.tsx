import { CheckCircle2 } from 'lucide-react';
import { Concept } from '@/types/dashboard';
import { ConceptCard } from './ConceptCard';

interface CompletedViewProps {
  filteredCompleted: Concept[];
  searchQuery: string;
  completedCount: number;
  onDeleteConcept?: (id: string) => void;
}

export function CompletedView({ filteredCompleted, searchQuery, completedCount, onDeleteConcept }: CompletedViewProps) {
  return (
    <section className="db-concepts-section">
      <div className="db-concepts-header">
        <span className="db-section-label">
          {searchQuery ? `Completed Results (${filteredCompleted.length})` : 'Completed & Revised Concepts'}
        </span>
        <span className="db-concepts-count">{completedCount} completed</span>
      </div>

      {filteredCompleted.length === 0 ? (
        <div className="db-empty">
          <CheckCircle2 size={28} className="db-empty-icon" />
          <h3>No completed revisions yet</h3>
          <p>Complete a Review Session from the sidebar to lock in concepts and move them to Completed.</p>
        </div>
      ) : (
        <div className="db-concept-grid">
          {filteredCompleted.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} showLastReviewed onDelete={onDeleteConcept} />
          ))}
        </div>
      )}
    </section>
  );
}
