/**
 * Custom icon library stored in localStorage. Browser-scoped so the user can
 * reuse uploaded icons across all of their projects.
 *
 * Shape:
 *   { [iconId]: { name: string, dataUrl: string } }
 *
 * iconIds are namespaced with the "custom-" prefix so they never collide with
 * the built-in icon keys (instagram, snapchat, …) used in BUILT_IN_ICONS.
 */
const STORAGE_KEY = 'osint-tool:custom-icons';

export const MAX_ICON_BYTES = 300 * 1024; // 300KB cap to keep localStorage healthy

export function loadCustomIcons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function persistCustomIcons(icons) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    return true;
  } catch {
    // Likely QuotaExceededError. Caller should surface a friendly message.
    return false;
  }
}

export function newCustomIconId() {
  return `custom-${crypto.randomUUID()}`;
}
