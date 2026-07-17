'use client';

import { useState } from 'react';
import { DashboardClientProps, TabType, Concept, Source } from '@/types/dashboard';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { EmbeddedReviewSession } from '@/components/dashboard/EmbeddedReviewSession';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { UpcomingView } from '@/components/dashboard/UpcomingView';
import { CompletedView } from '@/components/dashboard/CompletedView';
import { HistoryView } from '@/components/dashboard/HistoryView';
import { ConceptsView } from '@/components/dashboard/ConceptsView';
import { AddKnowledgeModal } from '@/components/dashboard/AddKnowledgeModal';
import { DeleteConfirmModal } from '@/components/dashboard/DeleteConfirmModal';
import { UpcomingCalendarModal } from '@/components/dashboard/UpcomingCalendarModal';

export default function DashboardClient({
  user,
  totalConcepts: initialTotalConcepts,
  totalSources: initialTotalSources,
  dueNow,
  masteredConcepts,
  allConcepts = [],
  allSources = [],
  signOutAction,
  initialTab = 'dashboard',
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Stateful lists for dynamic deletion
  const [conceptsList, setConceptsList] = useState<Concept[]>(allConcepts);
  const [sourcesList, setSourcesList] = useState<Source[]>(allSources);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'concept' | 'source';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const now = new Date();

  // Delete handlers triggering custom modal
  const requestDeleteConcept = (id: string) => {
    const concept = conceptsList.find(c => c.id === id);
    setDeleteTarget({
      type: 'concept',
      id,
      name: concept?.name || 'this concept',
    });
  };

  const requestDeleteSource = (id: string) => {
    const source = sourcesList.find(s => s.id === id);
    setDeleteTarget({
      type: 'source',
      id,
      name: source?.title || 'this history entry',
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'concept') {
        const res = await fetch(`/api/concepts?id=${deleteTarget.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Failed to delete concept');
          return;
        }
        setConceptsList(prev => prev.filter(c => c.id !== deleteTarget.id));
        setSourcesList(prev => prev.map(s => ({
          ...s,
          concepts: s.concepts ? s.concepts.filter(c => c.id !== deleteTarget.id) : []
        })));
      } else {
        const res = await fetch(`/api/sources?id=${deleteTarget.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Failed to delete source');
          return;
        }
        setSourcesList(prev => prev.filter(s => s.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered concept lists
  const upcomingConcepts = conceptsList
    .filter(c => new Date(c.nextReviewDue) > now)
    .sort((a, b) => new Date(a.nextReviewDue).getTime() - new Date(b.nextReviewDue).getTime());

  const completedConcepts = conceptsList
    .filter(c => c.reps > 0 || c.stability >= 21 || c.lastReviewedAt != null)
    .sort((a, b) => new Date(b.lastReviewedAt || b.createdAt || 0).getTime() - new Date(a.lastReviewedAt || a.createdAt || 0).getTime());

  const filteredUpcoming = upcomingConcepts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keyPrinciples.some((p) => p.toLowerCase().includes(q))
    );
  });

  const filteredCompleted = completedConcepts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keyPrinciples.some((p) => p.toLowerCase().includes(q))
    );
  });

  const filteredConcepts = conceptsList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keyPrinciples.some((p) => p.toLowerCase().includes(q))
    );
  });

  const filteredSources = sourcesList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q) ||
      (s.rawContent && s.rawContent.toLowerCase().includes(q)) ||
      (s.concepts && s.concepts.some(c => c.name.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="db-root">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        dueNow={dueNow}
        upcomingCount={upcomingConcepts.length}
        completedCount={completedConcepts.length}
        totalSources={sourcesList.length}
        totalConcepts={conceptsList.length}
        user={user}
        signOutAction={signOutAction}
      />

      <main className="db-main">
        <Topbar
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
          setIsModalOpen={setIsModalOpen}
          dueNow={dueNow}
          setActiveTab={setActiveTab}
          onOpenCalendar={() => setIsCalendarOpen(true)}
        />

        {activeTab === 'dashboard' && (
          <DashboardOverview
            totalConcepts={conceptsList.length}
            totalSources={sourcesList.length}
            dueNow={dueNow}
            masteredConcepts={masteredConcepts}
            filteredConcepts={filteredConcepts}
            setActiveTab={setActiveTab}
            onDeleteConcept={requestDeleteConcept}
          />
        )}

        {activeTab === 'review' && (
          <EmbeddedReviewSession onFinished={() => setActiveTab('dashboard')} />
        )}

        {activeTab === 'upcoming' && (
          <UpcomingView
            filteredUpcoming={filteredUpcoming}
            searchQuery={searchQuery}
            upcomingCount={upcomingConcepts.length}
            onDeleteConcept={requestDeleteConcept}
          />
        )}

        {activeTab === 'completed' && (
          <CompletedView
            filteredCompleted={filteredCompleted}
            searchQuery={searchQuery}
            completedCount={completedConcepts.length}
            onDeleteConcept={requestDeleteConcept}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            filteredSources={filteredSources}
            searchQuery={searchQuery}
            totalSourcesCount={sourcesList.length}
            onDeleteSource={requestDeleteSource}
          />
        )}

        {activeTab === 'concepts' && (
          <ConceptsView
            filteredConcepts={filteredConcepts}
            searchQuery={searchQuery}
            totalConceptsCount={conceptsList.length}
            onDeleteConcept={requestDeleteConcept}
          />
        )}
      </main>

      <AddKnowledgeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <UpcomingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        concepts={conceptsList}
        onStartReview={() => setActiveTab('review')}
      />

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.type === 'concept' ? `Delete "${deleteTarget?.name}"?` : `Delete History Entry?`}
        message={deleteTarget?.type === 'concept'
          ? `Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove it from all review sessions and concept lists.`
          : `Are you sure you want to delete "${deleteTarget?.name}" from your stored history?`
        }
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
