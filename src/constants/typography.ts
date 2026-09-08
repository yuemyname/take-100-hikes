import type { TextStyle } from 'react-native';

/**
 * Typography scale — 100PEAKS_MASTER_SPEC.md §2.4.
 * UI text uses Pretendard (loaded in app/_layout.tsx). Hand-written display
 * text (speech bubbles, stickers) uses Gaegu and is opt-in via `display`.
 */
export const fontFamily = {
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extraBold: 'Pretendard-ExtraBold',
  /** Hand-drawn display face for playful copy only. */
  display: 'Gaegu_700Bold',
} as const;

export type FontWeightToken = '500' | '600' | '700' | '800';

export const fontFamilyForWeight: Record<FontWeightToken, string> = {
  '500': fontFamily.medium,
  '600': fontFamily.semiBold,
  '700': fontFamily.bold,
  '800': fontFamily.extraBold,
};

type Variant = Pick<TextStyle, 'fontSize' | 'lineHeight'> & { fontWeight: FontWeightToken };

export const typography = {
  displayXL: { fontSize: 40, lineHeight: 46, fontWeight: '800' },
  displayL: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  heading1: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  // Spec weight is 750; Pretendard ships Bold (700) and ExtraBold (800).
  heading2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading3: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
} as const satisfies Record<string, Variant>;

export type TypographyVariant = keyof typeof typography;
