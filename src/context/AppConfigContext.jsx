import { createContext, useContext, useEffect, useState } from 'react';
import {
  loadAppConfig,
  writeLocalConfig,
  clearLocalConfigSection,
  clearLocalConfigKey,
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
    // Clear just the API key, not the whole googleMaps section, so a saved
    // Map ID in localStorage survives an API-key reset.
    clearLocalConfigKey('googleMaps', 'apiKey');
    const result = await loadAppConfig();
    setState({ loaded: true, ...result });
  };

  // Map ID is optional. Passing an empty/whitespace string clears it from
  // localStorage and lets the config-file value (or no value) take over.
  const setGoogleMapsMapId = async (id) => {
    const trimmed = (id ?? '').trim();
    if (trimmed) {
      writeLocalConfig({ googleMaps: { mapId: trimmed } });
    } else {
      clearLocalConfigKey('googleMaps', 'mapId');
    }
    const result = await loadAppConfig();
    setState({ loaded: true, ...result });
  };

  const clearGoogleMapsMapId = async () => {
    clearLocalConfigKey('googleMaps', 'mapId');
    const result = await loadAppConfig();
    setState({ loaded: true, ...result });
  };

  // Map provider — 'google' (default) or 'osm' for OpenStreetMap via Leaflet.
  // Stored in localStorage as map.provider; falls back to config file then 'google'.
  const setMapProvider = async (provider) => {
    const v = provider === 'osm' ? 'osm' : 'google';
    writeLocalConfig({ map: { provider: v } });
    const result = await loadAppConfig();
    setState({ loaded: true, ...result });
  };

  const googleMapsApiKey = state.config?.googleMaps?.apiKey ?? '';
  const googleMapsMapId =
    state.config?.googleMaps?.mapId?.trim?.() || null;
  const mapProvider =
    state.config?.map?.provider === 'osm' ? 'osm' : 'google';

  return (
    <AppConfigContext.Provider
      value={{
        loaded: state.loaded,
        googleMapsApiKey,
        googleMapsApiKeySource: state.sources.googleMapsApiKey ?? null,
        googleMapsMapId,
        googleMapsMapIdSource: state.sources.googleMapsMapId ?? null,
        mapProvider,
        setMapProvider,
        setGoogleMapsApiKey,
        clearGoogleMapsApiKey,
        setGoogleMapsMapId,
        clearGoogleMapsMapId,
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
