/**
 * Definitions for every built-in identifier type plus the "custom" catch-all.
 *
 * Each type declares:
 *   - label:    human-readable name shown in the picker and badges
 *   - category: groups types in the picker (see CATEGORIES below)
 *   - glyph:    2-character abbreviation rendered inside the colored badge
 *   - color:    badge background color
 *   - fields:   array of field descriptors rendered as form inputs
 *
 * Field descriptor shape:
 *   - key:         unique key inside identifier.fields
 *   - label:       form label
 *   - type:        'text' | 'textarea' | 'url' | 'email' | 'tel' | 'number' | 'date'
 *   - placeholder: optional input placeholder
 *   - primary:     when true, this field's value is used as the list display label
 *                  and is required when saving
 */

export const CATEGORIES = {
  social: { label: 'Social Media', order: 1 },
  contact: { label: 'Contact', order: 2 },
  personal: { label: 'Personal', order: 3 },
  vehicle: { label: 'Vehicle', order: 4 },
  other: { label: 'Other', order: 5 },
};

const socialNumericFields = [
  { key: 'followers', label: 'Followers', type: 'number' },
  { key: 'following', label: 'Following', type: 'number' },
  { key: 'posts', label: 'Posts', type: 'number' },
];

export const IDENTIFIER_TYPES = {
  instagram: {
    label: 'Instagram',
    category: 'social',
    glyph: 'IG',
    color: '#E1306C',
    fields: [
      { key: 'username', label: 'Username', type: 'text', primary: true, placeholder: '@username' },
      { key: 'profileUrl', label: 'Profile URL', type: 'url' },
      { key: 'displayName', label: 'Display name', type: 'text' },
      { key: 'email', label: 'Linked email', type: 'email' },
      { key: 'phone', label: 'Linked phone', type: 'tel' },
      ...socialNumericFields,
      { key: 'videos', label: 'Videos', type: 'number' },
      { key: 'taggedPhotos', label: 'Tagged photos', type: 'number' },
      { key: 'bio', label: 'Bio', type: 'textarea' },
    ],
  },
  facebook: {
    label: 'Facebook',
    category: 'social',
    glyph: 'FB',
    color: '#1877F2',
    fields: [
      { key: 'username', label: 'Username or handle', type: 'text', primary: true },
      { key: 'profileUrl', label: 'Profile URL', type: 'url' },
      { key: 'displayName', label: 'Display name', type: 'text' },
      { key: 'email', label: 'Linked email', type: 'email' },
      ...socialNumericFields,
      { key: 'bio', label: 'Bio', type: 'textarea' },
    ],
  },
  twitter: {
    label: 'X / Twitter',
    category: 'social',
    glyph: 'X',
    color: '#1d1d1f',
    fields: [
      { key: 'username', label: 'Username', type: 'text', primary: true, placeholder: '@handle' },
      { key: 'profileUrl', label: 'Profile URL', type: 'url' },
      { key: 'displayName', label: 'Display name', type: 'text' },
      ...socialNumericFields,
      { key: 'bio', label: 'Bio', type: 'textarea' },
    ],
  },
  youtube: {
    label: 'YouTube',
    category: 'social',
    glyph: 'YT',
    color: '#FF0000',
    fields: [
      { key: 'channelName', label: 'Channel name', type: 'text', primary: true },
      { key: 'channelUrl', label: 'Channel URL', type: 'url' },
      { key: 'handle', label: 'Handle', type: 'text', placeholder: '@handle' },
      { key: 'subscribers', label: 'Subscribers', type: 'number' },
      { key: 'videos', label: 'Videos', type: 'number' },
      { key: 'bio', label: 'About', type: 'textarea' },
    ],
  },
  tiktok: {
    label: 'TikTok',
    category: 'social',
    glyph: 'TT',
    color: '#000000',
    fields: [
      { key: 'username', label: 'Username', type: 'text', primary: true, placeholder: '@username' },
      { key: 'profileUrl', label: 'Profile URL', type: 'url' },
      { key: 'displayName', label: 'Display name', type: 'text' },
      ...socialNumericFields,
      { key: 'likes', label: 'Likes', type: 'number' },
      { key: 'bio', label: 'Bio', type: 'textarea' },
    ],
  },
  linkedin: {
    label: 'LinkedIn',
    category: 'social',
    glyph: 'LI',
    color: '#0A66C2',
    fields: [
      { key: 'fullName', label: 'Full name', type: 'text', primary: true },
      { key: 'profileUrl', label: 'Profile URL', type: 'url' },
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'company', label: 'Current company', type: 'text' },
      { key: 'role', label: 'Current role', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'connections', label: 'Connections', type: 'number' },
    ],
  },
  snapchat: {
    label: 'Snapchat',
    category: 'social',
    glyph: 'SC',
    color: '#FFFC00',
    fields: [
      { key: 'username', label: 'Username', type: 'text', primary: true },
      { key: 'displayName', label: 'Display name', type: 'text' },
      { key: 'snapcode', label: 'Snapcode URL', type: 'url' },
    ],
  },
  reddit: {
    label: 'Reddit',
    category: 'social',
    glyph: 'RD',
    color: '#FF4500',
    fields: [
      { key: 'username', label: 'Username', type: 'text', primary: true, placeholder: 'u/username' },
      { key: 'profileUrl', label: 'Profile URL', type: 'url' },
      { key: 'karma', label: 'Karma', type: 'number' },
      { key: 'accountAge', label: 'Account age', type: 'text', placeholder: 'e.g. 4 yrs' },
    ],
  },
  discord: {
    label: 'Discord',
    category: 'social',
    glyph: 'DC',
    color: '#5865F2',
    fields: [
      { key: 'username', label: 'Username', type: 'text', primary: true },
      { key: 'displayName', label: 'Display name', type: 'text' },
      { key: 'userId', label: 'User ID', type: 'text' },
    ],
  },
  telegram: {
    label: 'Telegram',
    category: 'social',
    glyph: 'TG',
    color: '#2AABEE',
    fields: [
      { key: 'username', label: 'Username', type: 'text', primary: true, placeholder: '@username' },
      { key: 'phone', label: 'Linked phone', type: 'tel' },
      { key: 'displayName', label: 'Display name', type: 'text' },
    ],
  },

  email: {
    label: 'Email',
    category: 'contact',
    glyph: '@',
    color: '#7C4DFF',
    fields: [
      { key: 'address', label: 'Email address', type: 'email', primary: true, placeholder: 'name@example.com' },
      { key: 'provider', label: 'Provider', type: 'text', placeholder: 'Gmail, Outlook, ProtonMail…' },
      { key: 'context', label: 'Context', type: 'text', placeholder: 'Work, personal, throwaway…' },
    ],
  },
  phone: {
    label: 'Phone',
    category: 'contact',
    glyph: '☎',
    color: '#0EA5A0',
    fields: [
      { key: 'number', label: 'Phone number', type: 'tel', primary: true, placeholder: '+1 555 555 5555' },
      { key: 'carrier', label: 'Carrier', type: 'text' },
      { key: 'lineType', label: 'Line type', type: 'text', placeholder: 'Mobile, landline, VoIP…' },
      { key: 'country', label: 'Country', type: 'text' },
    ],
  },

  name: {
    label: 'Name',
    category: 'personal',
    glyph: 'N',
    color: '#3B82F6',
    fields: [
      { key: 'fullName', label: 'Full name', type: 'text', primary: true },
      { key: 'aliases', label: 'Aliases / nicknames', type: 'text' },
      { key: 'dob', label: 'Date of birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'text' },
    ],
  },
  address: {
    label: 'Address',
    category: 'personal',
    glyph: 'AD',
    color: '#10B981',
    fields: [
      { key: 'line1', label: 'Address', type: 'text', primary: true },
      { key: 'line2', label: 'Apt / Unit', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'region', label: 'State / Region', type: 'text' },
      { key: 'postal', label: 'Postal code', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'context', label: 'Context', type: 'text', placeholder: 'Home, work, previous…' },
    ],
  },
  family: {
    label: 'Family member',
    category: 'personal',
    glyph: 'FM',
    color: '#F59E0B',
    fields: [
      { key: 'name', label: 'Name', type: 'text', primary: true },
      { key: 'relation', label: 'Relation', type: 'text', placeholder: 'Spouse, parent, sibling…' },
      { key: 'dob', label: 'Date of birth', type: 'date' },
      { key: 'contact', label: 'Contact', type: 'text' },
    ],
  },

  vehicle: {
    label: 'Vehicle',
    category: 'vehicle',
    glyph: 'CR',
    color: '#EF4444',
    fields: [
      { key: 'description', label: 'Description', type: 'text', primary: true, placeholder: '2018 Honda Civic, silver' },
      { key: 'make', label: 'Make', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'owner', label: 'Registered owner', type: 'text' },
    ],
  },
  vin: {
    label: 'VIN',
    category: 'vehicle',
    glyph: 'VN',
    color: '#DC2626',
    fields: [
      { key: 'vin', label: 'VIN', type: 'text', primary: true, placeholder: '17 characters' },
      { key: 'vehicleDescription', label: 'Vehicle description', type: 'text' },
    ],
  },
  licensePlate: {
    label: 'License plate',
    category: 'vehicle',
    glyph: 'LP',
    color: '#B91C1C',
    fields: [
      { key: 'plate', label: 'Plate', type: 'text', primary: true },
      { key: 'region', label: 'State / Region', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'vehicleDescription', label: 'Vehicle description', type: 'text' },
    ],
  },

  custom: {
    label: 'Custom',
    category: 'other',
    glyph: '*',
    color: '#6B7280',
    fields: [
      { key: 'title', label: 'Title', type: 'text', primary: true, placeholder: 'What is this identifier?' },
      { key: 'value', label: 'Value', type: 'text' },
      { key: 'url', label: 'URL', type: 'url' },
    ],
  },
};

