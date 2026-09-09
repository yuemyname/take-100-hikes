import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export interface WordmarkProps {
  /** Rendered wordmark height in points. */
  size?: number;
  /** Kept for API compatibility. The official wordmark is always multicolor. */
  multicolor?: boolean;
}

const OFFICIAL_WORDMARK = require('../../../assets/brand/wordmark-color.png');
const WORDMARK_ASPECT_RATIO = 3;

/**
 * Hand-drawn 100PEAKS wordmark taken from the approved visual concept.
 * It is a single raster asset so letter shapes, rough edges, and colors remain
 * identical everywhere it appears.
 */
export function Wordmark({ size = 28 }: WordmarkProps) {
  return (
    <View
      style={[styles.wrap, { width: size * WORDMARK_ASPECT_RATIO, height: size }]}
      accessibilityRole="header"
      accessibilityLabel="100PEAKS"
    >
      <Image source={OFFICIAL_WORDMARK} contentFit="contain" style={StyleSheet.absoluteFill} accessible={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'visible' },
});
