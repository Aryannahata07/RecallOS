import { X, Terminal } from 'lucide-react';

interface StandardOutputModalProps {
  isOpen: boolean;
  output?: string;
  timeMs?: number;
  memoryKb?: number;
  status?: string;
  statusCode?: number;
  onClose: () => void;
}

export function StandardOutputModal({
  isOpen,
  output = '',
  timeMs = 0,
  memoryKb = 0,
  status = 'Success',
  statusCode = 0,
  onClose,
}: StandardOutputModalProps) {
  if (!isOpen) return null;

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div
        className="db-modal-card"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="db-modal-header" style={{ marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Terminal size={18} style={{ color: '#2e7d32' }} />
            <h2 className="db-modal-title" style={{ fontSize: '1.1rem' }}>
              Standard Output (stdout)
            </h2>
            <span className="io-meta-green">Time: {timeMs}ms</span>
            <span className="io-meta-green">Memory: {memoryKb}KB</span>
            <span className="io-meta-green">Status: {status}</span>
            <span className="io-meta-green">Code: {statusCode}</span>
          </div>
          <button className="db-modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <p className="db-modal-sub" style={{ fontSize: '0.85rem', marginBottom: '0.8rem' }}>
          Execution output captured from stdout stream.
        </p>

        <textarea
          value={output}
          readOnly
          disabled
          rows={10}
          className="auth-input"
          style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            resize: 'vertical',
            width: '100%',
            marginBottom: '1.25rem',
            opacity: 0.9,
            cursor: 'not-allowed',
            backgroundColor: 'var(--surface2)',
          }}
        />

        <div className="db-modal-equal-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="db-modal-btn-primary"
            style={{ width: 'auto', padding: '0.45rem 1.2rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