export function listTypesByCategory() {
  const byCat = {};
  for (const [key, def] of Object.entries(IDENTIFIER_TYPES)) {
    if (!byCat[def.category]) byCat[def.category] = [];
    byCat[def.category].push({ key, ...def });
  }
  return Object.entries(CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      types: byCat[key] ?? [],
    }))
    .filter((c) => c.types.length > 0);
}

export function getTypeDef(typeKey) {
  return IDENTIFIER_TYPES[typeKey] ?? IDENTIFIER_TYPES.custom;
}

export function getPrimaryFieldKey(typeKey) {
  const def = getTypeDef(typeKey);
  return def.fields.find((f) => f.primary)?.key ?? def.fields[0]?.key;
}

export function getDisplayLabel(identifier) {
  if (!identifier) return '';
  const primaryKey = getPrimaryFieldKey(identifier.type);
  const value = identifier.fields?.[primaryKey];
  if (value && String(value).trim()) return String(value);
  return getTypeDef(identifier.type).label;
}

export function getSecondaryLabel(identifier) {
  if (!identifier) return '';
  const def = getTypeDef(identifier.type);
  const primaryKey = getPrimaryFieldKey(identifier.type);
  for (const field of def.fields) {
    if (field.key === primaryKey) continue;
    const value = identifier.fields?.[field.key];
    if (value && String(value).trim()) return String(value);
  }
  return '';
}

/**
 * Resolve which image (if any) to use for a given identifier/type.
 *
 * Resolution order:
 *   1. Explicit customIconId on the identifier (overrides the type default)
 *      - May reference a built-in icon ('instagram', 'snapchat', …)
 *        OR a user-uploaded icon stored in CustomIconsContext.
 *   2. Type default (TYPE_DEFAULT_ICON lookup)
 *   3. null → caller should render the colored glyph badge instead.
 *
 * For built-in icons, the variant (light/dark) is picked from getBuiltInSrc.
 */
export function resolveIconSrc(
  { typeKey, customIconId },
  customIcons = {},
  BUILT_IN_ICONS,
  TYPE_DEFAULT_ICON,
  getBuiltInSrc,
  theme = 'dark',
) {
  if (customIconId) {
    if (BUILT_IN_ICONS[customIconId]) return getBuiltInSrc(customIconId, theme);
    if (customIcons[customIconId]) return customIcons[customIconId].dataUrl;
  }
  const fallback = TYPE_DEFAULT_ICON[typeKey];
  if (fallback && BUILT_IN_ICONS[fallback]) return getBuiltInSrc(fallback, theme);
  return null;
}
