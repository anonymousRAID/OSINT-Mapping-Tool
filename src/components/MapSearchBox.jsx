import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

/**
 * Google Maps-style search box. Wires Google's Places Autocomplete to a
 * themed text input. On result selection:
 *   1. The map pans / fits the viewport to the chosen place.
 *   2. If onPlaceSelected is provided, it's called with the place data so
 *      the caller can (typically) drop a pin there with full place details.
 *
 * The dropdown rendered by Google attaches to document.body with the
 * `.pac-container` class — styled in MapTab.css to match the app theme.
 */
export default function MapSearchBox({ onPlaceSelected }) {
  const map = useMap();
  const places = useMapsLibrary('places');
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  // Keep the latest callback in a ref so the Autocomplete listener (set up
  // once on mount) always sees the current handler without re-binding.
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    if (!places || !map || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
      fields: [
        'geometry',
        'name',
        'formatted_address',
        'place_id',
        'types',
      ],
    });
    autocompleteRef.current = ac;
    // Bias predictions to whatever the user is currently looking at.
    ac.bindTo('bounds', map);

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place?.geometry?.location) return;
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(16);
      }
      const cb = onPlaceSelectedRef.current;
      if (cb) {
        cb({
          placeId: place.place_id ?? null,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name ?? '',
          address: place.formatted_address ?? '',
          types: place.types ?? [],
        });
      }
      // Clear the input so the next search starts fresh.
      if (inputRef.current) inputRef.current.value = '';
    });

    return () => {
      listener.remove();
      autocompleteRef.current = null;
    };
  }, [places, map]);

  const handleKeyDown = (e) => {
    // Don't let Enter submit any surrounding form (there isn't one, but defensive).
    if (e.key === 'Enter') e.preventDefault();
  };

  const clear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  return (
    <div className="map-searchbox">
      <span className="map-searchbox-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search a place, address, or business…"
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck="false"
      />
      <button
        type="button"
        className="map-searchbox-clear"
        onClick={clear}
        title="Clear search"
        aria-label="Clear search"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
