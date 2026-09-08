import type { MascotFace, MascotLook, MascotProp } from '@/components/ui/Mascot';
import { colors } from '@/constants';

/**
 * Per-mountain mascot looks — 100PEAKS_MASTER_SPEC.md §2.6.
 * Hand-tuned entries first; every other mountain gets a deterministic look
 * derived from its mascot key so the full collection renders today and
 * artwork can be upgraded one mountain at a time.
 */
const CURATED: Record<string, MascotLook> = {
  seoraksan: { body: colors.surface, belly: colors.surfaceMuted, accent: colors.blue, face: 'wow', prop: 'snow' },
  hallasan: { body: colors.green, belly: colors.surface, accent: colors.orange, face: 'shades', prop: 'flag' },
  bukhansan: { body: colors.inkMuted, belly: colors.surfaceMuted, accent: colors.yellow, face: 'sleepy', prop: 'rock' },
  jirisan: { body: colors.orange, belly: colors.surface, accent: colors.green, face: 'happy', prop: 'tree' },
  deogyusan: { body: colors.blue, belly: colors.surface, accent: colors.surface, face: 'wink', prop: 'snow' },
  sobaeksan: { body: colors.pink, belly: colors.surface, accent: colors.yellow, face: 'happy', prop: 'flower' },
};

const BODY_CYCLE: string[] = [colors.blue, colors.red, colors.yellow, colors.pink, colors.green, colors.orange];
const ACCENT_CYCLE: string[] = [colors.yellow, colors.surface, colors.blue, colors.green, colors.pink, colors.red];
const FACE_CYCLE: MascotFace[] = ['happy', 'shades', 'wow', 'wink', 'sleepy'];
const PROP_CYCLE: MascotProp[] = ['none', 'flag', 'flower', 'tree', 'none', 'rock', 'snow'];

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
  let accent = ACCENT_CYCLE[(h >> 3) % ACCENT_CYCLE.length] ?? colors.yellow;
  if (accent === body) accent = colors.ink;

  return {
    body,
    belly: body === colors.yellow ? colors.surface : colors.surfaceMuted,
    accent,
    face: FACE_CYCLE[(h >> 6) % FACE_CYCLE.length] ?? 'happy',
    prop: PROP_CYCLE[(h >> 9) % PROP_CYCLE.length] ?? 'none',
  };
}

/** The friendly yellow guide that appears on Home and the auth screens. */
export const GUIDE_MASCOT: MascotLook = {
  body: colors.yellow,
  belly: colors.surface,
  accent: colors.pink,
  face: 'happy',
  prop: 'none',
};
