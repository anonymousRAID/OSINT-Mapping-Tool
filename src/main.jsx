import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ProjectProvider } from './context/ProjectContext.jsx';
import { AppConfigProvider } from './context/AppConfigContext.jsx';
import { CustomIconsProvider } from './context/CustomIconsContext.jsx';
import './styles/themes.css';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppConfigProvider>
      <CustomIconsProvider>
        <ThemeProvider>
          <ProjectProvider>
            <App />
          </ProjectProvider>
        </ThemeProvider>
      </CustomIconsProvider>
    </AppConfigProvider>
  </StrictMode>,
);
