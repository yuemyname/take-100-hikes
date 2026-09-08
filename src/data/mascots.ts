import type { MascotEyes, MascotLook, MascotPose, MascotProp } from '@/components/ui/Mascot';
import { colors, illustration } from '@/constants';

/**
 * Per-mountain mascot looks — 100PEAKS_MASTER_SPEC.md §2.6 and the UI concept
 * in docs/references. Curated entries first; every other mountain gets a
 * deterministic look derived from its mascot key so the full collection
 * renders today and artwork can be upgraded one mountain at a time.
 *
 * To replace a character with a raster illustration, add
 * `image: require('../../assets/mascots/<key>.png')` to its entry.
 */
const CURATED: Record<string, MascotLook> = {
  // white yeti with a blue face — 설악산
  seoraksan: { body: colors.surface, patch: illustration.faceCream, face: colors.blue, eyes: 'wide', pose: 'wave', prop: 'snow', accent: colors.blue },
  // green monster with a hot volcanic face — 한라산
  hallasan: { body: colors.green, patch: illustration.faceCream, face: colors.red, eyes: 'shades', pose: 'cheer', prop: 'flag', accent: colors.orange },
  // gray rock-like sleepy monster — 북한산
  bukhansan: { body: colors.inkMuted, patch: colors.surfaceMuted, face: illustration.faceCream, eyes: 'sleepy', pose: 'sit', prop: 'rock', accent: colors.yellow },
  // earthy forest monster with a tree — 지리산
  jirisan: { body: colors.orange, patch: illustration.faceCream, face: colors.green, eyes: 'dots', pose: 'wave', prop: 'tree', accent: colors.green },
  // winter ridge, blue with a snowy face — 덕유산
  deogyusan: { body: colors.blue, patch: colors.surface, face: illustration.faceCream, eyes: 'goggles', pose: 'cheer', prop: 'snow', accent: colors.pink },
  // azalea pink — 소백산
  sobaeksan: { body: colors.pink, patch: illustration.faceCream, face: colors.yellow, eyes: 'dots', pose: 'sit', prop: 'flower', accent: colors.red },
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

/** The yellow guide with blue goggles that appears on Home and the auth screens. */
export const GUIDE_MASCOT: MascotLook = {
  body: colors.yellow,
  patch: colors.surface,
  face: illustration.faceCream,
  eyes: 'goggles',
  pose: 'cheer',
  prop: 'none',
  accent: colors.blue,
};

/** Red monster used for shared-certification moments (spec §6, concept board). */
export const PARTY_MASCOT: MascotLook = {
  body: colors.red,
  patch: colors.surface,
  face: colors.yellow,
  eyes: 'shades',
  pose: 'cheer',
  prop: 'none',
  accent: colors.blue,
};
