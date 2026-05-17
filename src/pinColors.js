/**
 * Pin color palette for map markers and matching sidebar badges.
 * Add new entries in the order you want them rendered in the picker.
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
  gray:   { name: 'Gray',   bg: '#6b7280', border: '#374151', glyph: '#ffffff' },
};

export const DEFAULT_PIN_COLOR = 'red';

export function getPinColor(key) {
  return PIN_COLORS[key] ?? PIN_COLORS[DEFAULT_PIN_COLOR];
}
