import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { colors } from '@/constants';

export type MascotFace = 'happy' | 'sleepy' | 'shades' | 'wow' | 'wink';
export type MascotProp = 'none' | 'flag' | 'snow' | 'tree' | 'rock' | 'flower';

export interface MascotLook {
  body: string;
  belly: string;
  accent: string;
  face: MascotFace;
  prop: MascotProp;
}

export interface MascotProps {
  look: MascotLook;
  size?: number;
  /** Locked mountains render a flat silhouette with a question mark. */
  silhouette?: boolean;
  /** Small tilt in degrees for a pasted-on sticker feel. */
  tilt?: number;
  accessibilityLabel?: string;
}

const VIEW = 100;

/**
 * Builds a wobbly closed path around an ellipse: the "fuzzy" outline.
 * Deterministic per (bumps, seed) so re-renders never jitter.
 */
function fuzzyPath(cx: number, cy: number, rx: number, ry: number, bumps: number, seed: number): string {
  const points: string[] = [];
  for (let i = 0; i < bumps; i += 1) {
    const t = (i / bumps) * Math.PI * 2;
    const wobble = 1 + 0.06 * Math.sin(seed + i * 2.3) + 0.04 * Math.cos(seed * 1.7 + i * 5.1);
    const x = cx + Math.cos(t) * rx * wobble;
    const y = cy + Math.sin(t) * ry * wobble;
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M ${points[0]} L ${points.slice(1).join(' L ')} Z`;
}

function Face({ face, accent }: { face: MascotFace; accent: string }) {
  const ink = colors.ink;
  switch (face) {
    case 'shades':
      return (
        <G>
          <Rect x={30} y={38} width={17} height={11} rx={4} fill={ink} />
          <Rect x={53} y={38} width={17} height={11} rx={4} fill={ink} />
          <Line x1={47} y1={43} x2={53} y2={43} stroke={ink} strokeWidth={2.5} />
          <Path d="M 42 60 Q 50 66 58 60" stroke={ink} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'sleepy':
      return (
        <G>
          <Path d="M 33 44 Q 39 40 45 44" stroke={ink} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Path d="M 55 44 Q 61 40 67 44" stroke={ink} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Ellipse cx={50} cy={60} rx={4} ry={3} fill={ink} />
        </G>
      );
    case 'wow':
      return (
        <G>
          <Circle cx={39} cy={43} r={5} fill={ink} />
          <Circle cx={61} cy={43} r={5} fill={ink} />
          <Circle cx={40.5} cy={41.5} r={1.6} fill={colors.surface} />
          <Circle cx={62.5} cy={41.5} r={1.6} fill={colors.surface} />
          <Ellipse cx={50} cy={61} rx={5} ry={6} fill={ink} />
          <Ellipse cx={50} cy={63} rx={3} ry={2.5} fill={accent} />
        </G>
      );
    case 'wink':
      return (
        <G>
          <Circle cx={39} cy={43} r={4.5} fill={ink} />
          <Path d="M 55 43 Q 61 39 67 43" stroke={ink} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Path d="M 40 59 Q 50 68 60 59" stroke={ink} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'happy':
    default:
      return (
        <G>
          <Circle cx={39} cy={43} r={4.5} fill={ink} />
          <Circle cx={61} cy={43} r={4.5} fill={ink} />
          <Circle cx={40.5} cy={41.5} r={1.4} fill={colors.surface} />
          <Circle cx={62.5} cy={41.5} r={1.4} fill={colors.surface} />
          <Path d="M 42 58 Q 50 65 58 58" stroke={ink} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Circle cx={30} cy={53} r={3.5} fill={accent} opacity={0.8} />
          <Circle cx={70} cy={53} r={3.5} fill={accent} opacity={0.8} />
        </G>
      );
  }
}

function Prop({ prop, accent }: { prop: MascotProp; accent: string }) {
  const ink = colors.ink;
  switch (prop) {
    case 'flag':
      return (
        <G>
          <Line x1={84} y1={20} x2={84} y2={62} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M 85 21 L 99 27 L 85 33 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        </G>
      );
    case 'snow':
      return (
        <G stroke={accent} strokeWidth={2} strokeLinecap="round">
          <Line x1={16} y1={16} x2={16} y2={26} />
          <Line x1={11} y1={21} x2={21} y2={21} />
          <Line x1={12.5} y1={17.5} x2={19.5} y2={24.5} />
          <Line x1={19.5} y1={17.5} x2={12.5} y2={24.5} />
          <Circle cx={86} cy={14} r={2} fill={accent} stroke="none" />
          <Circle cx={92} cy={24} r={1.5} fill={accent} stroke="none" />
        </G>
      );
    case 'tree':
      return (
        <G>
          <Path d="M 88 12 L 97 28 L 79 28 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M 88 20 L 99 38 L 77 38 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <Rect x={86} y={38} width={4} height={6} fill={ink} />
        </G>
      );
    case 'rock':
      return (
        <Path
          d="M 8 86 L 14 72 L 26 70 L 32 80 L 28 90 L 12 92 Z"
          fill={accent}
          stroke={ink}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case 'flower':
      return (
        <G>
          {[0, 72, 144, 216, 288].map((deg) => (
            <Ellipse
              key={deg}
              cx={16}
              cy={18}
              rx={3.2}
              ry={5.5}
              fill={accent}
              stroke={ink}
              strokeWidth={1.5}
              transform={`rotate(${deg} 16 24)`}
            />
          ))}
          <Circle cx={16} cy={24} r={3} fill={colors.yellow} stroke={ink} strokeWidth={1.5} />
        </G>
      );
    case 'none':
    default:
      return null;
  }
}

/**
 * Original 100PEAKS mascot: a fuzzy, wobbly-outlined creature with a pale
 * belly and a naive face. Every mountain gets its own look (see
 * src/data/mascots.ts); locked mountains show a silhouette.
 */
export function Mascot({ look, size = 96, silhouette = false, tilt = 0, accessibilityLabel }: MascotProps) {
  const body = useMemo(() => fuzzyPath(50, 54, 36, 38, 40, 3), []);
  const armL = useMemo(() => fuzzyPath(16, 62, 10, 7, 18, 7), []);
  const armR = useMemo(() => fuzzyPath(84, 62, 10, 7, 18, 11), []);
  const bodyFill = silhouette ? colors.border : look.body;
  const ink = colors.ink;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? (silhouette ? '아직 만나지 못한 캐릭터' : '산 캐릭터')}
      style={{ width: size, height: size, transform: [{ rotate: `${tilt}deg` }] }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        {!silhouette ? <Prop prop={look.prop} accent={look.accent} /> : null}
        <Path d={armL} fill={bodyFill} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        <Path d={armR} fill={bodyFill} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        <Ellipse cx={36} cy={91} rx={11} ry={5.5} fill={bodyFill} stroke={ink} strokeWidth={2.5} />
        <Ellipse cx={64} cy={91} rx={11} ry={5.5} fill={bodyFill} stroke={ink} strokeWidth={2.5} />
        <Path d={body} fill={bodyFill} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        {silhouette ? (
          <G>
            <Path
              d="M 42 42 Q 42 33 50 33 Q 58 33 58 41 Q 58 47 51 50 L 51 56"
              stroke={colors.inkMuted}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
            <Circle cx={51} cy={66} r={3} fill={colors.inkMuted} />
          </G>
        ) : (
          <G>
            <Ellipse cx={50} cy={72} rx={15} ry={11} fill={look.belly} stroke={ink} strokeWidth={2} />
            <Face face={look.face} accent={look.accent} />
          </G>
        )}
      </Svg>
    </View>
  );
}
