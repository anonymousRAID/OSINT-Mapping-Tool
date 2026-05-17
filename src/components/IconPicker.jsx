import { useEffect, useRef, useState } from 'react';
import { BUILT_IN_ICONS, getBuiltInSrc } from '../identifierIcons.js';
import { useCustomIcons } from '../context/CustomIconsContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { MAX_ICON_BYTES } from '../utils/customIcons.js';
import { getTypeDef } from '../identifierTypes.js';
import IdentifierBadge from './IdentifierBadge.jsx';
import './IconPicker.css';

/**
 * Modal for picking an icon for an identifier. Stacks on top of the
 * IdentifierModal that opened it.
 *
 * Sections:
 *   - Type default (clears customIconId)
 *   - Built-in: branded icons that ship with the app
 *   - Your icons: user-uploaded icons, persisted in localStorage
 *   - Upload tile: opens the OS file picker
 *
 * onSelect(id | null) — null means "use the type default".
 */
export default function IconPicker({ typeKey, currentIconId, onSelect, onClose }) {
  const { icons: customIcons, addIcon, removeIcon } = useCustomIcons();
  const { theme } = useTheme();
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleUploadClick = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, SVG, …).');
      return;
    }
    if (file.size > MAX_ICON_BYTES) {
      setError(
        `Icon is too large (${Math.round(file.size / 1024)}KB). Max is ${Math.round(MAX_ICON_BYTES / 1024)}KB.`,
      );
      return;
    }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      // Keep the extension so we can preserve it in the display truncation.
      // Cap at 60 chars to keep localStorage payloads sane.
      const niceName = file.name.slice(0, 60);
      const id = addIcon(niceName, dataUrl);
      onSelect(id);
    } catch (err) {
      setError(`Could not read file: ${err.message ?? err}`);
    }
  };

  // Middle-ellipsis truncation that preserves the file extension when present.
  //   "this-is-an-example-long-image-name.png" → "this-is....png"
  // Used for display only; the full name stays in the title attribute for hover.
  const truncateFilename = (name, maxLen = 14) => {
    if (!name || name.length <= maxLen) return name;
    const dotIdx = name.lastIndexOf('.');
    const hasShortExt =
      dotIdx > 0 && dotIdx >= name.length - 8 && dotIdx < name.length - 1;
    if (hasShortExt) {
      const ext = name.slice(dotIdx);
      const baseChars = Math.max(3, maxLen - 3 - ext.length);
      return name.slice(0, baseChars) + '...' + ext;
    }
    const half = Math.max(2, Math.floor((maxLen - 3) / 2));
    return name.slice(0, half) + '...' + name.slice(-half);
  };

  const builtInEntries = Object.entries(BUILT_IN_ICONS);
  const customEntries = Object.entries(customIcons);

  return (
    <div className="modal-backdrop icon-picker-backdrop" onMouseDown={onClose}>
      <div className="modal icon-picker" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Choose icon</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="icon-picker-section">
          <h4>Default</h4>
          <button
            type="button"
            className={`icon-tile icon-tile-default ${!currentIconId ? 'selected' : ''}`}
            onClick={() => onSelect(null)}
            title="Use the built-in default for this type"
          >
            <IdentifierBadge
              typeKey={typeKey}
              customIconId={null}
              size="lg"
            />
            <span className="icon-tile-text">
              {getTypeDef(typeKey).label} default
            </span>
          </button>
        </div>

        <div className="icon-picker-section">
          <h4>Built-in</h4>
          <div className="icon-grid">
            {builtInEntries.map(([id, icon]) => (
              <button
                key={id}
                type="button"
                className={`icon-tile ${currentIconId === id ? 'selected' : ''}`}
                onClick={() => onSelect(id)}
                title={icon.name}
              >
                <img
                  src={getBuiltInSrc(id, theme)}
                  alt={icon.name}
                  draggable={false}
                />
                <span className="icon-tile-text">{icon.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="icon-picker-section">
          <h4>Your icons</h4>
          {customEntries.length === 0 && (
            <p className="icon-picker-hint">
              Upload PNG, JPG, or SVG files to reuse them across identifiers.
              Stored in this browser only.
            </p>
          )}
          <div className="icon-grid">
            {customEntries.map(([id, icon]) => (
              <div key={id} className="icon-tile-wrap">
                <button
                  type="button"
                  className={`icon-tile ${currentIconId === id ? 'selected' : ''}`}
                  onClick={() => onSelect(id)}
                  title={icon.name}
                >
                  <img
                    src={icon.dataUrl}
                    alt={icon.name}
                    draggable={false}
                  />
                  <span className="icon-tile-text">
                    {truncateFilename(icon.name)}
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-tile-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        `Remove "${icon.name}" from your icons? Identifiers still using it will fall back to the default.`,
                      )
                    ) {
                      removeIcon(id);
                      if (currentIconId === id) onSelect(null);
                    }
                  }}
                  aria-label={`Remove ${icon.name}`}
                  title="Remove from library"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="icon-tile icon-tile-upload"
              onClick={handleUploadClick}
              title="Upload a custom icon"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              <span className="icon-tile-text">Upload</span>
            </button>
          </div>
          {error && <div className="icon-picker-error">{error}</div>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChosen}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
