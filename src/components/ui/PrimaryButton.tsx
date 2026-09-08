import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';

import { AppText } from './AppText';

export type PrimaryButtonTone = 'blue' | 'yellow' | 'black';

export interface PrimaryButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  tone?: PrimaryButtonTone;
  loading?: boolean;
  fullWidth?: boolean;
}

const toneStyles: Record<PrimaryButtonTone, { background: string; text: 'ink' | 'surface' }> = {
  blue: { background: colors.blue, text: 'surface' },
  yellow: { background: colors.yellow, text: 'ink' },
  black: { background: colors.ink, text: 'surface' },
};

/** Large CTA — blue, yellow, or black per spec §2.3. */
export function PrimaryButton({
  label,
  tone = 'blue',
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  const { background, text } = toneStyles[tone];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background },
        fullWidth ? styles.fullWidth : null,
        pressed ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors[text]} />
        ) : (
          <AppText variant="button" color={text}>
            {label}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radii.card,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
});
