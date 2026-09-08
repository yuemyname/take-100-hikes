import { useEffect, useState } from 'react';
import { Animated, StyleSheet, type DimensionValue } from 'react-native';

import { colors, radii, spacing } from '@/constants';

export interface LoadingSkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  /** Number of stacked blocks. */
  lines?: number;
}

/** Pulsing placeholder block for async content — spec §16. */
export function LoadingSkeleton({ width = '100%', height = 16, radius = radii.chip, lines = 1 }: LoadingSkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <>
      {Array.from({ length: lines }).map((_, index) => (
        <Animated.View
          key={index}
          accessibilityLabel="불러오는 중"
          style={[
            styles.block,
            { width, height, borderRadius: radius, opacity },
            index > 0 ? styles.gap : null,
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceMuted },
  gap: { marginTop: spacing.sm },
});
