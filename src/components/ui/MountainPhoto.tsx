import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { colors, photoTones } from '@/constants';

export interface MountainPhotoProps {
  uri?: string | null;
  /** Rounded corners; pass 0 for full-bleed. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Seed for the placeholder ridge shape so cards do not all look identical. */
  seed?: number;
  accessibilityLabel?: string;
}


function ridge(seed: number, baseline: number, amplitude: number): string {
  const pts: string[] = ['M 0 100', `L 0 ${baseline}`];
  for (let x = 0; x <= 100; x += 10) {
    const y = baseline - amplitude * (0.55 + 0.45 * Math.sin(seed * 1.3 + x * 0.19)) * (0.6 + 0.4 * Math.cos(seed + x * 0.07));
    pts.push(`L ${x} ${y.toFixed(1)}`);
  }
  pts.push('L 100 100 Z');
  return pts.join(' ');
}

/**
 * Serious mountain photography slot. Renders the real photo when a URL exists;
 * otherwise a dark, layered ridge silhouette so empty slots still read as
 * "mountain", not "missing image".
 */
export function MountainPhoto({ uri, radius = 0, style, seed = 1, accessibilityLabel }: MountainPhotoProps) {
  return (
    <View
      style={[styles.wrap, { borderRadius: radius }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? '산 사진'}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Circle cx={78} cy={22} r={8} fill={colors.surface} opacity={0.85} />
          <Path d={ridge(seed, 62, 30)} fill={photoTones.ridgeFar} />
          <Path d={ridge(seed + 4, 78, 26)} fill={photoTones.ridgeNear} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: photoTones.sky },
});
