/**
 * Map pin icon registry. Each entry has light/dark variants so icons stay
 * visible against the themed marker background.
 *
 * Naming convention (same as identifierIcons.js):
 *   - `*-black.png` is a dark icon meant for LIGHT backgrounds → `light`
 *   - `*-white.png` is a light icon meant for DARK backgrounds → `dark`
 *
 * To add a new map icon:
 *   1. Drop both variants into src/images/icons/
 *   2. Add imports + an entry in BUILT_IN_MAP_ICONS
 *   3. (Optional) Add place-type aliases in PLACE_TYPE_TO_ICON
 */
import amusementParkBlack from './images/icons/amusement-park-black.png';
import amusementParkWhite from './images/icons/amusement-park-white.png';
import bookLibraryBlack from './images/icons/book-library-black.png';
import bookLibraryWhite from './images/icons/book-library-white.png';
import clothesBlack from './images/icons/clothes-black.png';
import clothesWhite from './images/icons/clothes-white.png';
import coffeeBlack from './images/icons/coffee-cup-black.png';
import coffeeWhite from './images/icons/coffee-cup-white.png';
import foodBlack from './images/icons/eat-food-black.png';
import foodWhite from './images/icons/eat-food-white.png';
import gymBlack from './images/icons/gym-black.png';
import gymWhite from './images/icons/gym-white.png';
import homeBlack from './images/icons/home-black.png';
import homeWhite from './images/icons/home-white.png';
import movieBlack from './images/icons/movie-theater-black.png';
import movieWhite from './images/icons/movie-theater-white.png';
import parkBlack from './images/icons/park-black.png';
import parkWhite from './images/icons/park-white.png';
import schoolBlack from './images/icons/school-black.png';
import schoolWhite from './images/icons/school-white.png';
import shoppingBlack from './images/icons/shopping-mall-black.png';
import shoppingWhite from './images/icons/shopping-mall-white.png';

export const BUILT_IN_MAP_ICONS = {
  coffee: { name: 'Coffee shop', light: coffeeBlack, dark: coffeeWhite },
  food: { name: 'Restaurant', light: foodBlack, dark: foodWhite },
  gym: { name: 'Gym', light: gymBlack, dark: gymWhite },
  home: { name: 'Home', light: homeBlack, dark: homeWhite },
  movie: { name: 'Cinema', light: movieBlack, dark: movieWhite },
  park: { name: 'Park', light: parkBlack, dark: parkWhite },
  amusementPark: {
    name: 'Amusement park',
    light: amusementParkBlack,
    dark: amusementParkWhite,
  },
  school: { name: 'School', light: schoolBlack, dark: schoolWhite },
  shopping: { name: 'Shopping', light: shoppingBlack, dark: shoppingWhite },
  clothes: { name: 'Clothing store', light: clothesBlack, dark: clothesWhite },
  library: { name: 'Library', light: bookLibraryBlack, dark: bookLibraryWhite },
};

/**
 * Google Maps Place type → our icon key. Types are checked in the order
 * Google returns them (most specific first), so the first match wins.
 */
export const PLACE_TYPE_TO_ICON = {
  cafe: 'coffee',
  coffee_shop: 'coffee',

  restaurant: 'food',
  meal_takeaway: 'food',
  meal_delivery: 'food',
  bakery: 'food',
  bar: 'food',
  food: 'food',

  gym: 'gym',
  fitness_center: 'gym',
  health: 'gym',

  lodging: 'home',
  hotel: 'home',
  rv_park: 'home',

  movie_theater: 'movie',

  park: 'park',
  national_park: 'park',
  campground: 'park',
  tourist_attraction: 'park',
  amusement_park: 'amusementPark',
  water_park: 'amusementPark',
  zoo: 'amusementPark',

  school: 'school',
  primary_school: 'school',
  secondary_school: 'school',
  university: 'school',
  preschool: 'school',

  library: 'library',
  book_store: 'library',

  clothing_store: 'clothes',
  shoe_store: 'clothes',

  shopping_mall: 'shopping',
  department_store: 'shopping',
  supermarket: 'shopping',
  convenience_store: 'shopping',
  grocery_or_supermarket: 'shopping',
  store: 'shopping',
};

export function detectIconFromTypes(types) {
  if (!Array.isArray(types)) return null;
  for (const t of types) {
    if (PLACE_TYPE_TO_ICON[t]) return PLACE_TYPE_TO_ICON[t];
  }
  return null;
}

/**
 * Pick the right src for a built-in map icon given the current theme.
 * Falls back if only one variant is defined.
 */
export function getMapIconSrc(iconId, theme = 'dark') {
  if (!iconId) return null;
  const entry = BUILT_IN_MAP_ICONS[iconId];
  if (!entry) return null;
  if (entry.src) return entry.src;
  if (theme === 'light') return entry.light ?? entry.dark ?? null;
  return entry.dark ?? entry.light ?? null;
}
