import { StyleSheet, View } from 'react-native';

import { colors, fontFamily } from '@/constants';

import { AppText } from './AppText';

export interface WordmarkProps {
  /** Text size in points. Default 22. */
  size?: number;
  /** Multicolor letters (hero use) or solid ink (top bars). */
  multicolor?: boolean;
}

const LETTERS = ['1', '0', '0', 'P', 'E', 'A', 'K', 'S'] as const;
const LETTER_COLORS = [
  colors.blue,
  colors.red,
  colors.yellow,
  colors.green,
  colors.pink,
  colors.orange,
  colors.blue,
  colors.red,
] as const;
const TILTS = [-4, 3, -2, 4, -3, 2, -4, 3] as const;

/**
 * Original 100PEAKS wordmark: heavy letters, each tilted a little and, in the
 * multicolor variant, filled with a different saturated token color.
 */
export function Wordmark({ size = 22, multicolor = false }: WordmarkProps) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="100PEAKS">
      {LETTERS.map((letter, index) => (
        <AppText
          key={`${letter}-${index}`}
          accessible={false}
          style={[
            styles.letter,
            {
              fontSize: size,
              lineHeight: size * 1.15,
              fontFamily: fontFamily.extraBold,
              color: multicolor ? LETTER_COLORS[index] : colors.ink,
              transform: multicolor ? [{ rotate: `${TILTS[index]}deg` }] : undefined,
            },
          ]}
        >
          {letter}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  letter: { letterSpacing: -0.5 },
});
