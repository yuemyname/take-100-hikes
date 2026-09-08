export type OfficialCharacterColor = 'yellow' | 'red' | 'blue' | 'pink';

/**
 * Official 100PEAKS character artwork supplied by the user.
 *
 * Product rule:
 * - These four color families are the recurring brand cast.
 * - They are NOT assigned one-to-one to mountains.
 * - Mountains are the collectible object; characters are recurring brand actors.
 * - Keep assets/mascots as an experimental/supporting library for future reuse.
 *
 * Metro only resolves lowercase asset extensions, so the numbered uploads
 * (`b.Take a Hike_Character_*.PNG`) are referenced through the lowercase
 * copies in assets/official/characters/.
 */
export const OFFICIAL_CHARACTERS = {
  yellow: [
    require('../../assets/official/characters/yellow-1.png'),
    require('../../assets/official/characters/yellow-2.png'),
    require('../../assets/official/characters/yellow-3.png'),
    require('../../assets/official/characters/yellow-4.png'),
  ],
  red: [
    require('../../assets/official/characters/red-1.png'),
    require('../../assets/official/characters/red-2.png'),
    require('../../assets/official/characters/red-3.png'),
    require('../../assets/official/characters/red-4.png'),
  ],
  blue: [
    require('../../assets/official/characters/blue-2.png'),
    require('../../assets/official/characters/blue-3.png'),
    require('../../assets/official/characters/blue-4.png'),
  ],
  pink: [
    require('../../assets/official/characters/pink-1.png'),
    require('../../assets/official/characters/pink-2.png'),
    require('../../assets/official/characters/pink-3.png'),
    require('../../assets/official/characters/pink-4.png'),
  ],
} as const;

/**
 * Contextual official graphic/sticker assets.
 * ASCII aliases under assets/official/stickers point to the original uploaded blobs;
 * the original Korean-named files remain untouched.
 */
export const OFFICIAL_STICKERS = {
  freshAir: require('../../assets/official/stickers/fresh-air.png'),
  wantToGoHome: require('../../assets/official/stickers/want-to-go-home.png'),
  didIt: require('../../assets/official/stickers/did-it.png'),
  neverAgain: require('../../assets/official/stickers/never-again.png'),
  safeDescent: require('../../assets/official/stickers/safe-descent.png'),
  water: require('../../assets/official/stickers/water.png'),
  mountain: require('../../assets/official/stickers/mountain.png'),
  saveMe: require('../../assets/official/stickers/save-me.png'),
  summitToday: require('../../assets/official/stickers/summit-today.png'),
  summitSuccess: require('../../assets/official/stickers/summit-success.png'),
  thisIsWhyIHike: require('../../assets/official/stickers/why-i-hike.png'),
  summitCheck: require('../../assets/official/stickers/summit-check.png'),
  lowBattery: require('../../assets/official/stickers/low-battery.png'),
  flatGroundBest: require('../../assets/official/stickers/flat-ground-best.png'),
  sun: require('../../assets/official/stickers/sun.png'),
} as const;

/** Shared recurring actors by screen context. These are roles, not mountain identities. */
export const HOME_HERO_CHARACTER = OFFICIAL_CHARACTERS.yellow[0];
export const MOUNTAIN_DETAIL_CHARACTER = OFFICIAL_CHARACTERS.blue[1];
export const CERTIFICATION_SUCCESS_CHARACTER = OFFICIAL_CHARACTERS.red[0];
export const SOCIAL_CHARACTER = OFFICIAL_CHARACTERS.pink[0];
