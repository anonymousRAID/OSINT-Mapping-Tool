import { createContext, useContext, useEffect, useState } from 'react';
import {
  loadAppConfig,
  writeLocalConfig,
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
    // Write a null sentinel rather than deleting the key. If we just
    // deleted, a key in public/app.config.json would immediately refill
    // the slot via the merge, making Clear feel like it didn't save.
    // Null beats the file value in mergeConfigs, so the key actually
    // stays empty. Map ID in localStorage is preserved (only apiKey
    // is touched).
    writeLocalConfig({ googleMaps: { apiKey: null } });
    const result = await loadAppConfig();
    setState({ loaded: true, ...result });
  };

  // Map ID is optional. Passing an empty/whitespace string clears it (same
  // null-sentinel approach as the dedicated Clear handler so an empty save
  // doesn't silently fall back to a file-level Map ID).
  const setGoogleMapsMapId = async (id) => {
    const trimmed = (id ?? '').trim();
    writeLocalConfig({
      googleMaps: { mapId: trimmed ? trimmed : null },
    });
    const result = await loadAppConfig();
    setState({ loaded: true, ...result });
  };

  const clearGoogleMapsMapId = async () => {
    // Same sentinel approach as clearGoogleMapsApiKey — a null in LS
    // beats a value in app.config.json so Clear is actually durable.
    writeLocalConfig({ googleMaps: { mapId: null } });
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
        // Null when the user has never picked a provider (used to gate
        // the first-run welcome screen).
        mapProviderSource: state.sources.mapProvider ?? null,
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
