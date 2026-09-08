import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';

import { AppText } from './AppText';

export interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Accent color used when selected. Default black. */
  tone?: 'ink' | 'blue' | 'yellow' | 'green';
}

/** Filter chip / tag. Tappable when `onPress` is provided. */
export function Pill({ label, selected = false, onPress, tone = 'ink' }: PillProps) {
  const background = selected ? colors[tone] : colors.surface;
  const textColor = selected && tone !== 'yellow' ? 'surface' : 'ink';

  const inner = (
    <View style={[styles.pill, { backgroundColor: background, borderColor: selected ? background : colors.border }]}>
      <AppText variant="bodySmall" weight="700" color={textColor}>
        {label}
      </AppText>
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={styles.touch}
      hitSlop={4}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  pill: {
    borderRadius: radii.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
