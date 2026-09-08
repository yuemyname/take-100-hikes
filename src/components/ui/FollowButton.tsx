import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import type { RelationshipState } from '@/types';

import { AppText } from './AppText';

export interface FollowButtonProps {
  relationship: RelationshipState;
  onPress: () => void;
  loading?: boolean;
  compact?: boolean;
}

const LABELS: Record<RelationshipState, string> = {
  none: '팔로우',
  follower: '맞팔로우',
  following: '팔로잉',
  mutual: '맞팔 친구',
};

/** Follow state control — spec §7.1. Mutual is the state that unlocks shared certification. */
export function FollowButton({ relationship, onPress, loading = false, compact = false }: FollowButtonProps) {
  const active = relationship === 'following' || relationship === 'mutual';
  const mutual = relationship === 'mutual';
  const label = LABELS[relationship];
  const hint = active ? '누르면 팔로우를 취소해요' : '누르면 팔로우해요';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected: active, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : null,
        active ? styles.active : styles.inactive,
        mutual ? styles.mutual : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={active ? colors.ink : colors.surface} />
      ) : (
        <>
          {mutual ? <MaterialCommunityIcons name="swap-horizontal-bold" size={16} color={colors.ink} /> : null}
          <AppText variant="bodySmall" weight="700" color={active ? 'ink' : 'surface'}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  compact: { minWidth: 84, paddingHorizontal: spacing.md },
  inactive: { backgroundColor: colors.ink, borderColor: colors.ink },
  active: { backgroundColor: colors.surface, borderColor: colors.ink },
  mutual: { backgroundColor: colors.yellow, borderColor: colors.ink },
  pressed: { opacity: 0.85 },
});
