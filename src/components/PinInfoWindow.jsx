import { useEffect, useState } from 'react';
import { InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import PinInfoCard from './PinInfoCard.jsx';
import './PinInfoWindow.css';

/**
 * Floating card shown when a pin marker is clicked in Google mode.
 * Wraps the shared PinInfoCard in Google's InfoWindow and adds the
 * Google-only extras: Place Details (rating, opening hours, phone,
 * website) fetched via the pin's placeId, and a deep link to Google Maps.
 */
export default function PinInfoWindow({ pin, index, onClose, onEdit }) {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [placesUnavailable, setPlacesUnavailable] = useState(false);
  const placesLib = useMapsLibrary('places');
  const map = useMap();

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

  return (
    <InfoWindow
      position={{ lat: pin.lat, lng: pin.lng }}
      onCloseClick={onClose}
      pixelOffset={[0, -36]}
      headerDisabled
    >
      <PinInfoCard
        pin={pin}
        index={index}
        displayLabel={displayLabel}
        address={address}
        externalUrl={googleMapsUrl}
        externalLabel="Open in Google Maps"
        onClose={onClose}
        onEdit={onEdit}
      >
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

        {placesUnavailable && pin.placeId && (
          <div className="pin-info-section pin-info-muted small">
            Google place details unavailable.
          </div>
        )}
      </PinInfoCard>
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
