import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useProject } from '../context/ProjectContext.jsx';
import { useAppConfig } from '../context/AppConfigContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNavigation } from '../context/NavigationContext.jsx';
import { getPinColor, PIN_COLORS } from '../pinColors.js';
import {
  BUILT_IN_MAP_ICONS,
  detectIconFromTypes,
  getMapIconSrc,
} from '../mapIcons.js';
import MapsKeySetup from './MapsKeySetup.jsx';
import MapSearchBox from './MapSearchBox.jsx';
import PinModal from './PinModal.jsx';
import PinInfoWindow from './PinInfoWindow.jsx';
import './MapTab.css';

const DOUBLE_CLICK_MS = 300;

const FALLBACK_MAP_ID = 'osint-tool-map';
const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;

function pinDisplayLabel(pin) {
  return pin.label?.trim() || pin.address?.trim() || 'Unnamed pin';
}

function pinSecondaryLabel(pin) {
  if (pin.label && pin.address) return pin.address;
  return `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`;
}

export default function MapTab() {
  const { loaded, googleMapsApiKey } = useAppConfig();

  if (!loaded) {
    return (
      <div className="map-tab">
        <div className="map-loading">Loading…</div>
      </div>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <div className="map-tab">
        <MapsKeySetup />
      </div>
    );
  }

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <MapTabInner />
    </APIProvider>
  );
}

