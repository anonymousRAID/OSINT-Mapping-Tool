import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PIN_COLORS,
  DEFAULT_PIN_COLOR,
  getPinColor,
  isPresetColor,
} from '../pinColors.js';
import { BUILT_IN_MAP_ICONS, getMapIconSrc } from '../mapIcons.js';
import { useProject } from '../context/ProjectContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  CATEGORIES,
  getDisplayLabel as getIdentifierDisplayLabel,
  getTypeDef,
} from '../identifierTypes.js';
import IdentifierBadge from './IdentifierBadge.jsx';
import LinkPicker from './LinkPicker.jsx';
import './PinModal.css';

const EMPTY = {
  label: '',
  address: '',
  visitedAt: '',
  withWho: '',
  notes: '',
  color: DEFAULT_PIN_COLOR,
  iconId: null,
};

export default function PinModal({ pin, onClose, onSave, onDelete }) {
  const { project, addPinLink, removePinLinkByPair, setPinLinkContext } =
    useProject();
  const { theme } = useTheme();
  const identifiers = project?.identifiers ?? [];
  const pinLinks = project?.pinLinks ?? [];

  const [draft, setDraft] = useState({ ...EMPTY, ...pin });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedChip, setExpandedChip] = useState(null);
  const pinColorInputRef = useRef(null);

  // Currently-linked identifier IDs → context (from project state).
  const currentLinkMap = useMemo(() => {
    const m = new Map();
    for (const l of pinLinks.filter((l) => l.pinId === pin?.id)) {
      m.set(l.identifierId, l.context ?? '');
    }
    return m;
  }, [pinLinks, pin?.id]);

  // Staged: Map<identifierId, context>. Committed on Save.
  const [staged, setStaged] = useState(() => new Map(currentLinkMap));

  useEffect(() => {
    setDraft({ ...EMPTY, ...pin });
    setStaged(new Map(currentLinkMap));
    setExpandedChip(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const change = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Diff staged vs currently-linked → commit link changes.
    if (pin?.id) {
      for (const [idtId, ctx] of staged) {
        if (!currentLinkMap.has(idtId)) {
          addPinLink(pin.id, idtId, ctx);
        } else if ((currentLinkMap.get(idtId) ?? '') !== (ctx ?? '')) {
          setPinLinkContext(pin.id, idtId, ctx);
        }
      }
      for (const idtId of currentLinkMap.keys()) {
        if (!staged.has(idtId)) removePinLinkByPair(pin.id, idtId);
      }
    }
    onSave({
      label: draft.label.trim(),
      address: draft.address.trim(),
      visitedAt: draft.visitedAt,
      withWho: draft.withWho.trim(),
      notes: draft.notes.trim(),
      color: draft.color ?? DEFAULT_PIN_COLOR,
      iconId: draft.iconId ?? null,
    });
  };

  const toggleStaged = (idtId) => {
    setStaged((s) => {
      const next = new Map(s);
      if (next.has(idtId)) next.delete(idtId);
      else next.set(idtId, '');
      return next;
    });
    setExpandedChip(null);
  };

  const setStagedContext = (idtId, ctx) => {
    setStaged((s) => {
      if (!s.has(idtId)) return s;
      const next = new Map(s);
      next.set(idtId, ctx);
      return next;
    });
  };

  const stagedIdentifiers = useMemo(
    () =>
      Array.from(staged.keys())
        .map((id) => identifiers.find((i) => i.id === id))
        .filter(Boolean),
    [staged, identifiers],
  );

  const stagedIdSet = useMemo(() => new Set(staged.keys()), [staged]);

  const pickerItems = useMemo(
    () =>
      identifiers.map((i) => {
        const def = getTypeDef(i.type);
        return {
          id: i.id,
          badge: (
            <IdentifierBadge
              typeKey={i.type}
              customIconId={i.customIconId}
              size="sm"
            />
          ),
          label: getIdentifierDisplayLabel(i),
          secondary: def.label,
          group: CATEGORIES[def.category]?.label ?? 'Other',
        };
      }),
    [identifiers],
  );

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal pin-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header">
          <h2>{pin?.id ? 'Edit pin' : 'New pin'}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="pin-coords">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {draft.lat?.toFixed?.(6) ?? '—'}, {draft.lng?.toFixed?.(6) ?? '—'}
        </div>

        <div className="field">
          <label>Color</label>
          <div className="color-picker">
            {Object.entries(PIN_COLORS).map(([key, c]) => {
              const isSelected = (draft.color ?? DEFAULT_PIN_COLOR) === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`color-swatch ${isSelected ? 'selected' : ''}`}
                  style={{ background: c.bg, borderColor: c.border }}
                  onClick={() => change('color', key)}
                  aria-label={c.name}
                  title={c.name}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.glyph} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
            {(() => {
              const isCustom = !isPresetColor(draft.color) && !!draft.color;
              const resolved = getPinColor(draft.color);
              return (
                <>
                  <button
                    type="button"
                    className={`color-swatch color-swatch-custom ${isCustom ? 'selected' : ''}`}
                    style={
                      isCustom
                        ? { background: resolved.bg, borderColor: resolved.border }
                        : undefined
                    }
                    onClick={() => pinColorInputRef.current?.click()}
                    aria-label="Custom color"
                    title="Custom color"
                  >
                    {isCustom && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={resolved.glyph} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={pinColorInputRef}
                    type="color"
                    className="color-input-hidden"
                    value={isCustom ? resolved.bg : '#ef4444'}
                    onChange={(e) => change('color', e.target.value)}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </>
              );
            })()}
          </div>
        </div>

        <div className="field">
          <label>Icon</label>
          <div className="pin-icon-picker">
            <button
              type="button"
              className={`pin-icon-tile pin-icon-default ${!draft.iconId ? 'selected' : ''}`}
              onClick={() => change('iconId', null)}
              title="Default colored pin"
            >
              <span
                className="pin-icon-default-dot"
                style={{
                  background: getPinColor(draft.color).bg,
                  borderColor: getPinColor(draft.color).border,
                }}
              />
            </button>
            {Object.entries(BUILT_IN_MAP_ICONS).map(([id, icon]) => {
              const isSelected = draft.iconId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`pin-icon-tile ${isSelected ? 'selected' : ''}`}
                  onClick={() => change('iconId', id)}
                  title={icon.name}
                  aria-label={icon.name}
                >
                  <img
                    src={getMapIconSrc(id, theme)}
                    alt=""
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label htmlFor="pin-label">Label</label>
          <input
            id="pin-label"
            autoFocus
            value={draft.label}
            onChange={(e) => change('label', e.target.value)}
            placeholder="e.g. Coffee shop, Workplace"
          />
        </div>

        <div className="field">
          <label htmlFor="pin-address">Address</label>
          <input
            id="pin-address"
            value={draft.address}
            onChange={(e) => change('address', e.target.value)}
            placeholder="123 Main St…"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="pin-visited">Visited</label>
            <input
              id="pin-visited"
              type="text"
              value={draft.visitedAt}
              onChange={(e) => change('visitedAt', e.target.value)}
              placeholder="e.g. 2025-03-14 or every Tuesday"
            />
          </div>
          <div className="field">
            <label htmlFor="pin-with">With whom</label>
            <input
              id="pin-with"
              value={draft.withWho}
              onChange={(e) => change('withWho', e.target.value)}
              placeholder="People they were with"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pin-notes">Notes</label>
          <textarea
            id="pin-notes"
            rows={4}
            value={draft.notes}
            onChange={(e) => change('notes', e.target.value)}
            placeholder="Anything else worth recording…"
          />
        </div>

        <div className="field">
          <label>Linked identifiers</label>
          <div className="link-chips">
            {stagedIdentifiers.map((i) => {
              const context = staged.get(i.id) ?? '';
              const isExpanded = expandedChip === i.id;
              return (
                <span
                  key={i.id}
                  className={`link-chip ${isExpanded ? 'expanded' : ''} ${context ? 'has-context' : ''}`}
                >
                  <button
                    type="button"
                    className="link-chip-body"
                    onClick={() =>
                      setExpandedChip(isExpanded ? null : i.id)
                    }
                    title={
                      context
                        ? `Context: ${context}`
                        : 'Click to add context'
                    }
                  >
                    <IdentifierBadge
                      typeKey={i.type}
                      customIconId={i.customIconId}
                      size="sm"
                    />
                    <span className="link-chip-textblock">
                      <span className="link-chip-text">
                        {getIdentifierDisplayLabel(i)}
                      </span>
                      {context && !isExpanded && (
                        <span className="link-chip-context">{context}</span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="link-chip-remove"
                    onClick={() => toggleStaged(i.id)}
                    aria-label="Remove link"
                    title="Remove link"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                  {isExpanded && (
                    <input
                      type="text"
                      autoFocus
                      className="link-chip-context-input"
                      placeholder="Context, e.g. tagged in IG post"
                      value={context}
                      onChange={(e) => setStagedContext(i.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setExpandedChip(null);
                        } else if (e.key === 'Escape') {
                          setExpandedChip(null);
                        }
                      }}
                      onBlur={() => setExpandedChip(null)}
                    />
                  )}
                </span>
              );
            })}
            <button
              type="button"
              className="link-chip-add"
              onClick={() => setPickerOpen(true)}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Link identifier
            </button>
          </div>
        </div>

        <div className="modal-actions modal-actions-spread">
          {pin?.id && onDelete && (
            <button
              type="button"
              className="btn btn-ghost danger"
              onClick={() => {
                if (confirm(`Delete this pin? This cannot be undone.`)) {
                  onDelete(pin.id);
                }
              }}
            >
              Delete pin
            </button>
          )}
          <div className="modal-actions-right">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {pin?.id ? 'Save changes' : 'Save pin'}
            </button>
          </div>
        </div>
      </form>
      {pickerOpen && (
        <LinkPicker
          title="Link identifiers"
          items={pickerItems}
          selectedIds={stagedIdSet}
          onToggle={toggleStaged}
          onClose={() => setPickerOpen(false)}
          emptyText="No identifiers yet. Add some on the Information tab."
        />
      )}
    </div>
  );
}
