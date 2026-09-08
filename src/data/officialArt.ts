export type OfficialCharacterColor = 'yellow' | 'red' | 'blue' | 'pink';

/**
 * Official 100PEAKS character artwork supplied by the user.
 *
 * Product rule:
 * - These four color families are the recurring brand cast.
 * - They are NOT assigned one-to-one to mountains.
 * - Mountains are the collectible object; characters are recurring brand actors.
 * - Keep assets/mascots as an experimental/supporting library for future reuse.
 */
export const OFFICIAL_CHARACTERS = {
  yellow: [
    require('../../assets/official/b.Take a Hike_Character_YELLOW (1).PNG'),
    require('../../assets/official/b.Take a Hike_Character_YELLOW (2).PNG'),
    require('../../assets/official/b.Take a Hike_Character_YELLOW (3).PNG'),
    require('../../assets/official/b.Take a Hike_Character_YELLOW (4).PNG'),
  ],
  red: [
    require('../../assets/official/b.Take a Hike_Character_RED (1).PNG'),
    require('../../assets/official/b.Take a Hike_Character_RED (2).PNG'),
    require('../../assets/official/b.Take a Hike_Character_RED (3).PNG'),
    require('../../assets/official/b.Take a Hike_Character_RED (4).PNG'),
  ],
  blue: [
    require('../../assets/official/b.Take a Hike_Character_BLUE (2).PNG'),
    require('../../assets/official/b.Take a Hike_Character_BLUE (3).PNG'),
    require('../../assets/official/b.Take a Hike_Character_BLUE (4).PNG'),
  ],
  pink: [
    require('../../assets/official/b.Take a Hike_Character_PINK (1).PNG'),
    require('../../assets/official/b.Take a Hike_Character_PINK (2).PNG'),
    require('../../assets/official/b.Take a Hike_Character_PINK (3).PNG'),
    require('../../assets/official/b.Take a Hike_Character_PINK (4).PNG'),
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

/** Default hero actor for the first concept-matching home pass. */
export const HOME_HERO_CHARACTER = OFFICIAL_CHARACTERS.yellow[0];
