import { useProject } from './context/ProjectContext.jsx';
import { useAppConfig } from './context/AppConfigContext.jsx';
import Landing from './components/Landing.jsx';
import ProjectView from './components/ProjectView.jsx';
import Welcome from './components/Welcome.jsx';

export default function App() {
  const { project } = useProject();
  const { loaded, mapProviderSource, googleMapsApiKey } = useAppConfig();

  // Wait until the config layer has tried to read localStorage + the config
  // file. Showing nothing for one frame beats flashing the welcome screen
  // to an existing user.
  if (!loaded) return null;

  // First-run detection: the user has never explicitly picked a map provider
  // AND no usable Google Maps API key exists. Checking the resolved key
  // value (rather than the source) means a Clear-All-Data wipe that wrote
  // a null sentinel — same as having no key at all — also lands them on
  // the welcome screen, like a true fresh install. Upgrading users who
  // already had a key from a previous version still skip past it.
  const isFirstRun = mapProviderSource === null && !googleMapsApiKey;
  if (isFirstRun) return <Welcome />;

  return project ? <ProjectView /> : <Landing />;
}