function MapTabInner() {
  const { project, addPin, updatePin, deletePin, updateMapDisplay } =
    useProject();
  const { theme } = useTheme();
  const { googleMapsMapId } = useAppConfig();
  const { hoveredIdentifierId, focus, consumeFocus } = useNavigation();
  const mapDisplay = project?.mapDisplay ?? {
    showPinConnections: false,
    pinConnectionColor: '#ef4444',
  };
  const connectorColorInputRef = useRef(null);
  const mapId = googleMapsMapId || FALLBACK_MAP_ID;
  const pins = useMemo(
    () => project?.locations ?? [],
    [project?.locations],
  );
  const pinLinks = useMemo(
    () => project?.pinLinks ?? [],
    [project?.pinLinks],
  );

  // Pin IDs linked to the currently-hovered identifier (for pulse highlight).
  const highlightedPinIds = useMemo(() => {
    if (!hoveredIdentifierId) return new Set();
    return new Set(
      pinLinks
        .filter((l) => l.identifierId === hoveredIdentifierId)
        .map((l) => l.pinId),
    );
  }, [pinLinks, hoveredIdentifierId]);

  const [editingPin, setEditingPin] = useState(null);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const pendingPanRef = useRef(null);
  const lastMarkerClickRef = useRef({ id: null, time: 0 });

  // React to navigation focus requests targeted at a pin.
  useEffect(() => {
    if (!focus || focus.kind !== 'pin') return;
    const pin = pins.find((p) => p.id === focus.id);
    if (!pin) {
      consumeFocus(focus.token);
      return;
    }
    pendingPanRef.current = { lat: pin.lat, lng: pin.lng };
    setSelectedPinId(pin.id);
    consumeFocus(focus.token);
  }, [focus, pins, consumeFocus]);

  // Resolve the selected pin from current project state so it stays fresh
  // (and disappears automatically if the pin is deleted).
  const selectedPin = useMemo(
    () => pins.find((p) => p.id === selectedPinId) ?? null,
    [pins, selectedPinId],
  );
  const selectedPinIndex = useMemo(() => {
    const idx = pins.findIndex((p) => p.id === selectedPinId);
    return idx >= 0 ? idx + 1 : 0;
  }, [pins, selectedPinId]);

  const onMapClick = useCallback(
    (event) => {
      // If an InfoWindow is open, an empty-map click should just close it
      // (matches native Google Maps behavior) instead of dropping a new pin.
      if (selectedPinId) {
        setSelectedPinId(null);
        return;
      }
      const detail = event.detail;
      const latLng = detail?.latLng;
      if (!latLng) return;
      const placeId = detail?.placeId ?? null;
      const created = addPin({
        lat: latLng.lat,
        lng: latLng.lng,
        placeId,
      });
      pendingPanRef.current = { lat: latLng.lat, lng: latLng.lng };
      setEditingPin(created);
    },
    [addPin, selectedPinId],
  );

  const openEdit = useCallback((pin) => {
    setSelectedPinId(null);
    setEditingPin(pin);
    pendingPanRef.current = { lat: pin.lat, lng: pin.lng };
  }, []);

  const handleMarkerClick = useCallback((pin) => {
    const now = Date.now();
    const last = lastMarkerClickRef.current;
    if (last.id === pin.id && now - last.time < DOUBLE_CLICK_MS) {
      // Double-click on the same marker → jump straight to editor.
      lastMarkerClickRef.current = { id: null, time: 0 };
      setSelectedPinId(null);
      setEditingPin(pin);
      pendingPanRef.current = { lat: pin.lat, lng: pin.lng };
    } else {
      // Single click → show InfoWindow.
      lastMarkerClickRef.current = { id: pin.id, time: now };
      setSelectedPinId(pin.id);
      pendingPanRef.current = { lat: pin.lat, lng: pin.lng };
    }
  }, []);

  const handleSave = (patch) => {
    if (!editingPin) return;
    updatePin(editingPin.id, patch);
    setEditingPin(null);
  };

  const handleDelete = (id) => {
    deletePin(id);
    setEditingPin(null);
  };

  const initialCenter = useMemo(() => {
    if (pins.length === 0) return DEFAULT_CENTER;
    return { lat: pins[0].lat, lng: pins[0].lng };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initialZoom = pins.length === 0 ? DEFAULT_ZOOM : 13;

  return (
    <div className="map-tab">
      <aside className="map-sidebar">
        <div className="sidebar-header">
          <h3>Locations</h3>
          <button
            className="icon-btn"
            onClick={() => setShowSettings((s) => !s)}
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
            aria-pressed={mapDisplay.showPinConnections}
            title={
              mapDisplay.showPinConnections
                ? 'Hide pin connections'
                : 'Show pin connections'
            }
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 3"
            >
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
              {(() => {
                const presetHexes = new Set(
                  Object.values(PIN_COLORS).map((c) => c.bg.toLowerCase()),
                );
                const current = mapDisplay.pinConnectionColor ?? '';
                const isCustom =
                  current && !presetHexes.has(current.toLowerCase());
                return (
                  <>
                    <button
                      type="button"
                      className={`map-connect-swatch color-swatch-custom ${isCustom ? 'selected' : ''}`}
                      style={isCustom ? { background: current } : undefined}
                      onClick={() => connectorColorInputRef.current?.click()}
                      aria-label="Custom line color"
                      title="Custom color"
                    />
                    <input
                      ref={connectorColorInputRef}
                      type="color"
                      className="color-input-hidden"
                      value={isCustom ? current : '#ef4444'}
                      onChange={(e) =>
                        updateMapDisplay({ pinConnectionColor: e.target.value })
                      }
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {pins.length === 0 ? (
          <div className="empty-state">
            <p>No pinned locations yet.</p>
            <p className="empty-hint">
              Click anywhere on the map to drop a pin.
            </p>
          </div>
        ) : (
          <ul className="pin-list">
            {pins.map((pin, idx) => {
              const c = getPinColor(pin.color);
              // Pick the icon variant that contrasts with the pin's color
              // (not the app theme), since the badge bg is now the pin color.
              const iconVariantTheme = c.glyph === '#ffffff' ? 'dark' : 'light';
              const iconSrc = getMapIconSrc(pin.iconId, iconVariantTheme);
              return (
              <li
                key={pin.id}
                className={`pin-item ${highlightedPinIds.has(pin.id) ? 'highlighted' : ''}`}
                onClick={() => openEdit(pin)}
              >
                {iconSrc ? (
                  <div
                    className="pin-index pin-index-icon"
                    style={{
                      background: c.bg,
                      borderColor: c.border,
                    }}
                  >
                    <img src={iconSrc} alt="" draggable={false} />
                    <span
                      className="pin-index-num"
                      style={{ background: c.glyph, color: c.bg, borderColor: c.bg }}
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

      <div className="map-canvas">
        <Map
          mapId={mapId}
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={true}
          onClick={onMapClick}
          colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
        >
          {pins.map((pin, idx) => {
            const c = getPinColor(pin.color);
            const isHighlighted = highlightedPinIds.has(pin.id);
            // Icon variant chosen by contrast with the pin's color so the
            // glyph stays visible whether the pin is red, white, or black.
            const iconVariantTheme = c.glyph === '#ffffff' ? 'dark' : 'light';
            const iconSrc = getMapIconSrc(pin.iconId, iconVariantTheme);
            return (
              <AdvancedMarker
                key={pin.id}
                position={{ lat: pin.lat, lng: pin.lng }}
                onClick={() => handleMarkerClick(pin)}
              >
                <div
                  className={`custom-marker ${isHighlighted ? 'highlighted' : ''}`}
                  style={{ '--pulse-color': c.bg }}
                >
                  {iconSrc ? (
                    <div
                      className="custom-marker-icon"
                      style={{ background: c.bg, borderColor: c.border }}
                    >
                      <img src={iconSrc} alt="" draggable={false} />
                      <span
                        className="custom-marker-num"
                        style={{ background: c.glyph, color: c.bg, borderColor: c.bg }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="custom-marker-body"
                      style={{
                        background: c.bg,
                        color: c.glyph,
                        borderColor: c.border,
                      }}
                    >
                      {idx + 1}
                    </div>
                  )}
                </div>
              </AdvancedMarker>
            );
          })}
          {selectedPin && (
            <PinInfoWindow
              pin={selectedPin}
              index={selectedPinIndex}
              onClose={() => setSelectedPinId(null)}
              onEdit={() => {
                setSelectedPinId(null);
                setEditingPin(selectedPin);
                pendingPanRef.current = {
                  lat: selectedPin.lat,
                  lng: selectedPin.lng,
                };
              }}
            />
          )}
          <MapSearchBox
            onPlaceSelected={(info) => {
              // Drop a pin at the chosen place with full details + an
              // auto-detected icon from the place's Google types.
              const detectedIcon = detectIconFromTypes(info.types);
              const created = addPin({
                lat: info.lat,
                lng: info.lng,
                placeId: info.placeId,
                label: info.name,
                address: info.address,
                iconId: detectedIcon,
              });
              if (created) {
                pendingPanRef.current = { lat: info.lat, lng: info.lng };
                setEditingPin(created);
              }
            }}
          />
          <PinConnector
            pins={pins}
            enabled={mapDisplay.showPinConnections}
            color={mapDisplay.pinConnectionColor}
          />
          <MapController
            pendingPanRef={pendingPanRef}
            shouldZoom={editingPin !== null}
          />
          <PlaceLookup
            editingPin={editingPin}
            onResolved={(info) => {
              if (!editingPin) return;
              // Match an icon to the place's Google types (if any). Only set
              // if the user hasn't already chosen one explicitly.
              const detectedIcon = detectIconFromTypes(info.types);
              const nextIconId =
                editingPin.iconId ?? detectedIcon ?? null;
              setEditingPin((cur) =>
                cur
                  ? {
                      ...cur,
                      label: cur.label || info.name || cur.label,
                      address: cur.address || info.address || cur.address,
                      iconId: cur.iconId ?? detectedIcon ?? null,
                    }
                  : cur,
              );
              updatePin(editingPin.id, {
                label: editingPin.label || info.name || editingPin.label,
                address:
                  editingPin.address || info.address || editingPin.address,
                iconId: nextIconId,
              });
            }}
          />
        </Map>

        {showSettings && (
          <div
            className="map-settings-overlay"
            onClick={() => setShowSettings(false)}
          >
            <div
              className="map-settings-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <MapsKeySetupSettings onClose={() => setShowSettings(false)} />
            </div>
          </div>
        )}

        {editingPin && (
          <PinModal
            pin={editingPin}
            onClose={() => setEditingPin(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

// Draws a dashed polyline connecting pins in order (pin 1 → 2 → 3 → …).
// Uses Google's icon-along-path trick for dashes (strokeOpacity 0 + repeated
// stroke symbols), which is the canonical way to do dashed lines in the JS
// Maps API.
function PinConnector({ pins, enabled, color }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!enabled || pins.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }
    const path = pins.map((p) => ({ lat: p.lat, lng: p.lng }));
    const dashSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      strokeColor: color,
      scale: 3,
    };
    const opts = {
      path,
      strokeOpacity: 0,
      icons: [{ icon: dashSymbol, offset: '0', repeat: '14px' }],
    };
    if (polylineRef.current) {
      polylineRef.current.setOptions(opts);
    } else {
      polylineRef.current = new mapsLib.Polyline({ ...opts, map });
    }
  }, [map, mapsLib, enabled, pins, color]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    },
    [],
  );

  return null;
}

function MapController({ pendingPanRef, shouldZoom }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !pendingPanRef.current) return;
    const target = pendingPanRef.current;
    pendingPanRef.current = null;
    map.panTo(target);
    if (shouldZoom && (map.getZoom() ?? 0) < 13) {
      map.setZoom(15);
    }
  }, [map, shouldZoom, pendingPanRef]);
  return null;
}

function PlaceLookup({ editingPin, onResolved }) {
  const geocodingLibrary = useMapsLibrary('geocoding');
  const placesLibrary = useMapsLibrary('places');
  const map = useMap();
  const resolvedForRef = useRef(null);

  useEffect(() => {
    if (!editingPin) return;
    if (resolvedForRef.current === editingPin.id) return;
    if (editingPin.address || editingPin.label) {
      resolvedForRef.current = editingPin.id;
      return;
    }
    if (!geocodingLibrary) return;
    resolvedForRef.current = editingPin.id;

    const finalize = (info) => {
      if (!info) return;
      onResolved(info);
    };

    // If the click landed on a known POI, prefer Places details — and grab
    // the `types` array so we can pick an icon (cafe → coffee, etc.).
    if (editingPin.placeId && placesLibrary && map) {
      try {
        const service = new placesLibrary.PlacesService(map);
        service.getDetails(
          {
            placeId: editingPin.placeId,
            fields: ['name', 'formatted_address', 'types'],
          },
          (place, status) => {
            if (status === placesLibrary.PlacesServiceStatus.OK && place) {
              finalize({
                name: place.name ?? '',
                address: place.formatted_address ?? '',
                types: place.types ?? [],
              });
            } else {
              reverseGeocode();
            }
          },
        );
        return;
      } catch {
        // fall through
      }
    }

    reverseGeocode();

    function reverseGeocode() {
      const geocoder = new geocodingLibrary.Geocoder();
      geocoder.geocode(
        { location: { lat: editingPin.lat, lng: editingPin.lng } },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            finalize({ address: results[0].formatted_address ?? '', name: '' });
          }
        },
      );
    }
  }, [editingPin, geocodingLibrary, placesLibrary, map, onResolved]);

  return null;
}

function MapsKeySetupSettings({ onClose }) {
  const {
    googleMapsApiKey,
    googleMapsApiKeySource,
    clearGoogleMapsApiKey,
    googleMapsMapId,
    googleMapsMapIdSource,
    setGoogleMapsMapId,
    clearGoogleMapsMapId,
  } = useAppConfig();
  const [mapIdDraft, setMapIdDraft] = useState(googleMapsMapId ?? '');

  // Keep the input in sync when the value changes externally (e.g. clear).
  useEffect(() => {
    setMapIdDraft(googleMapsMapId ?? '');
  }, [googleMapsMapId]);

  const handleSaveMapId = (e) => {
    e.preventDefault();
    setGoogleMapsMapId(mapIdDraft);
  };

  const mapIdChanged = (mapIdDraft || '').trim() !== (googleMapsMapId || '');

  return (
    <div className="map-settings">
      <div className="modal-header">
        <h2>Map settings</h2>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="settings-current">
        <div className="settings-row">
          <span className="settings-label">Current API key</span>
          <code className="settings-value">{maskKey(googleMapsApiKey)}</code>
        </div>
        <div className="settings-row">
          <span className="settings-label">Source</span>
          <span className="settings-value">
            {googleMapsApiKeySource ?? 'unknown'}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (
              confirm(
                'Clear the saved Google Maps API key from this browser? You can re-enter it any time.',
              )
            ) {
              clearGoogleMapsApiKey();
            }
          }}
        >
          Clear key
        </button>
      </div>

      <hr className="settings-divider" />

      {/* Optional Map ID — needed for Cloud-styled maps + Advanced Markers.
          The app works without one (falls back to a placeholder), so this is
          purposely optional with a clearly-marked "optional" hint. */}
      <form className="settings-current" onSubmit={handleSaveMapId}>
        <div className="settings-row">
          <span className="settings-label">
            Map ID <span className="settings-optional">(optional)</span>
          </span>
          <code className="settings-value">
            {googleMapsMapId ?? '—'}
          </code>
        </div>
        <div className="settings-row">
          <span className="settings-label">Source</span>
          <span className="settings-value">
            {googleMapsMapIdSource ?? 'not set'}
          </span>
        </div>
        <input
          type="text"
          autoComplete="off"
          spellCheck="false"
          placeholder="Paste a Map ID from Google Cloud → Map Management"
          value={mapIdDraft}
          onChange={(e) => setMapIdDraft(e.target.value)}
          className="settings-input"
        />
        <p className="settings-hint">
          Optional. Leave blank to use Google's default styling. Required only
          if you want a custom map style you've created in Google Cloud.
        </p>
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={clearGoogleMapsMapId}
            disabled={!googleMapsMapId}
          >
            Clear
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!mapIdChanged}
          >
            Save Map ID
          </button>
        </div>
      </form>

      <hr className="settings-divider" />

      <MapsKeySetup compact onSaved={onClose} />
    </div>
  );
}

function maskKey(key) {
  if (!key) return '—';
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
