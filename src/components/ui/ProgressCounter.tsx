import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import { TOTAL_MOUNTAINS } from '@/types';

import { AppText } from './AppText';

export interface ProgressCounterProps {
  completed: number;
  total?: number;
  /** Optional playful line under the number, e.g. "아직 63개나 남았는데?" */
  caption?: string;
  size?: 'md' | 'lg';
}

/** The `37 / 100` hero number with a progress bar — spec §4.1, §8. */
export function ProgressCounter({ completed, total = TOTAL_MOUNTAINS, caption, size = 'lg' }: ProgressCounterProps) {
  const safeCompleted = Math.max(0, Math.min(completed, total));
  const ratio = total > 0 ? safeCompleted / total : 0;

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: safeCompleted }}>
      <View style={styles.numberRow}>
        <AppText variant={size === 'lg' ? 'displayXL' : 'displayL'}>{safeCompleted}</AppText>
        <AppText variant={size === 'lg' ? 'heading1' : 'heading2'} color="inkMuted" style={styles.total}>
          {' / '}
          {total}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      {caption ? (
        <AppText variant="heading3" style={styles.caption}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  numberRow: { flexDirection: 'row', alignItems: 'baseline' },
  total: { marginLeft: spacing.xs },
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  fill: { height: '100%', backgroundColor: colors.blue, borderRadius: radii.pill },
  caption: { marginTop: spacing.md },
});
