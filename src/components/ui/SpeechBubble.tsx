import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/constants';

import { AppText } from './AppText';

export interface SpeechBubbleProps {
  text: string;
  tone?: 'surface' | 'yellow' | 'pink';
  tailPosition?: 'left' | 'right';
  style?: ViewStyle;
}

/** Playful mascot speech bubble — spec §2.5. */
export function SpeechBubble({ text, tone = 'surface', tailPosition = 'left', style }: SpeechBubbleProps) {
  const background = tone === 'surface' ? colors.surface : colors[tone];
  const textColor = tone === 'pink' ? 'surface' : 'ink';

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.bubble, { backgroundColor: background }]}>
        <AppText variant="bodySmall" color={textColor} style={styles.text}>
          {text}
        </AppText>
      </View>
      <View
        style={[
          styles.tail,
          { borderTopColor: background },
          tailPosition === 'left' ? styles.tailLeft : styles.tailRight,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  text: { fontWeight: '700' },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  tailLeft: { marginLeft: spacing.xl },
  tailRight: { alignSelf: 'flex-end', marginRight: spacing.xl },
});
