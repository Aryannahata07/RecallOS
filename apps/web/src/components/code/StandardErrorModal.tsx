import { X, AlertCircle } from 'lucide-react';

export interface ExecutionErrorMetadata {
  error?: string;
  code?: string | number;
  message?: string;
  stackTrace?: string;
  lineNumber?: number;
  columnNumber?: number;
  fileName?: string;
  functionName?: string;
  className?: string;
  moduleName?: string;
  packageName?: string;
  vendorName?: string;
  version?: string;
  architecture?: string;
  platform?: string;
  os?: string;
  osVersion?: string;
  osRelease?: string;
  osType?: string;
  osHostname?: string;
  osUser?: string;
  osHome?: string;
  osTmp?: string;
  osDev?: string;
  osProc?: string;
  osSys?: string;
  osLib?: string;
  osUsr?: string;
  osBin?: string;
  osSbin?: string;
  osEtc?: string;
  osVar?: string;
  osOpt?: string;
  osMnt?: string;
  osMedia?: string;
  osSrv?: string;
  osRun?: string;
  osBoot?: string;
  osRoot?: string;
  osHomeUser?: string;
  osTmpUser?: string;
  osDevUser?: string;
  osProcUser?: string;
  osSysUser?: string;
  osLibUser?: string;
  osUsrUser?: string;
  osBinUser?: string;
  osSbinUser?: string;
  osEtcUser?: string;
  osVarUser?: string;
  osOptUser?: string;
  osMntUser?: string;
  osMediaUser?: string;
  osSrvUser?: string;
  osRunUser?: string;
  osBootUser?: string;
  osRootUser?: string;
}

interface StandardErrorModalProps {
  isOpen: boolean;
  errorText?: string;
  metadata?: ExecutionErrorMetadata;
  onClose: () => void;
}

export function StandardErrorModal({
  isOpen,
  errorText = '',
  metadata = {},
  onClose,
}: StandardErrorModalProps) {
  if (!isOpen) return null;

  const entries = Object.entries(metadata).filter(([_, v]) => v !== undefined && v !== '');

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div
        className="db-modal-card"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="db-modal-header" style={{ marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <AlertCircle size={18} style={{ color: '#d93838' }} />
            <h2 className="db-modal-title" style={{ fontSize: '1.1rem' }}>
              Standard Error (stderr)
            </h2>
          </div>
          <button className="db-modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <p className="db-modal-sub" style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}>
          Execution error details and runtime diagnostics.
        </p>

        {entries.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem 0.8rem',
              marginBottom: '0.8rem',
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '0.5rem',
              background: 'rgba(217, 56, 56, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(217, 56, 56, 0.15)',
            }}
          >
            {entries.map(([k, v]) => (
              <span key={k} className="io-meta-red">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}

        <textarea
          value={errorText || metadata.message || metadata.error || 'No stderr stream available.'}
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
            color: '#d93838',
          }}
        />

        <div className="db-modal-equal-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="db-modal-btn-primary"
            style={{ width: 'auto', padding: '0.45rem 1.2rem', background: '#d93838', borderColor: '#d93838' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
