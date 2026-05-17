import { createContext, useContext, useEffect, useState } from 'react';
import {
  loadAppConfig,
  writeLocalConfig,
  clearLocalConfigSection,
} from '../utils/appConfig.js';

const AppConfigContext = createContext(null);

export function AppConfigProvider({ children }) {
  const [state, setState] = useState({
    loaded: false,
    config: {},
    sources: {},
  });

  useEffect(() => {
    let cancelled = false;
    loadAppConfig().then((result) => {
      if (cancelled) return;
      setState({ loaded: true, ...result });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setGoogleMapsApiKey = (key) => {
    const trimmed = (key ?? '').trim();
    if (!trimmed) return;
    writeLocalConfig({ googleMaps: { apiKey: trimmed } });
    setState((s) => ({
      loaded: true,
      config: {
        ...s.config,
        googleMaps: { ...(s.config.googleMaps ?? {}), apiKey: trimmed },
      },
      sources: { ...s.sources, googleMapsApiKey: 'localStorage' },
    }));
  };

  const clearGoogleMapsApiKey = async () => {
    clearLocalConfigSection('googleMaps');
    const result = await loadAppConfig();
    setState({ loaded: true, ...result });
  };

  const googleMapsApiKey = state.config?.googleMaps?.apiKey ?? '';
  const googleMapsMapId =
    state.config?.googleMaps?.mapId?.trim?.() || null;

  return (
    <AppConfigContext.Provider
      value={{
        loaded: state.loaded,
        googleMapsApiKey,
        googleMapsApiKeySource: state.sources.googleMapsApiKey ?? null,
        googleMapsMapId,
        setGoogleMapsApiKey,
        clearGoogleMapsApiKey,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx)
    throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
}
