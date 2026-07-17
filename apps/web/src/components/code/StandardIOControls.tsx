import { useState } from 'react';
import { Terminal, CheckSquare, AlertTriangle } from 'lucide-react';
import { StandardInputModal } from './StandardInputModal';
import { StandardOutputModal } from './StandardOutputModal';
import { StandardErrorModal, ExecutionErrorMetadata } from './StandardErrorModal';

interface StandardIOControlsProps {
  inputData?: string;
  outputData?: string;
  errorData?: string;
  executionTimeMs?: number;
  executionMemoryKb?: number;
  executionStatus?: string;
  executionStatusCode?: number;
  errorMetadata?: ExecutionErrorMetadata;
  onSaveInput?: (input: string) => void;
}

export function StandardIOControls({
  inputData = '',
  outputData = '',
  errorData = '',
  executionTimeMs = 120,
  executionMemoryKb = 4096,
  executionStatus = 'Success',
  executionStatusCode = 0,
  errorMetadata = {},
  onSaveInput,
}: StandardIOControlsProps) {
  const [showInputModal, setShowInputModal] = useState(false);
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      {/* Standard Input Trigger Icon Button */}
      <button
        type="button"
        onClick={() => setShowInputModal(true)}
        className="db-card-delete-btn"
        style={{ opacity: 1, color: 'var(--accent)' }}
        title="Open Standard Input Modal"
        aria-label="Standard Input"
      >
        <Terminal size={15} />
      </button>

      {/* Standard Output Trigger Icon Button */}
      <button
        type="button"
        onClick={() => setShowOutputModal(true)}
        className="db-card-delete-btn"
        style={{ opacity: 1, color: '#2e7d32' }}
        title="Open Standard Output Modal"
        aria-label="Standard Output"
      >
        <CheckSquare size={15} />
      </button>

      {/* Standard Error Trigger Icon Button */}
      <button
        type="button"
        onClick={() => setShowErrorModal(true)}
        className="db-card-delete-btn"
        style={{ opacity: 1, color: '#d93838' }}
        title="Open Standard Error Modal"
        aria-label="Standard Error"
      >
        <AlertTriangle size={15} />
      </button>

      <StandardInputModal
        isOpen={showInputModal}
        initialInput={inputData}
        onSave={(val) => onSaveInput?.(val)}
        onClose={() => setShowInputModal(false)}
      />

      <StandardOutputModal
        isOpen={showOutputModal}
        output={outputData}
        timeMs={executionTimeMs}
        memoryKb={executionMemoryKb}
        status={executionStatus}
        statusCode={executionStatusCode}
        onClose={() => setShowOutputModal(false)}
      />

      <StandardErrorModal
        isOpen={showErrorModal}
        errorText={errorData}
        metadata={errorMetadata}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
}
