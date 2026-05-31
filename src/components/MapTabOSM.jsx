import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useProject } from '../context/ProjectContext.jsx';
import { useAppConfig } from '../context/AppConfigContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNavigation } from '../context/NavigationContext.jsx';
import { getPinColor, PIN_COLORS } from '../pinColors.js';
import { getMapIconSrc } from '../mapIcons.js';
import PinModal from './PinModal.jsx';
import ClearAllDataButton from './ClearAllDataButton.jsx';
import './MapTab.css';
import './MapTabOSM.css';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;

function pinDisplayLabel(pin) {
  return pin.label?.trim() || pin.address?.trim() || 'Unnamed pin';
}

function pinSecondaryLabel(pin) {
  if (pin.label && pin.address) return pin.address;
  return `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`;
}

/**
 * OpenStreetMap-backed alternative to the Google Maps tab.
 *
 * Uses Leaflet + OSM tiles and Nominatim for search. No API key required.
 * Pin data is shared with the Google version through ProjectContext, so
 * switching providers preserves everything.
 *
 * Limitations vs Google:
 *   - No InfoWindow (clicking a marker opens the edit modal directly).
 *   - No place-type auto-detection on drop. Address auto-fills via Nominatim
 *     reverse-geocoding.
 *   - Tile style is OSM's default. Other free providers exist; can swap.
 */
