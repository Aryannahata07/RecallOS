import { Search } from 'lucide-react';
import { Concept } from '@/types/dashboard';
import { ConceptCard } from './ConceptCard';

interface ConceptsViewProps {
  filteredConcepts: Concept[];
  searchQuery: string;
  totalConceptsCount: number;
  onDeleteConcept?: (id: string) => void;
}

export function ConceptsView({ filteredConcepts, searchQuery, totalConceptsCount, onDeleteConcept }: ConceptsViewProps) {
  return (
    <section className="db-concepts-section">
      <div className="db-concepts-header">
        <span className="db-section-label">
          {searchQuery ? `Results (${filteredConcepts.length})` : 'All Concepts Library'}
        </span>
        <span className="db-concepts-count">{totalConceptsCount} total</span>
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
            <ConceptCard key={concept.id} concept={concept} onDelete={onDeleteConcept} />
          ))}
        </div>
      )}
    </section>
  );
}
