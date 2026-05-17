/**
 * Built-in icon registry. Vite resolves the imports below to hashed asset URLs
 * at build time, so we can pass them straight to <img src> and they get
 * bundled cleanly.
 *
 * Each entry is either:
 *   { name, src }                        — single icon used in any theme
 *   { name, light, dark }                — separate variants per theme
 *
 * To add a new built-in icon:
 *   1. Drop the PNG/SVG into src/images/node_icons/
 *   2. Add an import + an entry in BUILT_IN_ICONS
 *   3. (Optional) Map a type key in TYPE_DEFAULT_ICON so that type starts
 *      using it automatically.
 */
import discordIcon from './images/node_icons/discord.png';
import facebookIcon from './images/node_icons/facebook.png';
import familyBlack from './images/node_icons/family-black.png';
import familyWhite from './images/node_icons/family-white.png';
import familyPersonDark from './images/node_icons/family-person-dark.png';
import familyPersonLight from './images/node_icons/family-person-light.png';
import googleIcon from './images/node_icons/google.png';
import instagramIcon from './images/node_icons/instagram.png';
import licensePlateBlack from './images/node_icons/license-plate-black.png';
import licensePlateWhite from './images/node_icons/license-plate-white.png';
import linkedinIcon from './images/node_icons/linkedin.png';
import phoneDark from './images/node_icons/phone-dark.png';
import phoneLight from './images/node_icons/phone-light.png';
import snapchatIcon from './images/node_icons/snapchat.png';
import spotifyIcon from './images/node_icons/spotify.png';
import telegramIcon from './images/node_icons/telegram.png';
import tiktokIcon from './images/node_icons/tik-tok.png';
import twitterBlack from './images/node_icons/twitter-black.png';
import twitterWhite from './images/node_icons/twitter-white.png';
import vehicleBlack from './images/node_icons/vehicle-black.png';
import vehicleWhite from './images/node_icons/vehicle-white.png';
import vinBlack from './images/node_icons/vin-black.png';
import vinWhite from './images/node_icons/vin-white.png';
import whatsappIcon from './images/node_icons/social.png';
import youtubeIcon from './images/node_icons/youtube.png';

export const BUILT_IN_ICONS = {
  instagram: { name: 'Instagram', src: instagramIcon },
  facebook: { name: 'Facebook', src: facebookIcon },
  // Icons with `light` and `dark` variants swap automatically based on the
  // current theme so the icon stays visible against the background.
  twitter: { name: 'X / Twitter', light: twitterBlack, dark: twitterWhite },
  youtube: { name: 'YouTube', src: youtubeIcon },
  tiktok: { name: 'TikTok', src: tiktokIcon },
  linkedin: { name: 'LinkedIn', src: linkedinIcon },
  snapchat: { name: 'Snapchat', src: snapchatIcon },
  discord: { name: 'Discord', src: discordIcon },
  telegram: { name: 'Telegram', src: telegramIcon },
  google: { name: 'Google', src: googleIcon },
  spotify: { name: 'Spotify', src: spotifyIcon },
  whatsapp: { name: 'WhatsApp', src: whatsappIcon },
  phone: { name: 'Phone', light: phoneDark, dark: phoneLight },
  family: { name: 'Family', light: familyBlack, dark: familyWhite },
  familyPerson: {
    name: 'Family (person)',
    light: familyPersonDark,
    dark: familyPersonLight,
  },
  vehicle: { name: 'Vehicle', light: vehicleBlack, dark: vehicleWhite },
  vin: { name: 'VIN', light: vinBlack, dark: vinWhite },
  licensePlate: {
    name: 'License plate',
    light: licensePlateBlack,
    dark: licensePlateWhite,
  },
};

/** When an identifier of this type has no `customIconId`, fall back to this built-in icon. */
export const TYPE_DEFAULT_ICON = {
  instagram: 'instagram',
  facebook: 'facebook',
  twitter: 'twitter',
  youtube: 'youtube',
  tiktok: 'tiktok',
  linkedin: 'linkedin',
  snapchat: 'snapchat',
  discord: 'discord',
  telegram: 'telegram',
  phone: 'phone',
  family: 'family',
  vehicle: 'vehicle',
  vin: 'vin',
  licensePlate: 'licensePlate',
};

/**
 * Pick the right src for a built-in icon given the current theme.
 * Falls through gracefully if only one variant is defined.
 */
export function getBuiltInSrc(iconId, theme = 'dark') {
  const entry = BUILT_IN_ICONS[iconId];
  if (!entry) return null;
  if (entry.src) return entry.src;
  if (theme === 'light') return entry.light ?? entry.dark ?? null;
  return entry.dark ?? entry.light ?? null;
}
