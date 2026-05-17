import { useEffect, useMemo, useState } from 'react';
import { InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { getPinColor } from '../pinColors.js';
import { useProject } from '../context/ProjectContext.jsx';
import { useNavigation } from '../context/NavigationContext.jsx';
import {
  getDisplayLabel as getIdentifierDisplayLabel,
  getTypeDef,
} from '../identifierTypes.js';
import IdentifierBadge from './IdentifierBadge.jsx';
import './PinInfoWindow.css';

/**
 * Floating card shown when a pin marker is clicked. Combines:
 *   - Pin's stored fields (label, address, visited, withWho, notes)
 *   - Google Place Details when the pin has a placeId (rating, types,
 *     opening hours, phone, website)
 * Plus actions:
 *   - "Edit details" → opens the full pin editor
 *   - "Open in Google Maps" → deep link in new tab
 */
export default function PinInfoWindow({ pin, index, onClose, onEdit }) {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [placesUnavailable, setPlacesUnavailable] = useState(false);
  const placesLib = useMapsLibrary('places');
  const map = useMap();
  const { project } = useProject();
  const { navigateToIdentifier, setHoveredIdentifierId } = useNavigation();

  // Safety net: if the InfoWindow unmounts while a chip is hovered (e.g. the
  // user closes via the × or clicks elsewhere), the chip's mouseleave never
  // fires. Clear hovered state on unmount so pins don't stay pulsing.
  useEffect(
    () => () => setHoveredIdentifierId(null),
    [setHoveredIdentifierId],
  );
  const linkedEntries = useMemo(() => {
    if (!pin) return [];
    const links = project?.pinLinks ?? [];
    const idents = project?.identifiers ?? [];
    const identById = new Map(idents.map((i) => [i.id, i]));
    return links
      .filter((l) => l.pinId === pin.id)
      .map((l) => ({
        link: l,
        identifier: identById.get(l.identifierId),
      }))
      .filter((entry) => entry.identifier);
  }, [pin, project?.pinLinks, project?.identifiers]);

  useEffect(() => {
    setPlaceDetails(null);
    setPlacesUnavailable(false);
    if (!pin?.placeId || !placesLib || !map) return;

    setLoading(true);
    try {
      const service = new placesLib.PlacesService(map);
      service.getDetails(
        {
          placeId: pin.placeId,
          fields: [
            'name',
            'formatted_address',
            'types',
            'rating',
            'user_ratings_total',
            'opening_hours',
            'formatted_phone_number',
            'website',
            'url',
          ],
        },
        (place, status) => {
          setLoading(false);
          if (status === placesLib.PlacesServiceStatus.OK && place) {
            setPlaceDetails(place);
          } else {
            setPlacesUnavailable(true);
          }
        },
      );
    } catch {
      setLoading(false);
      setPlacesUnavailable(true);
    }
  }, [pin?.id, pin?.placeId, placesLib, map]);

  if (!pin) return null;

  const color = getPinColor(pin.color);
  const displayLabel =
    pin.label?.trim() ||
    placeDetails?.name ||
    pin.address?.trim() ||
    `Pin ${index}`;
  const address = pin.address?.trim() || placeDetails?.formatted_address || '';

  const googleMapsUrl =
    placeDetails?.url ||
    (pin.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${pin.placeId}`
      : `https://www.google.com/maps?q=${pin.lat},${pin.lng}`);

  const typeLabels = formatPlaceTypes(placeDetails?.types);
  const isOpenNow = placeDetails?.opening_hours?.open_now;
  const hasCustomDetails =
    !!(pin.visitedAt?.trim?.() || pin.withWho?.trim?.() || pin.notes?.trim?.());

  return (
    <InfoWindow
      position={{ lat: pin.lat, lng: pin.lng }}
      onCloseClick={onClose}
      pixelOffset={[0, -36]}
      headerDisabled
    >
      <div className="pin-info-window">
        <div className="pin-info-header">
          <div
            className="pin-info-badge"
            style={{
              background: color.bg,
              color: color.glyph,
              borderColor: color.border,
            }}
          >
            {index}
          </div>
          <div className="pin-info-title-block">
            <div className="pin-info-title">{displayLabel}</div>
            {address && <div className="pin-info-address">{address}</div>}
          </div>
        </div>

        {loading && (
          <div className="pin-info-loading">Loading place info…</div>
        )}

        {placeDetails && (
          <div className="pin-info-section pin-info-google">
            {placeDetails.rating != null && (
              <div className="pin-info-row">
                <span className="pin-info-rating">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  {placeDetails.rating.toFixed(1)}
                </span>
                {placeDetails.user_ratings_total != null && (
                  <span className="pin-info-muted">
                    ({placeDetails.user_ratings_total.toLocaleString()})
                  </span>
                )}
                {typeLabels && (
                  <span className="pin-info-muted">· {typeLabels}</span>
                )}
              </div>
            )}
            {placeDetails.rating == null && typeLabels && (
              <div className="pin-info-row pin-info-muted">{typeLabels}</div>
            )}
            {isOpenNow !== undefined && (
              <div className="pin-info-row">
                <span
                  className={`pin-info-status ${
                    isOpenNow ? 'open' : 'closed'
                  }`}
                >
                  <span className="status-dot" />
                  {isOpenNow ? 'Open now' : 'Closed now'}
                </span>
              </div>
            )}
            {placeDetails.formatted_phone_number && (
              <div className="pin-info-row">
                <a
                  className="pin-info-link"
                  href={`tel:${placeDetails.formatted_phone_number.replace(/\s+/g, '')}`}
                >
                  {placeDetails.formatted_phone_number}
                </a>
              </div>
            )}
            {placeDetails.website && (
              <div className="pin-info-row">
                <a
                  className="pin-info-link"
                  href={placeDetails.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortenUrl(placeDetails.website)}
                </a>
              </div>
            )}
          </div>
        )}

        {hasCustomDetails && (
          <div className="pin-info-section pin-info-custom">
            {pin.visitedAt?.trim?.() && (
              <div className="pin-info-row">
                <span className="pin-info-field-label">Visited:</span>
                <span>{pin.visitedAt}</span>
              </div>
            )}
            {pin.withWho?.trim?.() && (
              <div className="pin-info-row">
                <span className="pin-info-field-label">With:</span>
                <span>{pin.withWho}</span>
              </div>
            )}
            {pin.notes?.trim?.() && (
              <div className="pin-info-notes">{pin.notes}</div>
            )}
          </div>
        )}

        {placesUnavailable && pin.placeId && (
          <div className="pin-info-section pin-info-muted small">
            Google place details unavailable.
          </div>
        )}

        {linkedEntries.length > 0 && (
          <div className="pin-info-section pin-info-links">
            <div className="pin-info-field-label">Linked to</div>
            <div className="pin-info-link-chips">
              {linkedEntries.map(({ link, identifier: i }) => (
                <button
                  key={link.id}
                  type="button"
                  className="pin-info-link-chip clickable"
                  onClick={() => {
                    setHoveredIdentifierId(null);
                    onClose();
                    navigateToIdentifier(i.id);
                  }}
                  onMouseEnter={() => setHoveredIdentifierId(i.id)}
                  onMouseLeave={() => setHoveredIdentifierId(null)}
                  title={`Open ${getTypeDef(i.type).label} in Information tab`}
                >
                  <IdentifierBadge
                    typeKey={i.type}
                    customIconId={i.customIconId}
                    size="sm"
                  />
                  <span className="pin-info-link-chip-textblock">
                    <span className="pin-info-link-chip-text">
                      {getIdentifierDisplayLabel(i)}
                    </span>
                    {link.context && (
                      <span className="pin-info-link-chip-context">
                        {link.context}
                      </span>
                    )}
                  </span>
                  <span className="pin-info-link-chip-type">
                    {getTypeDef(i.type).label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pin-info-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onEdit}
          >
            Edit details
          </button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm pin-info-external"
          >
            Open in Google Maps
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
          </a>
        </div>
      </div>
    </InfoWindow>
  );
}

function formatPlaceTypes(types) {
  if (!types) return '';
  const filtered = types
    .filter((t) => !['establishment', 'point_of_interest'].includes(t))
    .slice(0, 3)
    .map((t) =>
      t
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    );
  return filtered.join(' · ');
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, '') + (u.pathname === '/' ? '' : u.pathname);
  } catch {
    return url;
  }
}
