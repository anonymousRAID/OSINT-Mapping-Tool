import { readConfigFile } from './appConfig.js';

/**
 * Wipes every piece of app state that the browser is holding for this
 * origin: API key + Map ID + map provider, uploaded custom icons, the
 * "Continue recent" snapshots, and the theme preference.
 *
 * Does NOT touch:
 *   - public/app.config.json (file on disk; this code runs in the browser)
 *   - *.osint.json project files the user has saved to disk
 *
 * Implemented as a prefix scan so a future osint-tool:* key gets wiped
 * automatically without anyone having to remember to update this list.
 *
 * @param {object} [options]
 * @param {boolean} [options.overrideFileGoogleConfig=false] — when true, after
 *   the wipe, write a null sentinel for `googleMaps.apiKey` and
 *   `googleMaps.mapId` so a value sitting in public/app.config.json doesn't
 *   silently refill the slot on the next load. The sentinel records the file
 *   values it cleared against, so a *different* file key provided later
 *   (e.g. Docker regenerating app.config.json from .env) takes effect again.
 */
export async function clearAllSavedData({ overrideFileGoogleConfig = false } = {}) {
  const removed = [];
  // Snapshot keys first — iterating localStorage while mutating it is fragile.
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('osint-tool:')) keys.push(k);
  }
  for (const k of keys) {
    localStorage.removeItem(k);
    removed.push(k);
  }

  if (overrideFileGoogleConfig) {
    // Write the sentinel directly rather than going through writeLocalConfig
    // to avoid pulling that helper into the utility tree. The shape mirrors
    // what AppConfigContext.clearGoogleMapsApiKey writes.
    const file = await readConfigFile();
    localStorage.setItem(
      'osint-tool:app-config',
      JSON.stringify({
        googleMaps: {
          apiKey: null,
          apiKeyClearedFrom: file?.googleMaps?.apiKey?.trim?.() || '',
          mapId: null,
          mapIdClearedFrom: file?.googleMaps?.mapId?.trim?.() || '',
        },
      }),
    );
  }
  return removed;
}

/** Human-readable list of what gets wiped — used in confirm dialogs. */
export const CLEAR_ALL_SUMMARY = [
  'Google Maps Map ID and map provider choice',
  'Custom identifier icons you uploaded',
  'Continue-recent project snapshots',
  'Light/dark theme preference',
];
