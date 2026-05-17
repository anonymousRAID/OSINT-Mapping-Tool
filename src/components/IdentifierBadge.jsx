import { getTypeDef, resolveIconSrc } from '../identifierTypes.js';
import {
  BUILT_IN_ICONS,
  TYPE_DEFAULT_ICON,
  getBuiltInSrc,
} from '../identifierIcons.js';
import { useCustomIcons } from '../context/CustomIconsContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const SIZE_PRESETS = {
  sm: { box: 24, font: 10 },
  md: { box: 28, font: 11 },
  lg: { box: 36, font: 13 },
  xl: { box: 56, font: 22 },
};

function pickTextColor(bgHex) {
  const hex = bgHex.replace('#', '');
  const full = hex.length === 3
    ? hex.split('').map((c) => c + c).join('')
    : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165 ? '#1d1d1f' : '#ffffff';
}

export default function IdentifierBadge({ typeKey, customIconId, size = 'md' }) {
  const { icons: customIcons } = useCustomIcons();
  const { theme } = useTheme();
  const dim = SIZE_PRESETS[size] ?? SIZE_PRESETS.md;
  const def = getTypeDef(typeKey);
  const iconSrc = resolveIconSrc(
    { typeKey, customIconId },
    customIcons,
    BUILT_IN_ICONS,
    TYPE_DEFAULT_ICON,
    getBuiltInSrc,
    theme,
  );

  if (iconSrc) {
    return (
      <img
        src={iconSrc}
        className="identifier-badge-image"
        style={{ width: dim.box, height: dim.box }}
        alt=""
        aria-label={def.label}
        draggable={false}
      />
    );
  }

  return (
    <span
      className="identifier-badge"
      style={{
        width: dim.box,
        height: dim.box,
        fontSize: dim.font,
        background: def.color,
        color: pickTextColor(def.color),
      }}
      aria-label={def.label}
    >
      {def.glyph}
    </span>
  );
}
