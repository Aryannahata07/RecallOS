import { useState } from 'react';
import { X, Save, Terminal } from 'lucide-react';

interface StandardInputModalProps {
  isOpen: boolean;
  initialInput?: string;
  onSave: (input: string) => void;
  onClose: () => void;
}

export function StandardInputModal({
  isOpen,
  initialInput = '',
  onSave,
  onClose,
}: StandardInputModalProps) {
  const [value, setValue] = useState(initialInput);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div
        className="db-modal-card"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="db-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Terminal size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="db-modal-title" style={{ fontSize: '1.1rem' }}>
              Standard Input (stdin)
            </h2>
          </div>
          <button className="db-modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <p className="db-modal-sub" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Provide raw standard input data to pass to your code execution process.
        </p>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter standard input here..."
          rows={8}
          className="auth-input"
          style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            resize: 'vertical',
            width: '100%',
            marginBottom: '1.25rem',
          }}
        />

        <div className="db-modal-equal-actions">
          <button
            type="button"
            onClick={onClose}
            className="db-modal-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="db-modal-btn-primary"
          >
            <Save size={14} />
            Save Input
          </button>
        </div>
      </div>
    </div>
  );
}
