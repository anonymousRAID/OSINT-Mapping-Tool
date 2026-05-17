import { useProject } from '../context/ProjectContext.jsx';
import { NavigationProvider, useNavigation } from '../context/NavigationContext.jsx';
import { NodeHistoryProvider } from '../context/NodeHistoryContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import InfoTab from './InfoTab.jsx';
import MapTab from './MapTab.jsx';
import './ProjectView.css';

export default function ProjectView() {
  return (
    <NavigationProvider>
      <NodeHistoryProvider>
        <ProjectViewInner />
      </NodeHistoryProvider>
    </NavigationProvider>
  );
}

function ProjectViewInner() {
  const { project, saveProject, closeProject } = useProject();
  const { tab, setTab } = useNavigation();

  return (
    <div className="project-view">
      <header className="project-topbar">
        <div className="topbar-left">
          <button
            className="icon-btn"
            onClick={closeProject}
            title="Back to projects"
            aria-label="Back to projects"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="project-title">
            <div className="project-name">{project.name}</div>
            {project.target?.name && (
              <div className="project-target">Target: {project.target.name}</div>
            )}
          </div>
        </div>

        <nav className="tab-switcher" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'info'}
            className={`tab-button ${tab === 'info' ? 'active' : ''}`}
            onClick={() => setTab('info')}
          >
            Information
          </button>
          <button
            role="tab"
            aria-selected={tab === 'map'}
            className={`tab-button ${tab === 'map' ? 'active' : ''}`}
            onClick={() => setTab('map')}
          >
            Map
          </button>
        </nav>

        <div className="topbar-right">
          <button className="btn btn-secondary" onClick={saveProject}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            Save
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="project-main">
        {tab === 'info' ? <InfoTab /> : <MapTab />}
      </main>
    </div>
  );
}
