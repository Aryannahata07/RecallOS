export interface Source {
  id: string;
  url: string;
  title: string;
  type: string;
  rawContent?: string;
  createdAt?: string;
  concepts?: Concept[];
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  keyPrinciples: string[];
  pitfalls: string[];
  mentalModels: string;
  nextReviewDue: string;
  lastReviewedAt?: string | null;
  reps: number;
  stability: number;
  createdAt?: string;
  sources: Source[];
}

export type ReviewMode = 'summary' | 'flashcard' | 'quiz';
export type FSRSRating = 1 | 2 | 3 | 4;
export type TabType = 'dashboard' | 'review' | 'upcoming' | 'completed' | 'history' | 'concepts';

export interface DashboardClientProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  totalConcepts: number;
  totalSources: number;
  dueNow: number;
  masteredConcepts: number;
  allConcepts: Concept[];
  allSources: Source[];
  signOutAction: () => Promise<void>;
  initialTab?: TabType;
}
