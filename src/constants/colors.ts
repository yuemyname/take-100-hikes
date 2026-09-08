/**
 * Canonical color tokens — 100PEAKS_MASTER_SPEC.md §2.3.
 * Background is warm cream, text is black, saturated colors are accents only.
 */
export const colors = {
  background: '#FFF9ED',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F1EA',
  ink: '#111111',
  inkMuted: '#6E6B65',
  border: '#E7E2D8',

  blue: '#245BFF',
  red: '#FF3B30',
  yellow: '#FFD928',
  green: '#20C05C',
  pink: '#FF4FA3',
  orange: '#FF8A2B',

  success: '#20C05C',
  warning: '#FFB020',
  danger: '#FF3B30',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Photography placeholder tones. These are deliberately dark and desaturated
 * so an empty photo slot still reads as a serious mountain, never as a broken
 * image. Not for UI chrome; use `colors` for that.
 */
export const photoTones = {
  sky: '#2B2A27',
  ridgeFar: '#4A4843',
  ridgeNear: '#1A1917',
} as const;
