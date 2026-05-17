import { createContext, useCallback, useContext, useRef, useState } from 'react';

const NavigationContext = createContext(null);

/**
 * Shared state for cross-tab interactions:
 *   - tab: which of 'info' | 'map' is active
 *   - hoveredIdentifierId: when set, MapTab pulses linked markers
 *   - focus: { kind, id, token } — when populated, target tab scrolls to /
 *            highlights the item, then clears via consumeFocus(token).
 *
 * `token` lets the consumer avoid acting on a focus event twice; if a new
 * navigation request happens, the token changes and the destination re-fires.
 */
export function NavigationProvider({ children }) {
  const [tab, setTab] = useState('info');
  const [hoveredIdentifierId, setHoveredIdentifierId] = useState(null);
  const [focus, setFocus] = useState(null);
  const tokenRef = useRef(0);

  const navigateToIdentifier = useCallback((id) => {
    tokenRef.current += 1;
    setTab('info');
    setFocus({ kind: 'identifier', id, token: tokenRef.current });
  }, []);

  const navigateToPin = useCallback((id) => {
    tokenRef.current += 1;
    setTab('map');
    setFocus({ kind: 'pin', id, token: tokenRef.current });
  }, []);

  const consumeFocus = useCallback((token) => {
    setFocus((cur) => (cur && cur.token === token ? null : cur));
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        tab,
        setTab,
        focus,
        consumeFocus,
        hoveredIdentifierId,
        setHoveredIdentifierId,
        navigateToIdentifier,
        navigateToPin,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
