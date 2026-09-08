import type { MascotEyes, MascotLook, MascotPose, MascotProp } from '@/components/ui/Mascot';
import { colors, illustration } from '@/constants';

/**
 * Official raster mascot artwork lives in /assets/mascots.
 * The seven approved characters below MUST render their image asset first.
 * Procedural SVG styling remains only as a fallback for mountains that do not
 * yet have official artwork.
 */
const CURATED: Record<string, MascotLook> = {
  seoraksan: {
    image: require('../../assets/mascots/seoraksan.png'),
    body: colors.red, patch: colors.surface, face: illustration.faceCream,
    eyes: 'wide', pose: 'wave', prop: 'none', accent: colors.blue,
  },
  hallasan: {
    image: require('../../assets/mascots/hallasan.png'),
    body: colors.blue, patch: colors.surface, face: illustration.faceCream,
    eyes: 'dots', pose: 'wave', prop: 'none', accent: colors.yellow,
  },
  bukhansan: {
    image: require('../../assets/mascots/bukhansan.png'),
    body: colors.green, patch: colors.surface, face: illustration.faceCream,
    eyes: 'wide', pose: 'sit', prop: 'none', accent: colors.yellow,
  },
  jirisan: {
    image: require('../../assets/mascots/jirisan.png'),
    body: colors.pink, patch: colors.surface, face: illustration.faceCream,
    eyes: 'sleepy', pose: 'sit', prop: 'none', accent: colors.green,
  },
  deogyusan: {
    image: require('../../assets/mascots/deogyusan.png'),
    body: colors.surface, patch: colors.surfaceMuted, face: illustration.faceCream,
    eyes: 'goggles', pose: 'wave', prop: 'none', accent: colors.blue,
  },
  sobaeksan: {
    image: require('../../assets/mascots/sobaeksan.png'),
    body: colors.pink, patch: colors.surface, face: illustration.faceCream,
    eyes: 'dots', pose: 'cheer', prop: 'none', accent: colors.red,
  },
};

const BODY_CYCLE: string[] = [colors.blue, colors.red, colors.yellow, colors.pink, colors.green, colors.orange];
const FACE_CYCLE: string[] = [illustration.faceCream, illustration.faceSkin, colors.yellow, colors.blue, colors.pink, colors.surface];
const EYES_CYCLE: MascotEyes[] = ['dots', 'shades', 'goggles', 'wide', 'sleepy'];
const POSE_CYCLE: MascotPose[] = ['cheer', 'wave', 'sit'];
const PROP_CYCLE: MascotProp[] = ['none', 'flag', 'flower', 'tree', 'none', 'hat', 'none'];
const ACCENT_CYCLE: string[] = [colors.yellow, colors.blue, colors.green, colors.pink, colors.red, colors.orange];

function hash(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function getMascotLook(mascotKey: string | null | undefined): MascotLook {
  const key = mascotKey ?? 'default';
  const curated = CURATED[key];
  if (curated) return curated;

  const h = hash(key);
  const body = BODY_CYCLE[h % BODY_CYCLE.length] ?? colors.blue;
  let face = FACE_CYCLE[(h >> 3) % FACE_CYCLE.length] ?? illustration.faceCream;
  if (face === body) face = illustration.faceCream;
  let accent = ACCENT_CYCLE[(h >> 9) % ACCENT_CYCLE.length] ?? colors.yellow;
  if (accent === body) accent = colors.ink;

  return {
    body,
    patch: body === colors.surface ? illustration.faceCream : colors.surface,
    face,
    eyes: EYES_CYCLE[(h >> 5) % EYES_CYCLE.length] ?? 'dots',
    pose: POSE_CYCLE[(h >> 7) % POSE_CYCLE.length] ?? 'cheer',
    prop: PROP_CYCLE[(h >> 11) % PROP_CYCLE.length] ?? 'none',
    accent,
  };
}

/** Official yellow Guide artwork. */
export const GUIDE_MASCOT: MascotLook = {
  image: require('../../assets/mascots/guide.png'),
  body: colors.yellow,
  patch: colors.surface,
  face: illustration.faceCream,
  eyes: 'dots',
  pose: 'wave',
  prop: 'none',
  accent: colors.green,
};

/**
 * Shared-certification moments reuse the official Guide artwork until a
 * dedicated official party asset exists. Never procedural.
 */
export const PARTY_MASCOT: MascotLook = GUIDE_MASCOT;

/** True when the mountain has approved artwork in assets/mascots. */
export function hasOfficialMascot(mascotKey: string | null | undefined): boolean {
  return Boolean(mascotKey && CURATED[mascotKey]?.image);
}

/**
 * Common placeholder for mountains whose artwork is not ready: the official
 * Guide silhouette. Used in the collection instead of generating a character.
 */
export const PLACEHOLDER_MASCOT: MascotLook = GUIDE_MASCOT;
