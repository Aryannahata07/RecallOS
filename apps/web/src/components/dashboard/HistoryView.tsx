import { useState } from 'react';
import { History as HistoryIcon, ExternalLink, AlignLeft, ChevronUp, ChevronDown, Sparkles, Trash2 } from 'lucide-react';
import { Source } from '@/types/dashboard';
import { sourceIcon, sourceTypeLabel, formatDate } from './helpers';

interface HistoryViewProps {
  filteredSources: Source[];
  searchQuery: string;
  totalSourcesCount: number;
  onDeleteSource?: (id: string) => void;
}

export function HistoryView({ filteredSources, searchQuery, totalSourcesCount, onDeleteSource }: HistoryViewProps) {
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const toggleSourceExpand = (id: string) => {
    setExpandedSources(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="db-concepts-section">
      <div className="db-concepts-header">
        <span className="db-section-label">
          {searchQuery ? `History Results (${filteredSources.length})` : 'All Stored Links & Raw Text Entries'}
        </span>
        <span className="db-concepts-count">{totalSourcesCount} total sources</span>
      </div>

      {filteredSources.length === 0 ? (
        <div className="db-empty">
          <HistoryIcon size={28} className="db-empty-icon" />
          <h3>No stored sources found</h3>
          <p>Capture links using the Chrome extension or click "+ Add Knowledge" to paste raw text and links.</p>
        </div>
      ) : (
        <div className="db-history-list">
          {filteredSources.map((source) => {
            const isRawTextUrl = source.url.startsWith('raw-text://') || source.url.startsWith('https://manual-entry-');
            const isExpanded = !!expandedSources[source.id];

            return (
              <div key={source.id} className="db-history-card">
                <div className="db-history-header">
                  <div className="db-history-title-wrap">
                    <div className="db-history-meta">
                      <span className="db-source-chip">
                        {sourceIcon(source.type)}
                        <span>{sourceTypeLabel(source.type)}</span>
                      </span>
                      <span className="db-history-date">
                        Added on {formatDate(source.createdAt)}
                      </span>
                    </div>
                    <h3 className="db-history-title">{source.title || 'Untitled Source'}</h3>
                    {!isRawTextUrl && source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="db-history-link"
                      >
                        <ExternalLink size={12} />
                        <span>{source.url}</span>
                      </a>
                    )}
                  </div>
                  {onDeleteSource && (
                    <button
                      onClick={() => onDeleteSource(source.id)}
                      className="db-card-delete-btn"
                      title="Delete source entry"
                      aria-label="Delete source entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Expand raw content button */}
                {source.rawContent && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSourceExpand(source.id)}
                      className="db-history-expand-btn"
                    >
                      <AlignLeft size={12} />
                      <span>{isExpanded ? 'Hide captured text' : 'View captured raw text'}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {isExpanded && (
                      <div className="db-history-raw-box">
                        {source.rawContent}
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Concepts derived from this source */}
                {source.concepts && source.concepts.length > 0 && (
                  <div className="db-history-concepts">
                    <div className="db-history-concepts-label">
                      <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                      <span>Concepts derived from this source ({source.concepts.length}):</span>
                    </div>
                    <div className="db-history-concept-chips">
                      {source.concepts.map((c) => (
                        <div key={c.id} className="db-history-concept-chip">
                          <span className="db-history-concept-name">{c.name}</span>
                          <span className="db-history-concept-desc">{c.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
