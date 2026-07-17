import { Calendar } from 'lucide-react';
import { Concept } from '@/types/dashboard';
import { ConceptCard } from './ConceptCard';

interface UpcomingViewProps {
  filteredUpcoming: Concept[];
  searchQuery: string;
  upcomingCount: number;
  onDeleteConcept?: (id: string) => void;
}

export function UpcomingView({ filteredUpcoming, searchQuery, upcomingCount, onDeleteConcept }: UpcomingViewProps) {
  return (
    <section className="db-concepts-section">
      <div className="db-concepts-header">
        <span className="db-section-label">
          {searchQuery ? `Upcoming Results (${filteredUpcoming.length})` : 'Scheduled Revision Roadmap'}
        </span>
        <span className="db-concepts-count">{upcomingCount} scheduled</span>
      </div>

      {filteredUpcoming.length === 0 ? (
        <div className="db-empty">
          <Calendar size={28} className="db-empty-icon" />
          <h3>No upcoming revisions scheduled</h3>
          <p>All your active concepts are either due right now for review or you have not added concepts yet.</p>
        </div>
      ) : (
        <div className="db-concept-grid">
          {filteredUpcoming.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} showScheduledBanner onDelete={onDeleteConcept} />
          ))}
        </div>
      )}
    </section>
  );
}
