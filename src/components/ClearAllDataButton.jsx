import { useState } from 'react';
import { clearAllSavedData, CLEAR_ALL_SUMMARY } from '../utils/clearAllData.js';
import './ClearAllDataButton.css';

/**
 * Destructive "wipe everything in localStorage" action. Owns its own
 * confirm modal because the action is irreversible and the native
 * `confirm()` dialog can't show a formatted bullet list of what gets
 * removed. After the wipe we reload so all React state restarts cleanly
 * from the now-empty config (which kicks the user back to the welcome
 * screen, just like a true fresh install).
 *
 * Renders compactly so it slots into either the Map settings overlay or
 * the Landing footer.
 */
export default function ClearAllDataButton({ variant = 'block' }) {
  const [confirming, setConfirming] = useState(false);
  // Default off — clearing the API key is a more committed action than
  // wiping settings/recents (it forces re-setup or a switch to OSM), so
  // the user has to opt into it explicitly.
  const [alsoClearApiKey, setAlsoClearApiKey] = useState(false);

  const handleConfirm = () => {
    clearAllSavedData({ overrideFileGoogleConfig: alsoClearApiKey });
    // Hard reload so AppConfig / Theme / Project context all re-init from
    // an empty localStorage. React state-only resets won't cut it because
    // the welcome-screen gate is checked at mount.
    window.location.reload();
  };

  return (
    <>
      <div className={`clear-all ${variant}`}>
        {variant === 'block' && (
          <div className="clear-all-label">Reset this browser</div>
        )}
        <button
          type="button"
          className={
            variant === 'inline'
              ? 'clear-all-link'
              : 'btn btn-danger clear-all-btn'
          }
          onClick={() => setConfirming(true)}
        >
          Clear all saved data
        </button>
        {variant === 'block' && (
          <p className="clear-all-hint">
            Wipes settings, custom icons, and the Continue-recent list from
            this browser. Saved project files on disk are untouched.
          </p>
        )}
      </div>

      {confirming && (
        <div
          className="modal-backdrop"
          onClick={() => setConfirming(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Clear all saved data?</h2>
            <p className="modal-sub">
              This wipes everything this browser is holding for the app:
            </p>
            <ul className="clear-all-list">
              {CLEAR_ALL_SUMMARY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <label className="clear-all-checkbox">
              <input
                type="checkbox"
                checked={alsoClearApiKey}
                onChange={(e) => setAlsoClearApiKey(e.target.checked)}
              />
              <span>
                <strong>Also clear the Google Maps API key</strong>
                <span className="clear-all-checkbox-hint">
                  Hides any key that lives in{' '}
                  <code>public/app.config.json</code>. Leaves the file itself
                  alone — to delete it for good, remove the file by hand.
                </span>
              </span>
            </label>

            <p className="modal-sub">
              Project files you've saved to disk (<code>*.osint.json</code>)
              are not touched.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirm}
              >
                Yes, clear everything
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
