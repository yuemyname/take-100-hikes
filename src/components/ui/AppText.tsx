import { Text, type TextProps, StyleSheet } from 'react-native';

import { colors, fontFamily, typography, type ColorToken, type TypographyVariant } from '@/constants';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
}

/** Typography primitive. Every visible string in the app should go through this. */
export function AppText({
  variant = 'body',
  color = 'ink',
  align,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        typography[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamily.ui,
    includeFontPadding: false,
  },
});