export default function MapTabOSM({ visible = true }) {
  const { project, addPin, updatePin, deletePin, updateMapDisplay } =
    useProject();
  const { theme } = useTheme();
  const { mapProvider, setMapProvider } = useAppConfig();
  const { hoveredIdentifierId } = useNavigation();
  const [showSettings, setShowSettings] = useState(false);
  const pins = useMemo(() => project?.locations ?? [], [project?.locations]);
  const pinLinks = useMemo(
    () => project?.pinLinks ?? [],
    [project?.pinLinks],
  );
  const mapDisplay = project?.mapDisplay ?? {
    showPinConnections: false,
    pinConnectionColor: '#ef4444',
  };

  // Pin IDs linked to the currently-hovered identifier (for highlight ring).
  const highlightedPinIds = useMemo(() => {
    if (!hoveredIdentifierId) return new Set();
    return new Set(
      pinLinks
        .filter((l) => l.identifierId === hoveredIdentifierId)
        .map((l) => l.pinId),
    );
  }, [pinLinks, hoveredIdentifierId]);

  const [editingPin, setEditingPin] = useState(null);
  const pendingPanRef = useRef(null);

  const initialCenter = useMemo(() => {
    if (pins.length === 0) return DEFAULT_CENTER;
    return [pins[0].lat, pins[0].lng];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const initialZoom = pins.length === 0 ? DEFAULT_ZOOM : 13;

  const handleMapClick = useCallback(
    async ({ lat, lng }) => {
      const created = addPin({ lat, lng });
      pendingPanRef.current = { lat, lng };
      setEditingPin(created);
      // Best-effort reverse geocode for an address. Nominatim has rate limits
      // and an attribution policy; this is fine for a single user.
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { Accept: 'application/json' } },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.display_name) return;
        setEditingPin((cur) =>
          cur && cur.id === created.id
            ? { ...cur, address: cur.address || data.display_name }
            : cur,
        );
        updatePin(created.id, {
          address: created.address || data.display_name,
        });
      } catch {
        /* ignore — pin works without the address */
      }
    },
    [addPin, updatePin],
  );

  const handleSave = (patch) => {
    if (!editingPin) return;
    updatePin(editingPin.id, patch);
    setEditingPin(null);
  };

  const handleDelete = (id) => {
    deletePin(id);
    setEditingPin(null);
  };

  return (
    <div className="map-tab">
      <aside className="map-sidebar">
        <div className="sidebar-header">
          <h3>Locations</h3>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            title="Map settings"
            aria-label="Map settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <div className="map-display-controls">
          <button
            type="button"
            className={`map-connect-toggle ${mapDisplay.showPinConnections ? 'active' : ''}`}
            onClick={() =>
              updateMapDisplay({
                showPinConnections: !mapDisplay.showPinConnections,
              })
            }
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3">
              <line x1="3" y1="20" x2="21" y2="4" />
            </svg>
            Connect pins
          </button>
          {mapDisplay.showPinConnections && (
            <div className="map-connect-colors">
              {Object.values(PIN_COLORS).map((c) => {
                const isSelected =
                  mapDisplay.pinConnectionColor?.toLowerCase() ===
                  c.bg.toLowerCase();
                return (
                  <button
                    key={c.bg}
                    type="button"
                    className={`map-connect-swatch ${isSelected ? 'selected' : ''}`}
                    style={{ background: c.bg, borderColor: c.border }}
                    onClick={() =>
                      updateMapDisplay({ pinConnectionColor: c.bg })
                    }
                    aria-label={`Line color: ${c.name}`}
                    title={c.name}
                  />
                );
              })}
            </div>
          )}
        </div>

        {pins.length === 0 ? (
          <div className="empty-state">
            <p>No pinned locations yet.</p>
            <p className="empty-hint">Click anywhere on the map to drop a pin.</p>
          </div>
        ) : (
          <ul className="pin-list">
            {pins.map((pin, idx) => {
              const c = getPinColor(pin.color);
              const iconVariantTheme =
                c.glyph === '#ffffff' ? 'dark' : 'light';
              const iconSrc = getMapIconSrc(pin.iconId, iconVariantTheme);
              return (
                <li
                  key={pin.id}
                  className={`pin-item ${highlightedPinIds.has(pin.id) ? 'highlighted' : ''}`}
                  onClick={() => {
                    pendingPanRef.current = { lat: pin.lat, lng: pin.lng };
                    setEditingPin(pin);
                  }}
                >
                  {iconSrc ? (
                    <div
                      className="pin-index pin-index-icon"
                      style={{ background: c.bg, borderColor: c.border }}
                    >
                      <img src={iconSrc} alt="" draggable={false} />
                      <span
                        className="pin-index-num"
                        style={{
                          background: c.glyph,
                          color: c.bg,
                          borderColor: c.bg,
                        }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="pin-index"
                      style={{
                        background: c.bg,
                        color: c.glyph,
                        borderColor: c.border,
                      }}
                    >
                      {idx + 1}
                    </div>
                  )}
                  <div className="pin-body">
                    <div className="pin-label">{pinDisplayLabel(pin)}</div>
                    <div className="pin-secondary">
                      {pinSecondaryLabel(pin)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="pin-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${pinDisplayLabel(pin)}"?`)) {
                        deletePin(pin.id);
                      }
                    }}
                    aria-label="Delete pin"
                    title="Delete pin"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <div className={`map-canvas leaflet-theme-${theme}`}>
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          minZoom={2}
          maxZoom={19}
          worldCopyJump
          className="osm-map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPin onClick={handleMapClick} disabled={!!editingPin} />
          <PanController pendingPanRef={pendingPanRef} />
          <InvalidateOnVisible visible={visible} />
          {pins.map((pin, idx) => (
            <PinMarker
              key={pin.id}
              pin={pin}
              index={idx + 1}
              highlighted={highlightedPinIds.has(pin.id)}
              onClick={() => {
                pendingPanRef.current = { lat: pin.lat, lng: pin.lng };
                setEditingPin(pin);
              }}
            />
          ))}
          {mapDisplay.showPinConnections && pins.length >= 2 && (
            <Polyline
              positions={pins.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color: mapDisplay.pinConnectionColor,
                weight: 3,
                opacity: 0.9,
                dashArray: '8 6',
              }}
            />
          )}
          <NominatimSearch
            onSelect={(info) => {
              const created = addPin({
                lat: info.lat,
                lng: info.lng,
                label: info.name ?? '',
                address: info.address ?? '',
              });
              if (created) {
                pendingPanRef.current = { lat: info.lat, lng: info.lng };
                setEditingPin(created);
              }
            }}
          />
        </MapContainer>

        {editingPin && (
          <PinModal
            pin={editingPin}
            onClose={() => setEditingPin(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}

        {showSettings && (
          <div
            className="map-settings-overlay"
            onClick={() => setShowSettings(false)}
          >
            <div
              className="map-settings-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="map-settings">
                <div className="modal-header">
                  <h2>Map settings</h2>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShowSettings(false)}
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="settings-current">
                  <div className="settings-row">
                    <span className="settings-label">Map provider</span>
                    <span className="settings-value">OpenStreetMap</span>
                  </div>
                  <p className="settings-hint">
                    Using OpenStreetMap tiles and Nominatim search — no API
                    key required. Tile rendering and geocoding still need an
                    internet connection.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={async () => {
                      await setMapProvider('google');
                      setShowSettings(false);
                    }}
                  >
                    Switch to Google Maps
                  </button>
                </div>

                <hr className="settings-divider" />

                <ClearAllDataButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helpers ----------------------------------------------------------------

function ClickToPin({ onClick, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function PanController({ pendingPanRef }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !pendingPanRef.current) return;
    const t = pendingPanRef.current;
    pendingPanRef.current = null;
    map.flyTo([t.lat, t.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  });
  return null;
}

/**
 * When the map tab is hidden via display:none and then shown again, Leaflet's
 * cached container size is stale and tiles render in a broken offset. We
 * call invalidateSize() on every transition back to visible so Leaflet
 * re-measures and redraws. Cheap to run — no-ops if size hasn't changed.
 */
function InvalidateOnVisible({ visible }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !visible) return;
    // rAF lets the browser commit the layout change (display: block) before
    // Leaflet reads the new dimensions.
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [map, visible]);
  return null;
}

/** Build an SVG-based Leaflet DivIcon that mirrors the Google marker look. */
function buildLeafletIcon({ pin, index, theme }) {
  const c = getPinColor(pin.color);
  const iconVariantTheme = c.glyph === '#ffffff' ? 'dark' : 'light';
  const iconSrc = getMapIconSrc(pin.iconId, iconVariantTheme);
  // Two visual variants: a plain colored circle with a number, or a
  // colored circle with an image and a small number badge.
  const inner = iconSrc
    ? `<div class="osm-marker osm-marker-icon"
           style="background:${c.bg};border-color:${c.border};">
         <img src="${iconSrc}" alt="" />
         <span class="osm-marker-num"
               style="background:${c.glyph};color:${c.bg};border-color:${c.bg};">
           ${index}
         </span>
       </div>`
    : `<div class="osm-marker osm-marker-body"
           style="background:${c.bg};color:${c.glyph};border-color:${c.border};">
         ${index}
       </div>`;
  return L.divIcon({
    className: 'osm-marker-wrap',
    html: inner,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function PinMarker({ pin, index, onClick, highlighted }) {
  const { theme } = useTheme();
  const icon = useMemo(
    () => buildLeafletIcon({ pin, index, theme }),
    [pin.color, pin.iconId, index, theme, highlighted], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <Marker
      position={[pin.lat, pin.lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    />
  );
}

function NominatimSearch({ onSelect }) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=6`,
          { signal: controller.signal, headers: { Accept: 'application/json' } },
        );
        if (!res.ok) return;
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Network error or rate limit — fail silently
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      if (r.boundingbox) {
        const [s, n, w, e] = r.boundingbox.map(parseFloat);
        if ([s, n, w, e].every(Number.isFinite)) {
          map?.flyToBounds([
            [s, w],
            [n, e],
          ]);
        } else {
          map?.flyTo([lat, lng], 15);
        }
      } else {
        map?.flyTo([lat, lng], 15);
      }
      onSelect({
        lat,
        lng,
        name: r.namedetails?.name ?? r.display_name?.split(',')[0] ?? '',
        address: r.display_name ?? '',
      });
    }
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div
      className="map-searchbox osm-searchbox"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="map-searchbox-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        type="text"
        autoComplete="off"
        spellCheck="false"
        placeholder="Search OpenStreetMap…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {query && (
        <button
          type="button"
          className="map-searchbox-clear"
          onClick={() => setQuery('')}
          title="Clear"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      {open && (results.length > 0 || loading) && (
        <ul className="osm-search-results">
          {loading && results.length === 0 && (
            <li className="osm-search-loading">Searching…</li>
          )}
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                className="osm-search-result"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(r);
                }}
              >
                <div className="osm-search-result-name">
                  {r.display_name?.split(',')[0]}
                </div>
                <div className="osm-search-result-meta">
                  {r.display_name?.split(',').slice(1).join(',').trim()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

