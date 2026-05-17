import { useEffect, useMemo, useState } from 'react';
import './LinkPicker.css';

/**
 * Generic searchable multi-select picker used to link a pin to identifiers,
 * or an identifier to pins. Renders on top of the modal that opened it
 * (z-indexed higher than the standard modal layer).
 *
 * Props:
 *   - title:        header text
 *   - items:        Array<{ id, badge: ReactNode, label, secondary, group }>
 *   - selectedIds:  Set<string>
 *   - onToggle:     (id) => void   — called when user clicks a row
 *   - onClose:      () => void
 *   - emptyText:    string shown when no items at all
 */
export default function LinkPicker({
  title,
  items,
  selectedIds,
  onToggle,
  onClose,
  emptyText = 'Nothing to link to yet.',
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.label ?? ''} ${it.secondary ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const grouped = useMemo(() => {
    const buckets = new Map();
    for (const it of filtered) {
      const g = it.group || '';
      if (!buckets.has(g)) buckets.set(g, []);
      buckets.get(g).push(it);
    }
    return Array.from(buckets.entries());
  }, [filtered]);

  return (
    <div className="link-picker-backdrop" onMouseDown={onClose}>
      <div
        className="link-picker"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="link-picker-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <input
          type="text"
          autoFocus
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="link-picker-search"
        />

        <div className="link-picker-list">
          {items.length === 0 && (
            <div className="link-picker-empty">{emptyText}</div>
          )}
          {items.length > 0 && filtered.length === 0 && (
            <div className="link-picker-empty">No matches.</div>
          )}
          {grouped.map(([group, rows]) => (
            <div key={group || '_'} className="link-picker-group">
              {group && <h4>{group}</h4>}
              {rows.map((it) => {
                const selected = selectedIds.has(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    className={`link-picker-row ${selected ? 'selected' : ''}`}
                    onClick={() => onToggle(it.id)}
                  >
                    {it.badge}
                    <div className="link-picker-body">
                      <div className="link-picker-label">{it.label}</div>
                      {it.secondary && (
                        <div className="link-picker-secondary">
                          {it.secondary}
                        </div>
                      )}
                    </div>
                    <div className="link-picker-check">
                      {selected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="link-picker-footer">
          <span className="link-picker-count">
            {selectedIds.size} selected
          </span>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
