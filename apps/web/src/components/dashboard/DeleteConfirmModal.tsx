import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  message,
  isDeleting = false,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="db-modal-header" style={{ marginBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(217, 56, 56, 0.12)', color: '#d93838',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <AlertTriangle size={18} />
            </div>
            <h2 className="db-modal-title" style={{ fontSize: '1.1rem' }}>{title}</h2>
          </div>
          <button className="db-modal-close" onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        <p className="db-modal-sub" style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
          {message}
        </p>

        <div className="db-modal-equal-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="db-modal-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="db-modal-btn-primary"
            style={{ background: '#d93838', color: '#ffffff', borderColor: '#d93838' }}
          >
            {isDeleting ? <Loader2 size={14} className="auth-spinner-icon" /> : null}
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
