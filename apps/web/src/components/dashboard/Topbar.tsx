import { List, Search, Plus, X, Calendar } from 'lucide-react';
import { TabType } from '@/types/dashboard';

interface TopbarProps {
  activeTab: TabType;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: (open: boolean) => void;
  dueNow: number;
  setActiveTab: (tab: TabType) => void;
  onOpenCalendar?: () => void;
}

export function Topbar({
  activeTab,
  searchQuery,
  setSearchQuery,
  setSidebarOpen,
  setIsModalOpen,
  dueNow,
  setActiveTab,
  onOpenCalendar,
}: TopbarProps) {
  return (
    <header className="db-topbar">
      <div className="db-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        <button className="db-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
          <List size={17} />
        </button>
        <div>
          <h1 className="db-page-title">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'review' && 'Review Session'}
            {activeTab === 'upcoming' && 'Upcoming Revisions'}
            {activeTab === 'completed' && 'Completed Knowledge'}
            {activeTab === 'history' && 'Stored History'}
            {activeTab === 'concepts' && 'My Concepts'}
          </h1>
          <p className="db-page-subtitle">
            {activeTab === 'review'
              ? 'FSRS Spaced Repetition Engine'
              : activeTab === 'upcoming'
                ? 'Scheduled revision queue by due date'
                : activeTab === 'completed'
                  ? 'Knowledge blueprints you have revised and mastered'
                  : activeTab === 'history'
                    ? 'All links & raw text entries captured with extracted concepts'
                    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="db-search-wrap">
        <Search size={14} className="db-search-icon" />
        <input
          type="text"
          placeholder="Search concepts, links, text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="db-search-input"
        />
        {searchQuery && (
          <button className="db-search-clear" onClick={() => setSearchQuery('')}>
            <X size={12} />
          </button>
        )}
      </div>

      <div className="db-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => setIsModalOpen(true)} className="db-add-btn">
          <Plus size={14} />
          <span>Add Knowledge</span>
        </button>
        {onOpenCalendar && (
          <button
            onClick={onOpenCalendar}
            className="db-add-btn"
            style={{ padding: '0.45rem 0.65rem', background: 'var(--surface2)', borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
            title="Open Upcoming Revisions Calendar"
            aria-label="Upcoming Calendar"
          >
            <Calendar size={15} style={{ color: 'var(--accent)' }} />
          </button>
        )}
        {dueNow > 0 && activeTab !== 'review' && (
          <button onClick={() => setActiveTab('review')} className="db-review-pill">
            <span className="db-review-pill-dot" />
            {dueNow} due
          </button>
        )}
      </div>
    </header>
  );
}
