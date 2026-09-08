import type { TextStyle } from 'react-native';

/**
 * Typography scale — 100PEAKS_MASTER_SPEC.md §2.4.
 * Values are size / lineHeight / weight. Pretendard is preferred; until the
 * font files are bundled we fall back to the platform Korean sans-serif.
 */
export const fontFamily = {
  ui: undefined as string | undefined,
} as const;

type Variant = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight'>;

export const typography = {
  displayXL: { fontSize: 40, lineHeight: 46, fontWeight: '800' },
  displayL: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  heading1: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  // Spec weight is 750; React Native only accepts hundreds, so 700 is used.
  heading2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading3: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
} as const satisfies Record<string, Variant>;

export type TypographyVariant = keyof typeof typography;
