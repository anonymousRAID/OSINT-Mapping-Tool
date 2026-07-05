/**
 * App-wide config (e.g. Google Maps API key).
 *
 * Resolution order, highest priority first:
 *   1. localStorage — set via the in-app settings UI. Per-browser, easy to clear.
 *   2. public/app.config.json — user-editable file with the same shape as
 *      app.config.example.json. Useful for power users who want a portable
 *      config across browsers. Gitignored.
 *
 * Nothing is ever sent off-device. API keys never live in project files.
 */

const STORAGE_KEY = 'osint-tool:app-config';
const CONFIG_PATH = `${import.meta.env.BASE_URL ?? '/'}app.config.json`;

function readLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function readConfigFile() {
  try {
    const res = await fetch(CONFIG_PATH, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json && typeof json === 'object' ? json : null;
  } catch {
    return null;
  }
}

function mergeConfigs(...sources) {
  const out = {};
  for (const src of sources) {
    if (!src) continue;
    for (const [section, values] of Object.entries(src)) {
      if (section.startsWith('_')) continue;
      if (values && typeof values === 'object') {
        out[section] = { ...(out[section] ?? {}), ...values };
      }
    }
  }
  return out;
}

export async function loadAppConfig() {
  const [fileConfig, lsConfig] = await Promise.all([
    readConfigFile(),
    Promise.resolve(readLocalStorage()),
  ]);

  // localStorage wins for "active" choices made through the UI, but a
  // file-level key still takes effect if the corresponding LS key is empty.
  const merged = mergeConfigs(fileConfig, lsConfig);

  // googleMaps.apiKey and googleMaps.mapId get special resolution because
  // of the explicit-clear sentinel (see resolveGoogleValue). Overwrite
  // whatever the naive merge produced with the resolved values.
  const apiKey = resolveGoogleValue(lsConfig, fileConfig, 'apiKey');
  const mapId = resolveGoogleValue(lsConfig, fileConfig, 'mapId');
  merged.googleMaps = {
    ...(merged.googleMaps ?? {}),
    apiKey: apiKey.value,
    mapId: mapId.value,
  };

  const sources = {
    googleMapsApiKey: apiKey.source,
    googleMapsMapId: mapId.source,
    mapProvider:
      lsConfig?.map?.provider
        ? 'localStorage'
        : fileConfig?.map?.provider
        ? 'config-file'
        : null,
  };

  return { config: merged, sources };
}

/**
 * Resolve one googleMaps key (apiKey / mapId) across the two layers.
 *
 * - A non-empty localStorage value always wins (set via the in-app UI).
 * - A null localStorage value is the explicit-clear sentinel: "the user
 *   cleared this key in this browser". The sentinel records the file value
 *   it was created against (`<key>ClearedFrom`), and only keeps the key
 *   hidden while the file still holds that same value. If the file later
 *   provides a *different* non-empty value — e.g. Docker's entrypoint just
 *   regenerated app.config.json from .env, or the user hand-edited the
 *   file — that's fresh intent, and the file wins again. Without this, a
 *   stale clear from weeks ago would silently swallow a newly-provisioned
 *   key and the app would inexplicably ask for setup.
 */
function resolveGoogleValue(lsConfig, fileConfig, key) {
  const fileVal = fileConfig?.googleMaps?.[key]?.trim?.() || '';
  const lsSection = lsConfig?.googleMaps;
  if (lsSection && key in lsSection) {
    const lsVal = lsSection[key];
    if (typeof lsVal === 'string' && lsVal.trim()) {
      return { value: lsVal.trim(), source: 'localStorage' };
    }
    const clearedFrom = lsSection[`${key}ClearedFrom`] ?? '';
    if (fileVal && fileVal !== clearedFrom) {
      return { value: fileVal, source: 'config-file' };
    }
    return { value: '', source: 'localStorage' };
  }
  return fileVal
    ? { value: fileVal, source: 'config-file' }
    : { value: '', source: null };
}

export function writeLocalConfig(patch) {
  const current = readLocalStorage() ?? {};
  const next = mergeConfigs(current, patch);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearLocalConfigSection(section) {
  const current = readLocalStorage() ?? {};
  if (current[section]) delete current[section];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

/** Remove a single key (e.g. "mapId") from a section without nuking the whole
 *  section. Used so clearing the LS Map ID doesn't also clear the LS API key. */
export function clearLocalConfigKey(section, key) {
  const current = readLocalStorage() ?? {};
  if (current[section] && key in current[section]) {
    const sectionCopy = { ...current[section] };
    delete sectionCopy[key];
    if (Object.keys(sectionCopy).length === 0) {
      delete current[section];
    } else {
      current[section] = sectionCopy;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  return current;
}

export const APP_CONFIG_PATH_HINT = 'public/app.config.json';
