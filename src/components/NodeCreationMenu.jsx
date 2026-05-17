import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { listTypesByCategory } from '../identifierTypes.js';
import IdentifierBadge from './IdentifierBadge.jsx';
import './NodeCreationMenu.css';

/**
 * Floating popup shown when the user drags a connection line into empty
 * canvas space (Blender-style). Pick a type → caller creates a new
 * identifier node of that type and auto-connects it to the source.
 *
 * Props:
 *   - position: { x, y } in viewport (clientX/clientY) — where to anchor
 *   - onSelect: (typeKey) => void
 *   - onClose:  () => void
 */
export default function NodeCreationMenu({ position, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);
  const listRef = useRef(null);
  const [coords, setCoords] = useState({ left: position.x, top: position.y });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Clamp position so the menu stays inside the viewport.
  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const r = menuRef.current.getBoundingClientRect();
    const margin = 8;
    let left = position.x;
    let top = position.y;
    if (left + r.width > window.innerWidth - margin) {
      left = window.innerWidth - r.width - margin;
    }
    if (top + r.height > window.innerHeight - margin) {
      top = window.innerHeight - r.height - margin;
    }
    if (left < margin) left = margin;
    if (top < margin) top = margin;
    setCoords({ left, top });
  }, [position]);

  const categories = useMemo(() => listTypesByCategory(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        types: cat.types.filter(
          (t) =>
            t.label.toLowerCase().includes(q) ||
            t.key.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.types.length > 0);
  }, [categories, query]);

  // Flat ordered list of visible types — used for keyboard navigation.
  const flatTypes = useMemo(() => {
    const out = [];
    for (const cat of filtered) for (const t of cat.types) out.push(t);
    return out;
  }, [filtered]);

  const indexByKey = useMemo(() => {
    const m = new Map();
    flatTypes.forEach((t, i) => m.set(t.key, i));
    return m;
  }, [flatTypes]);

  // Reset selection when the filter narrows/widens.
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll the active row into view as the user arrows through.
  useEffect(() => {
    if (!listRef.current) return;
    const row = listRef.current.querySelector('.node-menu-row.active');
    row?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const totalShown = flatTypes.length;

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, totalShown - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatTypes[selectedIndex];
      if (target) onSelect(target.key);
    }
  };

  return (
    <div className="node-menu-backdrop" onMouseDown={onClose}>
      <div
        ref={menuRef}
        className="node-menu"
        style={coords}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          autoFocus
          placeholder="Add identifier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="node-menu-search"
        />
        <div className="node-menu-list" ref={listRef}>
          {totalShown === 0 ? (
            <div className="node-menu-empty">No matches.</div>
          ) : (
            filtered.map((cat) => (
              <div key={cat.key} className="node-menu-group">
                <h4>{cat.label}</h4>
                {cat.types.map((t) => {
                  const idx = indexByKey.get(t.key);
                  const isActive = idx === selectedIndex;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className={`node-menu-row ${isActive ? 'active' : ''}`}
                      onClick={() => onSelect(t.key)}
                      onMouseEnter={() =>
                        idx != null && setSelectedIndex(idx)
                      }
                    >
                      <IdentifierBadge typeKey={t.key} size="sm" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
