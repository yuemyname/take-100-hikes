import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/constants';

import { AppText } from './AppText';

export interface StickyNoteProps {
  lines: string[];
  tone?: 'yellow' | 'blue' | 'surface';
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}

/** Hand-written sticker note: the one deliberately imperfect element on a tidy screen. */
export function StickyNote({ lines, tone = 'yellow', tilt = -2, style }: StickyNoteProps) {
  const background = tone === 'surface' ? colors.surface : colors[tone];
  const textColor = tone === 'blue' ? 'surface' : 'ink';

  return (
    <View style={[styles.note, { backgroundColor: background, transform: [{ rotate: `${tilt}deg` }] }, style]}>
      <View style={styles.tape} />
      {lines.map((line, index) => (
        <AppText key={`${index}-${line}`} display variant="heading2" color={textColor} style={styles.line}>
          {line}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.chip / 2,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  tape: {
    position: 'absolute',
    top: -8,
    left: '40%',
    width: 44,
    height: 14,
    backgroundColor: colors.surface,
    opacity: 0.85,
    borderWidth: 1.5,
    borderColor: colors.border,
    transform: [{ rotate: '-6deg' }],
  },
  line: { lineHeight: 30 },
});
