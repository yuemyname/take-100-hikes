import { useMemo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { colors, illustration } from '@/constants';

/**
 * 100PEAKS mascot artwork.
 *
 * Direction (docs/references, UI concept): full-body fuzzy monsters with long
 * arms, a small naive face set into the fur, a pale fuzzy belly and pale
 * hands/feet, one strong flat color, a jagged fur outline in black ink and a
 * few hand-drawn fur strokes inside. They are drawn large and sit on top of
 * the mountain photography.
 *
 * Every shape is authored as a path with a generated fur edge, so the same
 * character scales from a 40pt row thumbnail to a full-width hero. A raster
 * illustration can override any character via `look.image`.
 */

export type MascotEyes = 'dots' | 'shades' | 'goggles' | 'sleepy' | 'wide';
export type MascotPose = 'cheer' | 'wave' | 'sit';
export type MascotProp = 'none' | 'flag' | 'snow' | 'tree' | 'rock' | 'flower' | 'hat';

export interface MascotLook {
  /** Fur color. */
  body: string;
  /** Belly / hands / feet patch color (usually near-white). */
  patch: string;
  /** Face patch color. */
  face: string;
  eyes: MascotEyes;
  pose: MascotPose;
  prop: MascotProp;
  /** Accent used by props / goggles. */
  accent: string;
  /** Optional raster artwork; when present it replaces the vector drawing. */
  image?: number | { uri: string };
}

export interface MascotProps {
  look: MascotLook;
  /** Rendered width in points. The artwork is portrait (5:6). */
  size?: number;
  /** Locked mountains render a flat silhouette with a question mark. */
  silhouette?: boolean;
  /** Small tilt in degrees for a pasted-on feel. */
  tilt?: number;
  /** Mirror horizontally so a character can face the other way. */
  flip?: boolean;
  accessibilityLabel?: string;
}

const W = 200;
const H = 240;

// ---------------------------------------------------------------------------
// Fur-edge geometry
// ---------------------------------------------------------------------------

type Pt = [number, number];

/** Deterministic noise in [0, 1). */
function noise(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Sample a rotated ellipse as a polygon. */
function ellipsePoints(cx: number, cy: number, rx: number, ry: number, rot = 0, n = 48): Pt[] {
  const pts: Pt[] = [];
  const cos = Math.cos((rot * Math.PI) / 180);
  const sin = Math.sin((rot * Math.PI) / 180);
  for (let i = 0; i < n; i += 1) {
    const t = (i / n) * Math.PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    pts.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
  }
  return pts;
}

/**
 * Turns a polygon into a closed path whose edge is a row of small fur tufts:
 * each segment gets a jagged spike pushed outward by a seeded random amount.
 */
function furPath(points: Pt[], tuft: number, seed: number): string {
  const n = points.length;
  const cx = points.reduce((s, p) => s + p[0], 0) / n;
  const cy = points.reduce((s, p) => s + p[1], 0) / n;
  const parts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    // outward normal: away from the centroid
    let nx = my - cy;
    let ny = -(mx - cx);
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const dot = nx * (mx - cx) + ny * (my - cy);
    if (dot < 0) {
      nx = -nx;
      ny = -ny;
    }
    const k = tuft * (0.55 + noise(seed, i) * 0.9);
    const lean = (noise(seed + 7, i) - 0.5) * tuft * 0.6;
    const tx = mx + nx * k - ny * lean;
    const ty = my + ny * k + nx * lean;
    parts.push(i === 0 ? `M ${a[0].toFixed(1)} ${a[1].toFixed(1)}` : '');
    parts.push(`L ${tx.toFixed(1)} ${ty.toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  return `${parts.join(' ')} Z`;
}

interface Part {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot?: number;
}

interface PoseSpec {
  body: Part[];
  hands: Pt[];
  feet: Part[];
  belly: Part;
  face: Part;
  propAnchor: Pt;
}

/** Full-body poses. Coordinates are in the 200 x 240 art box. */
const POSES: Record<MascotPose, PoseSpec> = {
  cheer: {
    body: [
      { cx: 100, cy: 140, rx: 60, ry: 72 }, // torso
      { cx: 100, cy: 76, rx: 50, ry: 46 }, // head, merges into torso (no neck)
      { cx: 40, cy: 68, rx: 16, ry: 60, rot: -18 }, // left arm raised high (top end leans outward)
      { cx: 160, cy: 68, rx: 16, ry: 60, rot: 18 }, // right arm raised high
      { cx: 76, cy: 200, rx: 22, ry: 28 }, // legs
      { cx: 124, cy: 200, rx: 22, ry: 28 },
    ],
    hands: [
      [22, 16],
      [178, 16],
    ],
    feet: [
      { cx: 72, cy: 226, rx: 20, ry: 9 },
      { cx: 128, cy: 226, rx: 20, ry: 9 },
    ],
    belly: { cx: 100, cy: 150, rx: 30, ry: 36 },
    face: { cx: 100, cy: 74, rx: 27, ry: 21 },
    propAnchor: [176, 40],
  },
  wave: {
    body: [
      { cx: 100, cy: 142, rx: 60, ry: 72 },
      { cx: 100, cy: 78, rx: 50, ry: 46 },
      { cx: 42, cy: 70, rx: 16, ry: 60, rot: -20 }, // left arm raised high
      { cx: 164, cy: 150, rx: 16, ry: 50, rot: -10 }, // right arm hanging
      { cx: 76, cy: 202, rx: 22, ry: 28 },
      { cx: 124, cy: 202, rx: 22, ry: 28 },
    ],
    hands: [
      [22, 16],
      [172, 198],
    ],
    feet: [
      { cx: 72, cy: 228, rx: 20, ry: 9 },
      { cx: 128, cy: 228, rx: 20, ry: 9 },
    ],
    belly: { cx: 100, cy: 152, rx: 30, ry: 36 },
    face: { cx: 100, cy: 76, rx: 27, ry: 21 },
    propAnchor: [166, 100],
  },
  sit: {
    body: [
      { cx: 100, cy: 150, rx: 66, ry: 66 },
      { cx: 100, cy: 86, rx: 52, ry: 48 },
      { cx: 34, cy: 156, rx: 16, ry: 52, rot: 46 }, // arms resting out on the ground
      { cx: 166, cy: 156, rx: 16, ry: 52, rot: -46 },
      { cx: 62, cy: 208, rx: 30, ry: 22, rot: -10 }, // legs forward
      { cx: 138, cy: 208, rx: 30, ry: 22, rot: 10 },
    ],
    hands: [
      [14, 190],
      [186, 190],
    ],
    feet: [
      { cx: 44, cy: 222, rx: 18, ry: 12 },
      { cx: 156, cy: 222, rx: 18, ry: 12 },
    ],
    belly: { cx: 100, cy: 160, rx: 32, ry: 34 },
    face: { cx: 100, cy: 84, rx: 27, ry: 21 },
    propAnchor: [178, 128],
  },
};

// ---------------------------------------------------------------------------
// Face + props
// ---------------------------------------------------------------------------

function Eyes({ eyes, cx, cy, accent }: { eyes: MascotEyes; cx: number; cy: number; accent: string }) {
  const ink = colors.ink;
  switch (eyes) {
    case 'shades':
      return (
        <G>
          <Rect x={cx - 24} y={cy - 9} width={21} height={13} rx={4} fill={ink} />
          <Rect x={cx + 3} y={cy - 9} width={21} height={13} rx={4} fill={ink} />
          <Line x1={cx - 3} y1={cy - 4} x2={cx + 3} y2={cy - 4} stroke={ink} strokeWidth={2.5} />
          <Line x1={cx - 24} y1={cy - 6} x2={cx - 30} y2={cy - 9} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={cx + 24} y1={cy - 6} x2={cx + 30} y2={cy - 9} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <Path d={`M ${cx - 6} ${cy + 10} Q ${cx} ${cy + 14} ${cx + 6} ${cy + 10}`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'goggles':
      return (
        <G>
          <Rect x={cx - 26} y={cy - 10} width={52} height={15} rx={7} fill={accent} stroke={ink} strokeWidth={2.2} />
          <Rect x={cx - 20} y={cy - 6} width={12} height={4} rx={2} fill={colors.surface} opacity={0.7} />
          <Line x1={cx - 26} y1={cy - 3} x2={cx - 34} y2={cy - 6} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={cx + 26} y1={cy - 3} x2={cx + 34} y2={cy - 6} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <Path d={`M ${cx - 5} ${cy + 11} Q ${cx} ${cy + 15} ${cx + 5} ${cy + 11}`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'sleepy':
      return (
        <G>
          <Path d={`M ${cx - 17} ${cy - 1} Q ${cx - 11} ${cy - 6} ${cx - 5} ${cy - 1}`} stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d={`M ${cx + 5} ${cy - 1} Q ${cx + 11} ${cy - 6} ${cx + 17} ${cy - 1}`} stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Ellipse cx={cx} cy={cy + 10} rx={4} ry={2.6} fill={ink} />
          <Path d={`M ${cx + 22} ${cy - 14} l 3 -6 l 3 6`} stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'wide':
      return (
        <G>
          <Circle cx={cx - 11} cy={cy - 1} r={6.5} fill={colors.surface} stroke={ink} strokeWidth={2} />
          <Circle cx={cx + 11} cy={cy - 1} r={6.5} fill={colors.surface} stroke={ink} strokeWidth={2} />
          <Circle cx={cx - 10} cy={cy} r={2.8} fill={ink} />
          <Circle cx={cx + 12} cy={cy} r={2.8} fill={ink} />
          <Ellipse cx={cx} cy={cy + 11} rx={4.5} ry={5} fill={ink} />
        </G>
      );
    case 'dots':
    default:
      return (
        <G>
          <Circle cx={cx - 10} cy={cy - 1} r={3.2} fill={ink} />
          <Circle cx={cx + 10} cy={cy - 1} r={3.2} fill={ink} />
          <Path d={`M ${cx - 6} ${cy + 8} Q ${cx} ${cy + 13} ${cx + 6} ${cy + 8}`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Circle cx={cx - 20} cy={cy + 6} r={3.5} fill={colors.pink} opacity={0.75} />
          <Circle cx={cx + 20} cy={cy + 6} r={3.5} fill={colors.pink} opacity={0.75} />
        </G>
      );
  }
}

function Prop({ prop, at, accent, seed }: { prop: MascotProp; at: Pt; accent: string; seed: number }) {
  const ink = colors.ink;
  const [x, y] = at;
  switch (prop) {
    case 'flag':
      return (
        <G>
          <Line x1={x} y1={y - 30} x2={x + 4} y2={y + 26} stroke={ink} strokeWidth={3} strokeLinecap="round" />
          <Path d={furPath([[x, y - 30], [x + 30, y - 22], [x + 2, y - 10]], 1.5, seed)} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        </G>
      );
    case 'snow':
      return (
        <G stroke={accent} strokeWidth={2.2} strokeLinecap="round">
          {[[x - 150, y - 8], [x + 6, y - 26], [x - 40, y + 150]].map(([sx, sy], i) => (
            <G key={i}>
              <Line x1={sx! - 6} y1={sy!} x2={sx! + 6} y2={sy!} />
              <Line x1={sx!} y1={sy! - 6} x2={sx!} y2={sy! + 6} />
              <Line x1={sx! - 4} y1={sy! - 4} x2={sx! + 4} y2={sy! + 4} />
              <Line x1={sx! + 4} y1={sy! - 4} x2={sx! - 4} y2={sy! + 4} />
            </G>
          ))}
        </G>
      );
    case 'tree':
      return (
        <G>
          <Path d={furPath([[x + 6, y - 34], [x + 26, y], [x - 14, y]], 2, seed)} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <Path d={furPath([[x + 6, y - 18], [x + 30, y + 18], [x - 18, y + 18]], 2, seed + 1)} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <Rect x={x + 3} y={y + 18} width={6} height={9} fill={ink} />
        </G>
      );
    case 'rock':
      return (
        <Path
          d="M 4 232 L 10 208 L 34 202 L 50 214 L 46 234 L 12 238 Z"
          fill={colors.surfaceMuted}
          stroke={ink}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case 'flower':
      return (
        <G>
          {[0, 72, 144, 216, 288].map((deg) => (
            <Ellipse key={deg} cx={x} cy={y - 8} rx={4} ry={7} fill={accent} stroke={ink} strokeWidth={1.6} transform={`rotate(${deg} ${x} ${y})`} />
          ))}
          <Circle cx={x} cy={y} r={4} fill={colors.yellow} stroke={ink} strokeWidth={1.6} />
        </G>
      );
    case 'hat':
      return (
        <G>
          <Path d={`M 62 44 Q 100 20 138 44 L 132 40 Q 100 30 68 40 Z`} fill={accent} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d={`M 74 42 Q 100 -2 126 42 Z`} fill={accent} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
        </G>
      );
    case 'none':
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Mascot({ look, size = 120, silhouette = false, tilt = 0, flip = false, accessibilityLabel }: MascotProps) {
  const height = (size * H) / W;
  const label = accessibilityLabel ?? (silhouette ? '아직 만나지 못한 캐릭터' : '산 캐릭터');
  const transform = [{ rotate: `${tilt}deg` }, { scaleX: flip ? -1 : 1 }];

  const seed = useMemo(() => {
    let h = 0;
    for (const ch of `${look.body}${look.pose}${look.prop}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return (h % 1000) / 10;
  }, [look.body, look.pose, look.prop]);

  const art = useMemo(() => {
    const pose = POSES[look.pose];
    const bodyPaths = pose.body.map((p, i) => furPath(ellipsePoints(p.cx, p.cy, p.rx, p.ry, p.rot ?? 0, 56), 7, seed + i));
    const bellyPath = furPath(ellipsePoints(pose.belly.cx, pose.belly.cy, pose.belly.rx, pose.belly.ry, 0, 32), 4, seed + 20);
    const facePath = furPath(ellipsePoints(pose.face.cx, pose.face.cy, pose.face.rx, pose.face.ry, 0, 28), 3, seed + 21);
    const handPaths = pose.hands.map((h, i) => furPath(ellipsePoints(h[0], h[1], 14, 12, 0, 20), 3.5, seed + 30 + i));
    const feetPaths = pose.feet.map((f, i) => furPath(ellipsePoints(f.cx, f.cy, f.rx, f.ry, 0, 22), 3, seed + 40 + i));
    // hand-drawn fur strokes inside the body
    const strokes: string[] = [];
    const torso = pose.body[0]!;
    for (let i = 0; i < 14; i += 1) {
      const a = noise(seed + 50, i) * Math.PI * 2;
      const r = 0.35 + noise(seed + 51, i) * 0.55;
      const x = torso.cx + Math.cos(a) * torso.rx * r;
      const y = torso.cy + Math.sin(a) * torso.ry * r;
      const dir = -0.6 + noise(seed + 52, i) * 1.2;
      strokes.push(`M ${x.toFixed(1)} ${y.toFixed(1)} l ${(4 * dir).toFixed(1)} 7 l ${(3 * dir).toFixed(1)} 6`);
    }
    return { pose, bodyPaths, bellyPath, facePath, handPaths, feetPaths, strokes };
  }, [look.pose, seed]);

  if (look.image && !silhouette) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height, transform }}>
        <Image source={look.image} style={StyleSheet.absoluteFill} contentFit="contain" />
      </View>
    );
  }

  const ink = colors.ink;
  const fur = silhouette ? colors.border : look.body;
  const patch = silhouette ? colors.surfaceMuted : look.patch;
  const face = silhouette ? colors.surfaceMuted : look.face;
  const { pose } = art;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height, transform }}>
      <Svg width={size} height={height} viewBox={`0 0 ${W} ${H}`}>
        {!silhouette ? <Prop prop={look.prop} at={pose.propAnchor} accent={look.accent} seed={seed} /> : null}

        {/* 1) ink outline around the union of all body parts */}
        <G fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="round">
          {art.bodyPaths.map((d, i) => (
            <Path key={`o${i}`} d={d} />
          ))}
        </G>
        {/* 2) flat fur fill hides inner strokes */}
        <G fill={fur}>
          {art.bodyPaths.map((d, i) => (
            <Path key={`f${i}`} d={d} />
          ))}
        </G>
        {/* 3) fur texture */}
        {!silhouette ? (
          <G stroke={illustration.furShade} strokeWidth={2} fill="none" strokeLinecap="round">
            {art.strokes.map((d, i) => (
              <Path key={`s${i}`} d={d} />
            ))}
          </G>
        ) : null}

        {/* 4) pale patches: belly, hands, feet */}
        <G fill={patch} stroke={ink} strokeWidth={2.2} strokeLinejoin="round">
          <Path d={art.bellyPath} />
          {art.handPaths.map((d, i) => (
            <Path key={`h${i}`} d={d} />
          ))}
          {art.feetPaths.map((d, i) => (
            <Path key={`t${i}`} d={d} />
          ))}
        </G>

        {/* 5) face patch + features */}
        <Path d={art.facePath} fill={face} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
        {silhouette ? (
          <G>
            <Path
              d={`M ${pose.face.cx - 8} ${pose.face.cy - 6} Q ${pose.face.cx - 8} ${pose.face.cy - 14} ${pose.face.cx} ${pose.face.cy - 14} Q ${pose.face.cx + 9} ${pose.face.cy - 14} ${pose.face.cx + 8} ${pose.face.cy - 6} Q ${pose.face.cx + 7} ${pose.face.cy - 1} ${pose.face.cx + 1} ${pose.face.cy + 2} L ${pose.face.cx + 1} ${pose.face.cy + 6}`}
              stroke={colors.inkMuted}
              strokeWidth={3.5}
              fill="none"
              strokeLinecap="round"
            />
            <Circle cx={pose.face.cx + 1} cy={pose.face.cy + 13} r={2.6} fill={colors.inkMuted} />
          </G>
        ) : (
          <Eyes eyes={look.eyes} cx={pose.face.cx} cy={pose.face.cy} accent={look.accent} />
        )}
        {look.prop === 'hat' && !silhouette ? <Prop prop="hat" at={pose.propAnchor} accent={look.accent} seed={seed} /> : null}
      </Svg>
    </View>
  );
}
