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

/** Contextual official graphic/sticker assets. Use sparingly as collage accents. */
export const OFFICIAL_STICKERS = {
  freshAir: require('../../assets/official/a.공기맛집.PNG'),
  wantToGoHome: require('../../assets/official/a.나집에갈래.PNG'),
  didIt: require('../../assets/official/a.내가해냄.PNG'),
  neverAgain: require('../../assets/official/a.다시는-안와.PNG'),
  safeDescent: require('../../assets/official/a.무사하산.PNG'),
  water: require('../../assets/official/a.물.PNG'),
  mountain: require('../../assets/official/a.산.PNG'),
  saveMe: require('../../assets/official/a.살려주세요.PNG'),
  summitToday: require('../../assets/official/a.오늘도-완등.PNG'),
  summitSuccess: require('../../assets/official/a.완등성공.PNG'),
  thisIsWhyIHike: require('../../assets/official/a.이맛에등산함.PNG'),
  summitCheck: require('../../assets/official/a.정상접수.PNG'),
  lowBattery: require('../../assets/official/a.체력방전.PNG'),
  flatGroundBest: require('../../assets/official/a.평지가최고.PNG'),
  sun: require('../../assets/official/a.해.PNG'),
} as const;

/** Default hero actor for the first concept-matching home pass. */
export const HOME_HERO_CHARACTER = OFFICIAL_CHARACTERS.yellow[0];
