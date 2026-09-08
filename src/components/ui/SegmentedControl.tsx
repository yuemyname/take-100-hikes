import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';

import { AppText } from './AppText';

export interface SegmentedControlProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}

/** Two-to-three way segmented switch (e.g. 소개 / 인증자). */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected ? styles.segmentSelected : null]}
          >
            <AppText variant="bodySmall" weight="700" color={selected ? 'surface' : 'inkMuted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  segmentSelected: { backgroundColor: colors.ink },
});
