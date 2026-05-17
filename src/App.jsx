import { useProject } from './context/ProjectContext.jsx';
import Landing from './components/Landing.jsx';
import ProjectView from './components/ProjectView.jsx';

export default function App() {
  const { project } = useProject();
  return project ? <ProjectView /> : <Landing />;
}
