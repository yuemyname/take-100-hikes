import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';

import { AppText } from './AppText';

export interface SecondaryButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  fullWidth?: boolean;
}

/** Outlined button on cream/white surfaces. */
export function SecondaryButton({ label, fullWidth = true, disabled, ...rest }: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        fullWidth ? styles.fullWidth : null,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <AppText variant="button">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET + 8,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.45 },
});
