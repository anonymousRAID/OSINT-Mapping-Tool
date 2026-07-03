import { useEffect, useMemo } from 'react';
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
 * Provider-agnostic body of the pin details card. Renders the header,
 * the user's own notes (visited / with / notes), the linked-identifier
 * chips, and the action row. Provider-specific extras (e.g. Google Place
 * details) are passed as children and slot in between the header and the
 * notes section.
 *
 * Wrapped by PinInfoWindow (Google InfoWindow) and by the Leaflet Popup
 * in MapTabOSM, so both map providers show the same card.
 */
export default function PinInfoCard({
  pin,
  index,
  displayLabel,
  address,
  externalUrl,
  externalLabel,
  onClose,
  onEdit,
  children,
}) {
  const { project } = useProject();
  const { navigateToIdentifier, setHoveredIdentifierId } = useNavigation();

  // Safety net: if the card unmounts while a chip is hovered (e.g. the user
  // closes via the × or clicks elsewhere), the chip's mouseleave never
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

  if (!pin) return null;

  const color = getPinColor(pin.color);
  const hasCustomDetails =
    !!(pin.visitedAt?.trim?.() || pin.withWho?.trim?.() || pin.notes?.trim?.());

  return (
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

      {children}

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
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm pin-info-external"
        >
          {externalLabel}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
        </a>
      </div>
    </div>
  );
}
