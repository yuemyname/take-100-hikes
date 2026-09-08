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
