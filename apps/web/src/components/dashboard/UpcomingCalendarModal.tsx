import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { Concept } from '@/types/dashboard';

interface UpcomingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepts: Concept[];
  onStartReview?: () => void;
}

export function UpcomingCalendarModal({
  isOpen,
  onClose,
  concepts,
  onStartReview,
}: UpcomingCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group concepts by YYYY-MM-DD
  const conceptsByDate = useMemo(() => {
    const map: Record<string, Concept[]> = {};
    concepts.forEach((c) => {
      const d = new Date(c.nextReviewDue);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [concepts]);

  if (!isOpen) return null;

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayConcepts = conceptsByDate[selectedKey] || [];

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div
        className="db-modal-card"
        style={{ maxWidth: '680px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="db-modal-header" style={{ marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="db-modal-title" style={{ fontSize: '1.1rem' }}>
              Upcoming Revision Calendar
            </h2>
          </div>
          <button className="db-modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <p className="db-modal-sub" style={{ marginBottom: '0.8rem', fontSize: '0.82rem' }}>
          Visual schedule of all your FSRS spaced repetition reviews.
        </p>

        {/* Month Navigator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.8rem',
            background: 'var(--surface2)',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={prevMonth}
              className="db-card-delete-btn"
              style={{ opacity: 1, color: 'var(--text-main)', padding: '0.2rem' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {monthName} {year}
            </span>
            <button
              onClick={nextMonth}
              className="db-card-delete-btn"
              style={{ opacity: 1, color: 'var(--text-main)', padding: '0.2rem' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="db-modal-btn-cancel"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
          >
            Today
          </button>
        </div>

        {/* Days Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '0.8rem',
          }}
        >
          {/* Empty slots for first week offset */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} style={{ height: '42px' }} />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const cellDate = new Date(year, month, dayNum);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dueConcepts = conceptsByDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const isSelected =
              selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === month &&
              selectedDate.getDate() === dayNum;

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDate(cellDate)}
                style={{
                  height: '44px',
                  borderRadius: '6px',
                  border: isSelected
                    ? '2px solid var(--accent)'
                    : isToday
                    ? '1px solid var(--accent-light, #2e7d32)'
                    : '1px solid var(--border-subtle)',
                  background: isSelected
                    ? 'rgba(46, 125, 50, 0.12)'
                    : isToday
                    ? 'var(--surface2)'
                    : 'var(--bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday || isSelected ? 700 : 500,
                    color: isToday ? 'var(--accent)' : 'var(--text-main)',
                  }}
                >
                  {dayNum}
                </span>

                {dueConcepts.length > 0 && (
                  <span
                    style={{
                      marginTop: '2px',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      background: 'var(--accent)',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '0px 5px',
                      lineHeight: '1.2',
                    }}
                  >
                    {dueConcepts.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Date Concepts List */}
        <div
          style={{
            background: 'var(--surface2)',
            borderRadius: '8px',
            padding: '0.6rem 0.8rem',
            border: '1px solid var(--border-subtle)',
            maxHeight: '150px',
            overflowY: 'auto',
            marginBottom: '0.8rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.4rem',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Revisions on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({selectedDayConcepts.length})
            </span>
            {selectedDayConcepts.length > 0 && onStartReview && (
              <button
                onClick={() => {
                  onClose();
                  onStartReview();
                }}
                className="db-modal-btn-primary"
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  width: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>Start Session</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {selectedDayConcepts.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              No revisions scheduled for this date.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selectedDayConcepts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg)',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {c.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Clock size={11} />
                      {new Date(c.nextReviewDue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="db-modal-btn-cancel"
            style={{ padding: '0.4rem 1.2rem', fontSize: '0.82rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
