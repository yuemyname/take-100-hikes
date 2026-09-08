import { Text, type TextProps, type TextStyle, StyleSheet } from 'react-native';

import {
  colors,
  fontFamily,
  fontFamilyForWeight,
  typography,
  type ColorToken,
  type FontWeightToken,
  type TypographyVariant,
} from '@/constants';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
  /** Override the variant weight; picks the matching Pretendard face. */
  weight?: FontWeightToken;
  /** Use the hand-drawn display face (speech bubbles, stickers only). */
  display?: boolean;
}

/** Typography primitive. Every visible string in the app should go through this. */
export function AppText({
  variant = 'body',
  color = 'ink',
  align,
  weight,
  display = false,
  style,
  ...rest
}: AppTextProps) {
  const base = typography[variant];
  const resolvedWeight = weight ?? base.fontWeight;
  const family = display ? fontFamily.display : fontFamilyForWeight[resolvedWeight];

  const computed: TextStyle = {
    fontSize: base.fontSize,
    lineHeight: display ? base.lineHeight + 2 : base.lineHeight,
    fontFamily: family,
    color: colors[color],
  };

  return (
    <Text
      {...rest}
      style={[styles.base, computed, align ? { textAlign: align } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
