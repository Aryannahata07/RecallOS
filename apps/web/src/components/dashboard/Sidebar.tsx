import {
  LayoutDashboard,
  Clock,
  Calendar,
  CheckCircle2,
  History as HistoryIcon,
  List,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { TabType } from '@/types/dashboard';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  dueNow: number;
  upcomingCount: number;
  completedCount: number;
  totalSources: number;
  totalConcepts: number;
  user: { name?: string | null; email?: string | null; image?: string | null };
  signOutAction: () => Promise<void>;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  dueNow,
  upcomingCount,
  completedCount,
  totalSources,
  totalConcepts,
  user,
  signOutAction,
}: SidebarProps) {
  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div className="db-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`db-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="db-sidebar-top">
          <div className="db-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RecallOS" className="db-logo-img" />
            <span className="db-logo-text">RecallOS</span>
          </div>

          <nav className="db-nav">
            <div className="db-nav-section-label">MAIN</div>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`db-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <div className="db-nav-section-label">SPACED REPETITION</div>
            <button
              onClick={() => handleNavClick('review')}
              className={`db-nav-item ${activeTab === 'review' ? 'active' : ''}`}
            >
              <Clock size={16} />
              <span>Review Session</span>
              {dueNow > 0 && <span className="db-nav-badge">{dueNow}</span>}
            </button>

            <button
              onClick={() => handleNavClick('upcoming')}
              className={`db-nav-item ${activeTab === 'upcoming' ? 'active' : ''}`}
            >
              <Calendar size={16} />
              <span>Upcoming</span>
              {upcomingCount > 0 && <span className="db-nav-count">{upcomingCount}</span>}
            </button>

            <button
              onClick={() => handleNavClick('completed')}
              className={`db-nav-item ${activeTab === 'completed' ? 'active' : ''}`}
            >
              <CheckCircle2 size={16} />
              <span>Completed</span>
              {completedCount > 0 && <span className="db-nav-count">{completedCount}</span>}
            </button>

            <div className="db-nav-section-label">KNOWLEDGE BASE</div>
            <button
              onClick={() => handleNavClick('history')}
              className={`db-nav-item ${activeTab === 'history' ? 'active' : ''}`}
            >
              <HistoryIcon size={16} />
              <span>Stored History</span>
              {totalSources > 0 && <span className="db-nav-count">{totalSources}</span>}
            </button>

            <button
              onClick={() => handleNavClick('concepts')}
              className={`db-nav-item ${activeTab === 'concepts' ? 'active' : ''}`}
            >
              <List size={16} />
              <span>My Concepts</span>
              {totalConcepts > 0 && <span className="db-nav-count">{totalConcepts}</span>}
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
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
