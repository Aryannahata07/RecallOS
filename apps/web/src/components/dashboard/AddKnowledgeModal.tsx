import { useState } from 'react';
import { X, Link2, AlignLeft, Loader2, FileText, Video, Code2, MessageSquare } from 'lucide-react';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddKnowledgeModal({ isOpen, onClose }: AddKnowledgeModalProps) {
  const [ingestMode, setIngestMode] = useState<'url' | 'rawText'>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'article' | 'youtube' | 'leetcode' | 'chat'>('article');
  const [rawContent, setRawContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState('');
  const [ingestError, setIngestError] = useState('');

  if (!isOpen) return null;

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngestError(''); setIngestSuccess(''); setIsIngesting(true);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url ? url.trim() : undefined,
          title: title ? title.trim() : undefined,
          type: type || (ingestMode === 'rawText' ? 'chat' : 'article'),
          rawContent: rawContent || title || url,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIngestError(data.error || 'Failed to ingest content');
        setIsIngesting(false);
        return;
      }
      setIngestSuccess('Knowledge source queued! Extracting concepts...');
      setTimeout(() => {
        onClose(); setUrl(''); setTitle(''); setRawContent(''); setIngestSuccess('');
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setIngestError(err.message || 'Something went wrong');
    } finally {
      setIsIngesting(false);
    }
  };

  const typeOptions = [
    { id: 'article', label: 'Article', Icon: FileText },
    { id: 'youtube', label: 'YouTube', Icon: Video },
    { id: 'leetcode', label: 'LeetCode', Icon: Code2 },
    { id: 'chat', label: 'ChatGPT / Notes', Icon: MessageSquare },
  ];

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="db-modal-header">
          <div>
            <h2 className="db-modal-title">Add Knowledge Source</h2>
            <p className="db-modal-sub">Add a URL or copy paste raw text to extract Knowledge Blueprints</p>
          </div>
          <button className="db-modal-close" onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="db-modal-mode-switch">
          <button
            type="button"
            className={`db-modal-mode-btn ${ingestMode === 'url' ? 'active' : ''}`}
            onClick={() => setIngestMode('url')}
          >
            <Link2 size={14} />
            <span>Link / URL</span>
          </button>
          <button
            type="button"
            className={`db-modal-mode-btn ${ingestMode === 'rawText' ? 'active' : ''}`}
            onClick={() => setIngestMode('rawText')}
          >
            <AlignLeft size={14} />
            <span>Raw Text / Copy Paste</span>
          </button>
        </div>

        {ingestSuccess && <div className="auth-alert auth-alert-success">{ingestSuccess}</div>}
        {ingestError && <div className="auth-alert auth-alert-error">{ingestError}</div>}

        <form onSubmit={handleIngestSubmit} className="db-modal-form">
          <div className="auth-field">
            <label className="auth-label">Source Type</label>
            <div className="db-type-selector">
              {typeOptions.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`db-type-btn ${type === id ? 'active' : ''}`}
                  onClick={() => setType(id as any)}
                >
                  <Icon size={13} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {ingestMode === 'url' ? (
            <>
              <div className="auth-field">
                <label className="auth-label">Source URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/article or YouTube URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="auth-input"
                  style={{ paddingLeft: '0.9rem' }}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Source Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. How TCP/IP Handshake Works"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="auth-input"
                  style={{ paddingLeft: '0.9rem' }}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Raw Page Content / Notes (Optional)</label>
                <textarea
                  placeholder="Paste text snippet or article contents if available..."
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className="db-modal-textarea"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="auth-field">
                <label className="auth-label">Raw Text / Notes / Discussion</label>
                <textarea
                  placeholder="Paste article text, notes, transcript, ChatGPT discussion, or code snippets here..."
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className="db-modal-textarea"
                  rows={5}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Title / Subject (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Notes on System Design Patterns (Auto-generated if blank)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="auth-input"
                  style={{ paddingLeft: '0.9rem' }}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Reference URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com (if copied from a website)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="auth-input"
                  style={{ paddingLeft: '0.9rem' }}
                />
              </div>
            </>
          )}

          <div className="db-modal-equal-actions">
            <button type="button" onClick={onClose} className="db-modal-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isIngesting} className="db-modal-btn-primary">
              {isIngesting ? <Loader2 size={14} className="auth-spinner-icon" /> : null}
              {isIngesting ? 'Extracting...' : 'Extract Knowledge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
