/**
 * Pin color palette for map markers and matching sidebar badges.
 *
 * A pin's `color` field can be either:
 *   - a preset key from PIN_COLORS  (e.g. "red", "blue", "black")
 *   - a hex string                  (e.g. "#7c3aed") for fully-custom colors
 *
 * Custom hex colors get their `border` (a darker shade) and `glyph` (black or
 * white text) computed automatically by `getPinColor` so any color works
 * everywhere without extra wiring.
 */
export const PIN_COLORS = {
  red:    { name: 'Red',    bg: '#ef4444', border: '#b91c1c', glyph: '#ffffff' },
  orange: { name: 'Orange', bg: '#f97316', border: '#c2410c', glyph: '#ffffff' },
  yellow: { name: 'Yellow', bg: '#eab308', border: '#a16207', glyph: '#1d1d1f' },
  green:  { name: 'Green',  bg: '#10b981', border: '#047857', glyph: '#ffffff' },
  teal:   { name: 'Teal',   bg: '#14b8a6', border: '#0f766e', glyph: '#ffffff' },
  blue:   { name: 'Blue',   bg: '#3b82f6', border: '#1e40af', glyph: '#ffffff' },
  purple: { name: 'Purple', bg: '#8b5cf6', border: '#6d28d9', glyph: '#ffffff' },
  pink:   { name: 'Pink',   bg: '#ec4899', border: '#be185d', glyph: '#ffffff' },
  white:  { name: 'White',  bg: '#ffffff', border: '#9ca3af', glyph: '#1d1d1f' },
  black:  { name: 'Black',  bg: '#0f1115', border: '#000000', glyph: '#ffffff' },
};

export const DEFAULT_PIN_COLOR = 'red';

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHex(hex) {
  const h = hex.replace('#', '');
  return h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
}

function parseChannels(hex) {
  const full = expandHex(hex);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Multiply each channel by (1 - amount) so the hex becomes darker. */
export function darkenHex(hex, amount = 0.3) {
  if (!HEX_RE.test(hex)) return hex;
  const [r, g, b] = parseChannels(hex).map((v) =>
    Math.max(0, Math.round(v * (1 - amount))),
  );
  return (
    '#' +
    [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
}

/** Pick black or white glyph text for readable contrast against `hex`. */
export function readableTextOn(hex) {
  if (!HEX_RE.test(hex)) return '#ffffff';
  const [r, g, b] = parseChannels(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165 ? '#1d1d1f' : '#ffffff';
}

/** True if the value is a preset key (or anything we'd treat as a preset). */
export function isPresetColor(value) {
  return typeof value === 'string' && Object.hasOwn(PIN_COLORS, value);
}

/**
 * Resolve a color value into the full `{ name, bg, border, glyph }` record.
 * - Preset key → returns the matching PIN_COLORS entry.
 * - Hex string → returns a synthesized entry with computed border/glyph.
 * - Anything else → falls back to the default preset.
 */
export function getPinColor(value) {
  if (isPresetColor(value)) return PIN_COLORS[value];
  if (typeof value === 'string' && HEX_RE.test(value)) {
    return {
      name: value.toLowerCase(),
      bg: value,
      border: darkenHex(value, 0.3),
      glyph: readableTextOn(value),
    };
  }
  return PIN_COLORS[DEFAULT_PIN_COLOR];
}
