import { useEffect, useRef, useState } from 'react';
import { useProject } from '../context/ProjectContext.jsx';
import {
  loadRecents,
  removeRecent,
  hasUnsavedChanges,
} from '../utils/recentProjects.js';
import ThemeToggle from './ThemeToggle.jsx';
import ClearAllDataButton from './ClearAllDataButton.jsx';
import './Landing.css';

function relativeTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Landing() {
  const { newProject, openProjectFromFile, openProjectFromSnapshot } =
    useProject();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [error, setError] = useState('');
  const [recents, setRecents] = useState(() => loadRecents());
  const fileInputRef = useRef(null);

  // Re-read on mount so a fresh back-out shows up immediately.
  useEffect(() => {
    setRecents(loadRecents());
  }, []);

  const handleResume = (entry) => {
    openProjectFromSnapshot(entry.snapshot);
  };

  const handleRemoveRecent = (e, id) => {
    e.stopPropagation();
    setRecents(removeRecent(id));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    newProject({ name, targetName });
  };

  const handleOpenClick = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await openProjectFromFile(file);
    } catch (err) {
      setError(`Could not open project: ${err.message}`);
    }
  };

  return (
    <div className="landing">
      <div className="landing-topbar">
        <ThemeToggle />
      </div>

      <div className="landing-content">
        <div className="landing-brand">
          <div className="landing-logo">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h1 className="landing-title">OSINT Mapping Tool</h1>
          <p className="landing-tagline">
            Organize identifiers, build connections, and pin locations for any target.
          </p>
        </div>

        <div className="landing-actions">
          <button className="btn btn-primary landing-cta" onClick={() => setShowNew(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New Project
          </button>
          <button className="btn btn-secondary landing-cta" onClick={handleOpenClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Open Project
          </button>
        </div>

        {recents.length > 0 && (
          <div className="landing-recents">
            <div className="landing-recents-header">Continue recent</div>
            <ul className="landing-recents-list">
              {recents.map((r) => {
                const unsaved = hasUnsavedChanges(r);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="landing-recent-item"
                      onClick={() => handleResume(r)}
                      title={`Resume ${r.name}`}
                    >
                      <div className="landing-recent-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                      </div>
                      <div className="landing-recent-body">
                        <div className="landing-recent-name">{r.name}</div>
                        <div className="landing-recent-meta">
                          Edited {relativeTime(r.snapshotAt)}
                          {unsaved && (
                            <span className="landing-recent-unsaved">
                              · unsaved
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className="landing-recent-remove"
                        role="button"
                        tabIndex={0}
                        aria-label={`Remove ${r.name} from recents`}
                        title="Remove from recents"
                        onClick={(e) => handleRemoveRecent(e, r.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleRemoveRecent(e, r.id);
                          }
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <div className="landing-error">{error}</div>}

        {/* Visually hidden but still in layout — `display: none` works in
            Chrome but Firefox silently refuses to open the native file
            picker for an input that isn't rendered. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChosen}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        />
      </div>

      <div className="landing-footer">
        Local-only · Your data stays on this device ·{' '}
        <ClearAllDataButton variant="inline" />
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2>New Project</h2>
            <p className="modal-sub">Set up a workspace for a new research target.</p>

            <div className="field">
              <label htmlFor="project-name">Project name</label>
              <input
                id="project-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Case 0042"
              />
            </div>

            <div className="field">
              <label htmlFor="target-name">Target name <span style={{ textTransform: 'none', opacity: 0.6 }}>(optional)</span></label>
              <input
                id="target-name"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>

            {error && <div className="landing-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
