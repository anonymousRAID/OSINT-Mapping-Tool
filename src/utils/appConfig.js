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

async function readConfigFile() {
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

  // A localStorage entry counts as the active source if the key is *present*,
  // even if its value is null (the explicit-clear sentinel). That way Clear
  // actually beats a config-file fallback instead of silently being undone
  // by the file value re-filling the slot on the next load.
  const lsHas = (section, key) =>
    !!(lsConfig && lsConfig[section] && key in lsConfig[section]);

  const sources = {
    googleMapsApiKey:
      lsHas('googleMaps', 'apiKey')
        ? 'localStorage'
        : fileConfig?.googleMaps?.apiKey?.trim?.()
        ? 'config-file'
        : null,
    googleMapsMapId:
      lsHas('googleMaps', 'mapId')
        ? 'localStorage'
        : fileConfig?.googleMaps?.mapId?.trim?.()
        ? 'config-file'
        : null,
    mapProvider:
      lsConfig?.map?.provider
        ? 'localStorage'
        : fileConfig?.map?.provider
        ? 'config-file'
        : null,
  };

  return { config: merged, sources };
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
