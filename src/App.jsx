import { useProject } from './context/ProjectContext.jsx';
import { useAppConfig } from './context/AppConfigContext.jsx';
import Landing from './components/Landing.jsx';
import ProjectView from './components/ProjectView.jsx';
import Welcome from './components/Welcome.jsx';

export default function App() {
  const { project } = useProject();
  const { loaded, mapProviderSource, googleMapsApiKeySource } = useAppConfig();

  // Wait until the config layer has tried to read localStorage + the config
  // file. Showing nothing for one frame beats flashing the welcome screen
  // to an existing user.
  if (!loaded) return null;

  // First-run detection: the user has never explicitly picked a map provider
  // AND no Google Maps API key is already configured (so upgrading users who
  // had a key from a previous version skip straight past the welcome).
  const isFirstRun =
    mapProviderSource === null && googleMapsApiKeySource === null;
  if (isFirstRun) return <Welcome />;

  return project ? <ProjectView /> : <Landing />;
}
