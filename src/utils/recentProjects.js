/**
 * Recent-projects store (localStorage).
 *
 * Auto-snapshots the current project on every change so backing out via the
 * top-left arrow doesn't silently lose work. The Landing screen reads this
 * list and lets the user resume any of the last few projects.
 *
 * Shape:
 *   [
 *     {
 *       id: string,            // project.id — used for dedupe
 *       name: string,
 *       snapshot: object,      // full project state, serialisable
 *       snapshotAt: ISO,       // when this snapshot was written
 *       lastSavedAt: ISO|null  // when the user last clicked Save (or opened from file)
 *     },
 *     …
 *   ]
 *
 * Capped at MAX_RECENTS. Oldest dropped first. If localStorage fills up
 * (e.g. very large projects with embedded custom icons), we drop more
 * entries until the write succeeds.
 */

const STORAGE_KEY = 'osint-tool:recent-projects';
const MAX_RECENTS = 5;

export function loadRecents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r) => r && r.snapshot) : [];
  } catch {
    return [];
  }
}

function writeRecents(list) {
  // Cap, then try to write; if quota fails, drop entries until it fits.
  let capped = list.slice(0, MAX_RECENTS);
  while (capped.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
      return capped;
    } catch {
      capped = capped.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return [];
}

/**
 * Upsert a project snapshot. Carries over the previous `lastSavedAt` if not
 * specified explicitly so a pure auto-snapshot doesn't clear the saved-marker.
 */
export function saveRecent(snapshot, { lastSavedAt } = {}) {
  if (!snapshot || !snapshot.id) return loadRecents();
  const recents = loadRecents();
  const idx = recents.findIndex((r) => r.id === snapshot.id);
  const previous = idx >= 0 ? recents[idx] : null;
  const entry = {
    id: snapshot.id,
    name: snapshot.name ?? 'Untitled Project',
    snapshot,
    snapshotAt: new Date().toISOString(),
    lastSavedAt:
      lastSavedAt !== undefined ? lastSavedAt : previous?.lastSavedAt ?? null,
  };
  const rest =
    idx >= 0
      ? [...recents.slice(0, idx), ...recents.slice(idx + 1)]
      : recents;
  return writeRecents([entry, ...rest]);
}

/** Update only the lastSavedAt timestamp (called after Save / Open). */
export function markRecentSaved(projectId, savedAt = new Date().toISOString()) {
  if (!projectId) return loadRecents();
  const recents = loadRecents();
  const idx = recents.findIndex((r) => r.id === projectId);
  if (idx < 0) return recents;
  const next = [...recents];
  next[idx] = { ...next[idx], lastSavedAt: savedAt };
  return writeRecents(next);
}

export function removeRecent(projectId) {
  const next = loadRecents().filter((r) => r.id !== projectId);
  return writeRecents(next);
}

export function hasUnsavedChanges(entry) {
  if (!entry) return false;
  if (!entry.lastSavedAt) return true;
  // Compare against the project's own updatedAt (which only advances on real
  // edits) rather than snapshotAt (which advances on every auto-snapshot,
  // even when nothing changed — those would erroneously read as "unsaved").
  const projectUpdated =
    entry.snapshot?.updatedAt ?? entry.snapshotAt ?? null;
  if (!projectUpdated) return false;
  return new Date(projectUpdated).getTime() >
    new Date(entry.lastSavedAt).getTime();
}
