import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/constants';

export interface CheckBadgeProps {
  size?: number;
}

/** Green "collected" badge — spec §4.2 completed state. */
export function CheckBadge({ size = 26 }: CheckBadgeProps) {
  return (
    <View
      accessibilityLabel="인증 완료"
      style={[styles.badge, { width: size, height: size, borderRadius: radii.pill }]}
    >
      <MaterialCommunityIcons name="check-bold" size={size * 0.6} color={colors.surface} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
