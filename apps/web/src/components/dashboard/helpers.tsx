import { Video, Code2, MessageSquare, FileText } from 'lucide-react';

export const sourceIcon = (stype: string, size = 13) => {
  if (stype === 'youtube') return <Video size={size} />;
  if (stype === 'leetcode') return <Code2 size={size} />;
  if (stype === 'chat') return <MessageSquare size={size} />;
  return <FileText size={size} />;
};

export const sourceTypeLabel = (stype: string) => {
  if (stype === 'youtube') return 'YouTube';
  if (stype === 'leetcode') return 'LeetCode';
  if (stype === 'chat') return 'ChatGPT / Notes';
  return 'Article';
};

export const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateStr?: string | Date) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getRelativeUpcomingTime = (dateStr: string) => {
  const diffMs = new Date(dateStr).getTime() - new Date().getTime();
  if (diffMs <= 0) return 'Due now';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  const diffDays = Math.floor(diffHours / 24);
  return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
};
