import { useRef, useState } from 'react';
import { useProject } from '../context/ProjectContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './Landing.css';

export default function Landing() {
  const { newProject, openProjectFromFile } = useProject();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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

        {error && <div className="landing-error">{error}</div>}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChosen}
          style={{ display: 'none' }}
        />
      </div>

      <div className="landing-footer">
        Local-only · Your data stays on this device
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
